const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

// Execute the real handlers with an isolated database; never touch live orders/chat.
function load(file, dependencies, globals = {}) {
  const exports = {}
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText
  vm.runInNewContext(source, {
    exports, process, console: { log() {}, error() {} }, ...globals,
    require(name) {
      if (name in dependencies) return dependencies[name]
      throw new Error(`Unexpected dependency: ${name}`)
    },
  }, { filename: file })
  return exports
}

function api(file, results, auth = { userId: 7, role: 'customer' }) {
  const calls = []
  const db = { from(table) {
    const query = { table, filters: [] }
    calls.push(query)
    const chain = {
      select() { return chain },
      eq(key, value) { query.filters.push([key, value]); return chain },
      not(...args) { query.not = args; return chain },
      in() { return chain },
      update(value) { query.update = value; return chain },
      insert(value) { query.insert = value; return chain },
      single() { return chain },
      then(resolve, reject) {
        assert.ok(results.length, `Unexpected query: ${table}`)
        return Promise.resolve(results.shift()).then(resolve, reject)
      },
    }
    return chain
  } }
  const next = { NextResponse: { json(body, options = {}) { return { body, status: options.status || 200 } } } }
  return { calls, route: load(file, {
    '@supabase/supabase-js': { createClient: () => db },
    'next/server': next,
    '@/lib/api-auth': {
      getAuthFromRequest: async () => auth,
      isVendor: value => value?.role === 'vendor' && !!value.vendorId,
      unauthorizedResponse: () => ({ status: 401 }),
    },
    '@/lib/price-utils': {},
  }) }
}
const request = body => ({ json: async () => body })
const orderRoute = 'app/api/client/orders/route.ts'
const returnRoute = 'app/api/client/returns/route.ts'

test('anonymous customers cannot cancel orders or create returns', async () => {
  for (const [file, method] of [[orderRoute, 'PATCH'], [returnRoute, 'POST']]) {
    const { route, calls } = api(file, [], null)
    assert.equal((await route[method](request({}))).status, 401)
    assert.equal(calls.length, 0)
  }
})
test('cancellation is scoped to the session owner and original status', async () => {
  const { route, calls } = api(orderRoute, [{ data: { status: 'pending', OrderItem: [] } }, { data: [{ id: 1 }] }])
  assert.equal((await route.PATCH(request({ orderId: 1, status: 'cancelled', userId: 999 }))).status, 200)
  for (const call of calls) assert.ok(call.filters.some(([key, value]) => key === 'userId' && value === 7))
  assert.ok(calls[1].filters.some(([key, value]) => key === 'status' && value === 'pending'))
})
test('shipped orders cannot be cancelled', async () => {
  const { route, calls } = api(orderRoute, [{ data: { status: 'shipped' } }])
  assert.equal((await route.PATCH(request({ orderId: 1, status: 'cancelled' }))).status, 400)
  assert.equal(calls.length, 1)
})
test('a concurrent seller update returns conflict instead of false success', async () => {
  const { route } = api(orderRoute, [{ data: { status: 'pending' } }, { data: [] }])
  assert.equal((await route.PATCH(request({ orderId: 1, status: 'cancelled' }))).status, 409)
})
test('return lookup errors block receipt confirmation', async () => {
  const { route } = api(orderRoute, [{ data: { status: 'delivered', OrderItem: [{ id: 2 }] } }, { error: { message: 'Database unavailable' } }])
  assert.equal((await route.PATCH(request({ orderId: 1, status: 'completed' }))).status, 400)
})

