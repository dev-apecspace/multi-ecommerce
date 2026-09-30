const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function api(file, results = [], auth = null) {
  const calls = []
  const db = { from(table) {
    const call = { table, filters: [] }
    calls.push(call)
    const chain = {
      select() { return chain },
      eq(...args) { call.filters.push(args); return chain },
      in(...args) { call.filters.push(args); return chain },
      order() { return chain },
      range() { return chain },
      gte() { return chain },
      single() { return chain },
      maybeSingle() { return chain },
      update(data) { call.update = data; return chain },
      then(resolve, reject) {
        assert.ok(results.length, `Unexpected query: ${table}`)
        return Promise.resolve(results.shift()).then(resolve, reject)
      },
    }
    return chain
  } }
  const exports = {}
  const deps = {
    '@supabase/supabase-js': { createClient: () => db },
    'next/server': { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } },
    '@/lib/api-auth': {
      getAuthFromRequest: async () => auth,
      isAdmin: value => value?.role === 'admin',
      isVendor: value => value?.role === 'vendor' && !!value.vendorId,
      unauthorizedResponse: () => ({ status: 401 }),
    },
    '@/lib/product-query': { getProductWithVariants: async () => ({ id: 5, sellerHidden: true, adminLocked: true }) },
    '@/lib/price-utils': { isCampaignActive: () => false },
  }
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  vm.runInNewContext(source, { exports, process, URL, console, require: name => {
    assert.ok(name in deps, `Unexpected import: ${name}`)
    return deps[name]
  } })
  return { handlers: exports, calls }
}
const request = body => ({ json: async () => body })
const params = { params: Promise.resolve({ id: '5' }) }
const sellerFile = 'app/api/seller/products/[id]/route.ts'
const adminFile = 'app/api/admin/products/route.ts'
const seller = { role: 'vendor', vendorId: 7 }

test('seller can hide own product without changing admin lock or approval', async () => {
  const { handlers, calls } = api(sellerFile, [{ data: { id: 5 } }, { data: [{ id: 5 }] }], seller)
  assert.equal((await handlers.PATCH(request({ sellerHidden: true }), params)).status, 200)
  assert.equal(calls[1].update.sellerHidden, true)
  assert.equal(Object.keys(calls[1].update).length, 1)
  assert.ok(calls[1].filters.some(([key, value]) => key === 'vendorId' && value === 7))
})
test('seller cannot hide another seller product', async () => {
  const { handlers, calls } = api(sellerFile, [{ data: null }], seller)
  assert.equal((await handlers.PATCH(request({ sellerHidden: true }), params)).status, 404)
  assert.equal(calls.length, 1)
  assert.ok(calls[0].filters.some(([key, value]) => key === 'vendorId' && value === 7))
})
test('seller cannot remove admin controls or approve product', async () => {
  for (const body of [{ adminLocked: false }, { adminHidden: false }, { status: 'approved' }]) {
    const { handlers, calls } = api(sellerFile, [{ data: { id: 5 } }], seller)
    assert.equal((await handlers.PATCH(request(body), params)).status, 403)
    assert.equal(calls.length, 1)
  }
})
test('admin APIs reject seller and anonymous requests before touching database', async () => {
  for (const auth of [null, seller]) {
    for (const file of [adminFile, 'app/api/admin/products/[id]/route.ts']) {
      const { handlers, calls } = api(file, [], auth)
      assert.equal((await handlers.GET({ url: 'http://localhost/api/admin/products' }, params)).status, 401)
      assert.equal((await handlers.PATCH(request({ productId: 5, adminLocked: true }), params)).status, 401)
      assert.equal(calls.length, 0)
    }
  }
})
test('admin can set and clear each control without overwriting seller visibility', async () => {
  for (const field of ['adminHidden', 'adminLocked']) {
    for (const value of [true, false]) {
      const { handlers, calls } = api(adminFile, [{ data: [{ id: 5, [field]: value }] }], { role: 'admin' })
      assert.equal((await handlers.PATCH(request({ productId: 5, [field]: value }))).status, 200)
      assert.equal(calls[0].update[field], value)
      assert.equal(calls[0].update.sellerHidden, undefined)
      assert.equal(calls[0].update.status, undefined)
    }
  }
})
test('admin rejects malformed visibility values', async () => {
  const { handlers, calls } = api(adminFile, [], { role: 'admin' })
  assert.equal((await handlers.PATCH(request({ productId: 5, adminHidden: 'false' }))).status, 400)
  assert.equal(calls.length, 0)
})
test('stale cart cannot add an unavailable product', async () => {
  const { handlers, calls } = api('app/api/cart/route.ts', [{ data: null }])
  assert.equal((await handlers.POST(request({ userId: 1, productId: 5, quantity: 1 }))).status, 409)
  assert.equal(calls.length, 1)
  for (const flag of ['sellerHidden', 'adminHidden', 'adminLocked']) {
    assert.ok(calls[0].filters.some(([key, value]) => key === flag && value === false))
  }
})

