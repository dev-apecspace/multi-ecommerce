const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function load(file, dependencies = {}) {
  const exports = {}
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  vm.runInNewContext(code, { exports, process, Date, require: name => {
    assert.ok(name in dependencies, `Unexpected dependency ${name}`)
    return dependencies[name]
  }, URL })
  return exports
}
const revenue = load('lib/order-revenue.ts')
const paid = { status: 'delivered', paymentMethod: 'bank', paymentStatus: 'paid', total: 1000 }
const returned = status => ({ status, returnType: 'return', refundAmount: 300 })

test('cancelled and returned orders never count, even if still marked paid', () => {
  for (const status of ['cancelled', 'returned']) {
    for (const paymentStatus of ['paid', 'pending', 'submitted', 'refunded']) {
      const order = { ...paid, status, paymentStatus }
      assert.equal(revenue.getOrderRevenue(order), 0)
      assert.equal(revenue.isRevenueEligible(order), false)
      assert.equal(revenue.isPendingRevenue(order), false)
    }
  }
})
test('refunded delivered orders are not counted as revenue or pending', () => {
  const order = { ...paid, paymentStatus: 'refunded' }
  assert.equal(revenue.getOrderRevenue(order), 0)
  assert.equal(revenue.isPendingRevenue(order), false)
})
test('accepted partial returns deduct their amount only once per record', () => {
  for (const status of ['approved', 'refund_confirmed', 'shipped', 'received', 'restocked', 'completed']) {
    assert.equal(revenue.getOrderRevenue({ ...paid, Return: [returned(status)] }), 700)
  }
  assert.equal(revenue.getOrderRevenue({ ...paid, Return: [returned('completed'), returned('approved')] }), 400)
})
test('pending, rejected, cancelled returns and exchanges do not deduct revenue', () => {
  for (const status of ['pending', 'rejected', 'cancelled']) {
    assert.equal(revenue.getOrderRevenue({ ...paid, Return: [returned(status)] }), 1000)
  }
  assert.equal(revenue.getOrderRevenue({ ...paid, Return: [{ ...returned('completed'), returnType: 'exchange' }] }), 1000)
})
test('deductions are capped and malformed amounts do not poison totals', () => {
  assert.equal(revenue.getOrderRevenue({ ...paid, total: 100, Return: [returned('completed')] }), 0)
  assert.equal(revenue.getOrderRevenue({ ...paid, total: 'invalid' }), 0)
  assert.equal(revenue.getOrderRevenue({ ...paid, Return: [{ ...returned('approved'), refundAmount: -200 }] }), 1000)
})
test('existing COD delivery and prepaid recognition rules remain valid', () => {
  assert.equal(revenue.getOrderRevenue({ ...paid, paymentMethod: 'cod', paymentStatus: 'pending' }), 1000)
  assert.equal(revenue.getOrderRevenue({ ...paid, status: 'processing' }), 1000)
  const pending = { ...paid, status: 'pending', paymentStatus: 'submitted' }
  assert.equal(revenue.getOrderRevenue(pending), 0)
  assert.equal(revenue.isPendingRevenue(pending), true)
})

test('admin totals and monthly chart agree for cancelled, returned and partial returns', async () => {
  const createdAt = new Date().toISOString()
  const orders = [
    { ...paid, createdAt, status: 'cancelled' },
    { ...paid, createdAt, status: 'returned' },
    { ...paid, createdAt, Return: [returned('approved')] },
    { ...paid, createdAt, paymentStatus: 'refunded' },
    { ...paid, createdAt, status: 'pending', paymentStatus: 'pending', total: 200 },
  ]
  const db = { from: table => ({ select: projection => {
    if (table === 'Order') assert.match(projection, /Return\(/)
    return Promise.resolve({ data: table === 'Order' ? orders : [], count: table === 'Order' ? orders.length : 0 })
  } }) }
  const route = load('app/api/admin/statistics/route.ts', {
    '@/lib/order-revenue': revenue,
    '@supabase/supabase-js': { createClient: () => db },
    'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } },
    '@/lib/api-auth': { getAuthFromRequest: async () => ({ role: 'admin' }), isAdmin: () => true },
  })
  const result = await route.GET({ url: 'http://localhost/api/admin/statistics' })
  assert.equal(result.status, 200)
  assert.equal(result.body.orders.totalRevenue, 700)
  assert.equal(result.body.orders.temporaryRevenue, 200)
  assert.equal(result.body.orders.cancelledValue, 1000)
  assert.equal(result.body.orders.returned, 1)
  assert.equal(result.body.monthly.reduce((sum, month) => sum + month.revenue, 0), 700)
})