const returnBody = { orderId: 1, orderItemId: 2, productId: 3, reason: 'defective', quantity: 1 }
const item = { productId: 3, variantId: null, quantity: 2, price: 150, vendorId: 4, Order: { status: 'delivered', updatedAt: new Date().toISOString() } }
for (const quantity of [0, -1, 1.5, 3, '1']) {
  test(`reject invalid return quantity ${JSON.stringify(quantity)}`, async () => {
    const { route, calls } = api(returnRoute, [{ data: [] }, { data: item }])
    assert.equal((await route.POST(request({ ...returnBody, quantity }))).status, 400)
    assert.ok(calls.every(call => !call.insert))
  })
}
test('returns verify order ownership, derive customer and amount on the server', async () => {
  const { route, calls } = api(returnRoute, [{ data: [] }, { data: item }, { data: [{ id: 8 }] }])
  assert.equal((await route.POST(request({ ...returnBody, userId: 999, refundAmount: 99999 }))).status, 201)
  assert.ok(calls[1].filters.some(([key, value]) => key === 'Order.userId' && value === 7))
  assert.ok(calls[1].filters.some(([key, value]) => key === 'orderId' && value === 1))
  assert.equal(calls[2].insert[0].userId, 7)
  assert.equal(calls[2].insert[0].refundAmount, 150)
})
test('reject wrong products, expired windows and undelivered orders', async () => {
  for (const override of [{ productId: 88 }, { Order: { status: 'pending' } }, { Order: { status: 'delivered', updatedAt: '2020-01-01' } }]) {
    const { route } = api(returnRoute, [{ data: [] }, { data: { ...item, ...override } }])
    assert.equal((await route.POST(request(returnBody))).status, 400)
  }
})
test('completed returns cannot be requested again', async () => {
  const { route, calls } = api(returnRoute, [{ data: [{ id: 8, status: 'completed' }] }])
  assert.equal((await route.POST(request(returnBody))).status, 400)
  assert.equal(calls.length, 1)
  assert.ok(!calls[0].not[2].includes('completed'))
})
test('a shop cannot update another shop return', async () => {
  const { route, calls } = api('app/api/seller/returns/route.ts', [{ data: null }], { userId: 9, vendorId: 4, role: 'vendor' })
  assert.equal((await route.PATCH(request({ returnId: 8, action: 'approve' }))).status, 404)
  assert.ok(calls[0].filters.some(([key, value]) => key === 'vendorId' && value === 4))
})

function refundButton(fetch) {
  const navigations = []
  const { RefundChatButton } = load('components/orders/refund-chat-button.tsx', {
    react: { useRef: value => ({ current: value }), useState: value => [value, () => {}] },
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
    'next/navigation': { useRouter: () => ({ push: url => navigations.push(url) }) },
    '@/components/ui/button': { Button: 'button' },
    '@/hooks/use-toast': { useToast: () => ({ toast() {} }) },
  }, { fetch })
  return { RefundChatButton, navigations }
}
const refundOrder = { orderNumber: 'ORD123', status: 'delivered', Vendor: { id: 4 } }
test('refund click sends the order number to the correct shop before navigating', async () => {
  const requests = []
  const { RefundChatButton, navigations } = refundButton(async (url, options) => {
    requests.push({ url, body: JSON.parse(options.body) })
    return { ok: true, json: async () => url.includes('conversations') ? { conversation: { id: 12 } } : { message: { id: 1 } } }
  })
  const button = RefundChatButton({ order: refundOrder })
  await Promise.all([button.props.onClick(), button.props.onClick()])
  assert.equal(requests.length, 2)
  assert.equal(requests[0].body.vendorId, 4)
  assert.equal(requests[1].body.conversationId, 12)
  assert.match(requests[1].body.content, /ORD123/)
  assert.deepEqual(navigations, ['/client/chat?conversationId=12'])
})
test('failed refund message does not navigate or report success', async () => {
  const { RefundChatButton, navigations } = refundButton(async url => ({
    ok: url.includes('conversations'),
    json: async () => ({ conversation: { id: 12 }, error: 'Send failed' }),
  }))
  await RefundChatButton({ order: refundOrder }).props.onClick()
  assert.equal(navigations.length, 0)
})
test('refund action is hidden for unpaid COD cancellations and refunded orders', () => {
  const { RefundChatButton } = refundButton(() => { throw new Error('Unexpected request') })
  for (const override of [{ paymentStatus: 'refunded' }, { status: 'pending' }, { status: 'cancelled', paymentMethod: 'cod', paymentStatus: 'pending' }]) {
    assert.equal(RefundChatButton({ order: { ...refundOrder, ...override } }), null)
  }
})
