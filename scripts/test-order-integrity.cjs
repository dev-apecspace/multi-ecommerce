// Isolated PostgreSQL tests. Setup: npm install --prefix temp/order-integrity --no-save --package-lock=false @electric-sql/pglite
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const { PGlite } = require('../temp/order-integrity/node_modules/@electric-sql/pglite')

test('database migration restores inventory once and rejects invalid returns', async () => {
  const db = new PGlite()
  try {
    await db.exec(`
      CREATE TABLE "Product" (id INT PRIMARY KEY, stock INT);
      CREATE TABLE "ProductVariant" (id INT PRIMARY KEY, stock INT);
      CREATE TABLE "Order" (id INT PRIMARY KEY, "userId" INT, status TEXT, "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE "OrderItem" (id INT PRIMARY KEY, "orderId" INT, "productId" INT, "variantId" INT, "vendorId" INT, quantity INT, price NUMERIC);
      CREATE TABLE "Return" (id SERIAL PRIMARY KEY, "userId" INT, "orderId" INT, "orderItemId" INT, "productId" INT, "variantId" INT, "vendorId" INT, quantity INT, "refundAmount" NUMERIC, status TEXT, "returnType" TEXT DEFAULT 'return');
      INSERT INTO "Product" VALUES (1, 8);
      INSERT INTO "ProductVariant" VALUES (2, 7);
      INSERT INTO "Order" (id, "userId", status) VALUES (1, 7, 'pending'), (2, 7, 'delivered'), (3, 7, 'pending');
      INSERT INTO "OrderItem" VALUES (1, 1, 1, NULL, 4, 2, 100), (2, 1, 1, 2, 4, 3, 150), (3, 2, 1, NULL, 4, 2, 100), (4, 3, 999, NULL, 4, 1, 10);
    `)
    const migration = fs.readFileSync('supabase/migrations/20260929_order_return_integrity.sql', 'utf8')
    await db.exec(migration)
    await db.exec(migration) // Safe to apply again.
    await db.exec(`UPDATE "Order" SET status = 'cancelled' WHERE id = 1; UPDATE "Order" SET status = 'cancelled' WHERE id = 1;`)
    assert.equal((await db.query('SELECT stock FROM "Product" WHERE id = 1')).rows[0].stock, 10)
    assert.equal((await db.query('SELECT stock FROM "ProductVariant" WHERE id = 2')).rows[0].stock, 10)
    await assert.rejects(db.exec(`UPDATE "Order" SET status = 'cancelled' WHERE id = 2`), /Only pending/)
    await assert.rejects(db.exec(`UPDATE "Order" SET status = 'cancelled' WHERE id = 3`), /Cannot restore stock/)
    assert.equal((await db.query('SELECT status FROM "Order" WHERE id = 3')).rows[0].status, 'pending')

    const insert = (user, quantity, product = 1) => db.exec(`INSERT INTO "Return" ("userId", "orderId", "orderItemId", "productId", "vendorId", quantity, "refundAmount", status) VALUES (${user}, 2, 3, ${product}, 4, ${quantity}, 99999, 'pending')`)
    await assert.rejects(insert(8, 1), /Only your/)
    await assert.rejects(insert(7, 3), /Invalid return quantity/)
    await assert.rejects(insert(7, 1, 2), /does not match/)
    await insert(7, 1)
    assert.equal(Number((await db.query('SELECT "refundAmount" FROM "Return"')).rows[0].refundAmount), 100)
    await assert.rejects(insert(7, 1), /already exists/)
    await assert.rejects(db.exec(`UPDATE "Return" SET status = 'restocked'`), /Only received/)
    await db.exec(`UPDATE "Return" SET status = 'received'; UPDATE "Return" SET status = 'restocked'; UPDATE "Return" SET status = 'restocked';`)
    assert.equal((await db.query('SELECT stock FROM "Product" WHERE id = 1')).rows[0].stock, 11)
    await db.exec(`UPDATE "Return" SET status = 'completed'`)
    await assert.rejects(insert(7, 1), /already exists/)
  } finally {
    await db.close()
  }
})