test('public slug lookup cannot bypass visibility using showPending', async () => {
  const { handlers, calls } = api('app/api/products/route.ts', [{ data: [], count: 0 }, { data: [] }])
  const result = await handlers.GET({ url: 'http://localhost/api/products?slug=hidden-product&showPending=true' })
  assert.equal(result.status, 200)
  for (const flag of ['sellerHidden', 'adminHidden', 'adminLocked']) {
    assert.ok(calls[0].filters.some(([key, value]) => key === flag && value === false))
  }
  assert.ok(calls[0].filters.some(([key, value]) => key === 'status' && value === 'approved'))
})

test('checkout rejects unavailable products before creating any orders', async () => {
  const { handlers, calls } = api('app/api/client/orders/route.ts', [{ data: [] }])
  const result = await handlers.POST(request({
    userId: 1, cartItems: [{ productId: 5, vendorId: 7, quantity: 1 }],
    shippingAddress: 'Address', paymentMethod: 'cod',
  }))
  assert.equal(result.status, 409)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].table, 'Product')
})

test('cart keeps hidden and locked products and marks them unavailable', async () => {
  const states = [{}, { sellerHidden: true }, { adminHidden: true }, { adminLocked: true }]
  const items = states.map((state, index) => ({
    id: index + 1, quantity: 2, variantId: null,
    Product: {
      id: index + 10, name: `Product ${index}`, status: 'approved',
      sellerHidden: false, adminHidden: false, adminLocked: false,
      price: 100, vendorId: 7, Vendor: { name: 'Shop' }, ...state,
    },
  }))
  const { handlers, calls } = api('app/api/cart/route.ts', [{ data: items }, { data: [] }])
  const result = await handlers.GET({ url: 'http://localhost/api/cart?userId=1' })
  assert.equal(result.status, 200)
  assert.equal(result.body.data.length, 4)
  assert.equal(result.body.data[0].isUnavailable, false)
  for (const item of result.body.data.slice(1)) {
    assert.equal(item.isUnavailable, true)
    assert.equal(item.quantity, 2)
    assert.ok(item.productName)
  }
  assert.equal(calls[0].filters.some(([key]) => key.startsWith('Product.')), false)
})

test('direct detail permits discontinued products but still requires approval', async () => {
  for (const suffix of ['?slug=hidden&detail=true', '?detail=true']) {
    const { handlers, calls } = api('app/api/products/route.ts', [{ data: [], count: 0 }, { data: [] }])
    assert.equal((await handlers.GET({ url: `http://localhost/api/products${suffix}` })).status, 200)
    assert.ok(calls[0].filters.some(([key, value]) => key === 'status' && value === 'approved'))
    const hidesUnavailable = calls[0].filters.some(([key]) => key === 'adminLocked')
    assert.equal(hidesUnavailable, !suffix.includes('slug='))
  }
})
