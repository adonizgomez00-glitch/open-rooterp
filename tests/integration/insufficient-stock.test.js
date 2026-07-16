import { SaleService } from '../../src/services/SaleService.js'
import { getTaxRate, setTaxRate } from '../../src/utils/formatters.js'
import { assert, createMockDB, seedProduct, seedCustomer } from './helpers.js'

export async function runInsufficientStockTests() {
  setTaxRate(0.12)

  const db = createMockDB()
  const product = await seedProduct(db, { id: 100, purchasePrice: 50, salePrice: 100, stock: 2 })
  const customer = await seedCustomer(db)

  const productRepo = {
    async findById(id) { const d = await db.products.get(id); return d ? { ...d } : null },
    async update(id, changes) { await db.products.update(id, changes); return this.findById(id) },
    async findAll() { return (await db.products.toArray()).map(d => ({ ...d })) }
  }
  const customerRepo = { async findById(id) { const d = await db.customers.get(id); return d ? { ...d } : null } }
  const inventoryRepo = {
    async getStockByProduct(productId) {
      const all = await db.inventoryMovements.toArray()
      return all.reduce((sum, m) => { if (m.productId === productId) return sum + (m.quantity || 0); return sum }, 0)
    },
    async create(data) { const id = await db.inventoryMovements.add(data); return { id, ...data } },
    async findByProduct() { return [] }
  }
  let saleIdCounter = 200
  const saleRepo = {
    async findAll() { return (await db.sales.toArray()).map(d => ({ ...d })) },
    async findById(id) {
      const d = await db.sales.get(id); if (!d) return null
      const items = (await db.saleItems.toArray()).filter(i => i.saleId === id)
      const obj = { ...d, items: items.map(i => ({ ...i })) }
      obj.toJSON = function () { return { ...this, items: this.items.map(i => ({ ...i })) } }
      return obj
    },
    async createWithItems(saleData, itemsData) {
      const id = ++saleIdCounter
      await db.sales.add({ ...saleData, id })
      for (const item of itemsData) await db.saleItems.add({ ...item, saleId: id })
      return this.findById(id)
    },
    async findByDateRange() { return [] },
    async count() { return db.sales.count() }
  }

  const saleService = new SaleService(db, saleRepo, productRepo, customerRepo, inventoryRepo)

  // Test 1: Sale with more quantity than available stock should throw
  try {
    await saleService.createSale(
      { customerId: customer.id, customerName: customer.name },
      [{ productId: product.id, quantity: 10, unitPrice: 100 }]
    )
    assert(false, 'Should have thrown for insufficient stock')
  } catch (error) {
    assert(error.message.includes('Stock insuficiente'), `Error should mention insufficient stock: ${error.message}`)
  }

  // Test 2: Sale with exact available stock should succeed (stock = 2, sell 2)
  const sale = await saleService.createSale(
    { customerId: customer.id, customerName: customer.name },
    [{ productId: product.id, quantity: 2, unitPrice: 100 }]
  )
  assert(sale.status === 'completed', 'Sale with exact available stock should succeed')

  // Test 3: After consuming remaining stock, another sale should fail
  try {
    await saleService.createSale(
      { customerId: customer.id, customerName: customer.name },
      [{ productId: product.id, quantity: 1, unitPrice: 100 }]
    )
    assert(false, 'Should have thrown for insufficient stock after consuming all stock')
  } catch (error) {
    assert(error.message.includes('Stock insuficiente'), `Error should mention insufficient stock: ${error.message}`)
  }

  // Test 4: Sale with quantity 0 should throw
  try {
    await saleService.createSale(
      { customerId: customer.id, customerName: customer.name },
      [{ productId: product.id, quantity: 0, unitPrice: 100 }]
    )
    assert(false, 'Should have thrown for quantity 0')
  } catch (error) {
    assert(error.message.includes('Cantidad inválida'), `Error should mention invalid quantity: ${error.message}`)
  }

  // Test 5: Sale with negative quantity should throw
  try {
    await saleService.createSale(
      { customerId: customer.id, customerName: customer.name },
      [{ productId: product.id, quantity: -1, unitPrice: 100 }]
    )
    assert(false, 'Should have thrown for negative quantity')
  } catch (error) {
    assert(error.message.includes('Cantidad inválida'), `Error should mention invalid quantity: ${error.message}`)
  }

  // Test 6: Sale with nonexistent customer should throw
  try {
    await saleService.createSale(
      { customerId: 99999, customerName: 'No existe' },
      [{ productId: product.id, quantity: 1, unitPrice: 100 }]
    )
    assert(false, 'Should have thrown for nonexistent customer')
  } catch (error) {
    assert(error.message.includes('Cliente no encontrado'), `Error should mention customer not found: ${error.message}`)
  }

  // Test 7: Sale with nonexistent product should throw
  try {
    await saleService.createSale(
      { customerId: customer.id, customerName: customer.name },
      [{ productId: 99999, quantity: 1, unitPrice: 100 }]
    )
    assert(false, 'Should have thrown for nonexistent product')
  } catch (error) {
    assert(error.message.includes('Producto'), `Error should mention product not found: ${error.message}`)
  }

  // Test 8: Getting nonexistent sale should throw
  try {
    await saleService.getById(99999)
    assert(false, 'Should have thrown for nonexistent sale')
  } catch (error) {
    assert(error.message.includes('no encontrada'), `Error should mention not found: ${error.message}`)
  }

  console.log('  ✓ testInsufficientStock')
}
