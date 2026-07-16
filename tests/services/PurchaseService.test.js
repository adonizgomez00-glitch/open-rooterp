import { PurchaseService } from '../../src/services/PurchaseService.js'
import { setTaxRate, getTaxRate } from '../../src/utils/formatters.js'

function createMocks() {
  let purchaseIdCounter = 0
  let moveIdCounter = 0
  const purchases = []
  const purchaseItems = []
  const products = []
  const movements = []

  const db = {
    purchases: {
      put: async (data) => {
        const idx = purchases.findIndex(s => s.id === data.id)
        if (idx > -1) purchases[idx] = { ...purchases[idx], ...data }
      }
    },
    purchaseItems: {},
    products: {},
    inventoryMovements: {},
    transaction(mode, ...rest) {
      const fn = rest[rest.length - 1]
      return fn()
    }
  }

  const purchaseRepo = {
    async findAll() { return purchases.map(s => ({ ...s })) },

    async findById(id) {
      const p = purchases.find(x => x.id === id)
      if (!p) return null
      const items = purchaseItems.filter(i => i.purchaseId === id)
      const purchaseObj = { ...p, items: items.map(i => ({ ...i })) }
      purchaseObj.toJSON = function() { return { ...this } }
      return purchaseObj
    },

    async createWithItems(purchaseData, itemsData) {
      const id = ++purchaseIdCounter
      const purchase = { id, ...purchaseData }
      purchases.push(purchase)
      for (const item of itemsData) {
        purchaseItems.push({ id: ++purchaseIdCounter, purchaseId: id, ...item })
      }
      return { ...purchase, items: itemsData.map(i => ({ ...i })) }
    }
  }

  const productRepo = {
    async findById(id) {
      const p = products.find(x => x.id === id)
      return p ? { ...p } : null
    },

    async update(id, data) {
      const idx = products.findIndex(x => x.id === id)
      if (idx === -1) throw new Error('No encontrado')
      products[idx] = { ...products[idx], ...data }
      return { ...products[idx] }
    },

    _add(data) {
      const id = products.length + 1
      const p = { id, stock: 100, purchasePrice: 30, code: `P00${id}`, name: `Producto ${id}`, ...data }
      products.push(p)
      return p
    }
  }

  const supplierRepo = {
    async findById(id) {
      if (id === 999) return null
      return { id, name: 'Proveedor Test', documentId: 'PROV-001' }
    }
  }

  const inventoryRepo = {
    async getStockByProduct(productId) {
      const p = products.find(x => x.id === productId)
      return p ? p.stock : 0
    },

    async create(data) {
      const m = { id: ++moveIdCounter, ...data }
      movements.push(m)
      return m
    },

    _movements: movements
  }

  return { db, purchaseRepo, productRepo, supplierRepo, inventoryRepo, products, purchases, purchaseItems, movements }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testCreatePurchase() {
  const mocks = createMocks()
  const service = new PurchaseService(mocks.db, mocks.purchaseRepo, mocks.productRepo, mocks.supplierRepo, mocks.inventoryRepo)

  mocks.productRepo._add({ id: 1, stock: 20, purchasePrice: 30 })
  mocks.productRepo._add({ id: 2, stock: 15, purchasePrice: 50 })

  const result = await service.createPurchase(
    { supplierId: 1, notes: 'Compra de prueba' },
    [
      { productId: 1, quantity: 5, unitPrice: 30 },
      { productId: 2, quantity: 3, unitPrice: 50 }
    ]
  )

  assert(result !== null, 'createPurchase debería retornar la compra')
  assert(result.status === 'completed', 'La compra debería estar completada')
  assert(result.subtotal === 300, `Subtotal debería ser 300, fue ${result.subtotal}`)
  assert(result.total > result.subtotal, 'Total debería incluir impuesto')

  const taxRate = getTaxRate()
  assert(result.tax === 300 * taxRate, `Impuesto debería ser ${300 * taxRate}`)

  console.log('  ✓ testCreatePurchase')
}

async function testCreatePurchaseWithoutSupplier() {
  const mocks = createMocks()
  const service = new PurchaseService(mocks.db, mocks.purchaseRepo, mocks.productRepo, mocks.supplierRepo, mocks.inventoryRepo)

  mocks.productRepo._add({ id: 1, stock: 10, purchasePrice: 30 })

  const result = await service.createPurchase(
    { supplierId: null, notes: '' },
    [{ productId: 1, quantity: 2, unitPrice: 30 }]
  )

  assert(result !== null, 'createPurchase sin proveedor debería funcionar')
  assert(result.supplierName === '', 'Sin proveedor, supplierName vacío')

  console.log('  ✓ testCreatePurchaseWithoutSupplier')
}

async function testCreatePurchaseEmptyItems() {
  const mocks = createMocks()
  const service = new PurchaseService(mocks.db, mocks.purchaseRepo, mocks.productRepo, mocks.supplierRepo, mocks.inventoryRepo)

  try {
    await service.createPurchase({ supplierId: null }, [])
    assert(false, 'createPurchase con items vacíos debería lanzar error')
  } catch (error) {
    assert(error.message.includes('producto'), 'Error debería mencionar producto')
  }

  console.log('  ✓ testCreatePurchaseEmptyItems')
}

async function testCreatePurchaseInvalidSupplier() {
  const mocks = createMocks()
  const service = new PurchaseService(mocks.db, mocks.purchaseRepo, mocks.productRepo, mocks.supplierRepo, mocks.inventoryRepo)

  try {
    await service.createPurchase({ supplierId: 999 }, [{ productId: 1, quantity: 1 }])
    assert(false, 'createPurchase con proveedor inválido debería lanzar error')
  } catch (error) {
    assert(error.message.includes('Proveedor'), 'Error debería mencionar proveedor')
  }

  console.log('  ✓ testCreatePurchaseInvalidSupplier')
}

async function testCreatePurchaseUpdatesStock() {
  const mocks = createMocks()
  const service = new PurchaseService(mocks.db, mocks.purchaseRepo, mocks.productRepo, mocks.supplierRepo, mocks.inventoryRepo)

  mocks.productRepo._add({ id: 1, stock: 10, purchasePrice: 30 })

  await service.createPurchase(
    { supplierId: null },
    [{ productId: 1, quantity: 5, unitPrice: 30 }]
  )

  const updatedProduct = await mocks.productRepo.findById(1)
  assert(updatedProduct.stock === 15, `Stock después de compra debería ser 15, fue ${updatedProduct.stock}`)

  console.log('  ✓ testCreatePurchaseUpdatesStock')
}

async function testCreatePurchaseCreatesMovements() {
  const mocks = createMocks()
  const service = new PurchaseService(mocks.db, mocks.purchaseRepo, mocks.productRepo, mocks.supplierRepo, mocks.inventoryRepo)

  mocks.productRepo._add({ id: 1, stock: 10, purchasePrice: 30 })

  await service.createPurchase(
    { supplierId: null },
    [{ productId: 1, quantity: 5, unitPrice: 30 }]
  )

  assert(mocks.movements.length === 1, 'Debería crear 1 movimiento de inventario')
  assert(mocks.movements[0].type === 'entry', 'El movimiento debería ser de tipo entry')
  assert(mocks.movements[0].quantity === 5, 'La cantidad debería ser 5')

  console.log('  ✓ testCreatePurchaseCreatesMovements')
}

async function testCancelPurchase() {
  const mocks = createMocks()
  const service = new PurchaseService(mocks.db, mocks.purchaseRepo, mocks.productRepo, mocks.supplierRepo, mocks.inventoryRepo)

  mocks.productRepo._add({ id: 1, stock: 10, purchasePrice: 30 })

  const purchase = await service.createPurchase(
    { supplierId: null },
    [{ productId: 1, quantity: 5, unitPrice: 30 }]
  )

  const cancelled = await service.cancelPurchase(purchase.id)
  assert(cancelled.status === 'cancelled', 'La compra debería estar anulada')

  const updatedProduct = await mocks.productRepo.findById(1)
  assert(updatedProduct.stock === 10, 'Stock debería revertirse a 10 después de anular')

  console.log('  ✓ testCancelPurchase')
}

async function testCancelPurchaseAlreadyCancelled() {
  const mocks = createMocks()
  const service = new PurchaseService(mocks.db, mocks.purchaseRepo, mocks.productRepo, mocks.supplierRepo, mocks.inventoryRepo)

  mocks.productRepo._add({ id: 1, stock: 10, purchasePrice: 30 })

  const purchase = await service.createPurchase(
    { supplierId: null },
    [{ productId: 1, quantity: 1, unitPrice: 30 }]
  )

  await service.cancelPurchase(purchase.id)

  try {
    await service.cancelPurchase(purchase.id)
    assert(false, 'Anular compra ya anulada debería lanzar error')
  } catch (error) {
    assert(error.message.includes('anulada'), 'Error debería mencionar que ya está anulada')
  }

  console.log('  ✓ testCancelPurchaseAlreadyCancelled')
}

export async function runPurchaseServiceTests() {
  console.log('\n--- PurchaseService Tests ---\n')
  setTaxRate(0.12)

  await testCreatePurchase()
  await testCreatePurchaseWithoutSupplier()
  await testCreatePurchaseEmptyItems()
  await testCreatePurchaseInvalidSupplier()
  await testCreatePurchaseUpdatesStock()
  await testCreatePurchaseCreatesMovements()
  await testCancelPurchase()
  await testCancelPurchaseAlreadyCancelled()

  console.log('\n✓ Todos los tests de PurchaseService pasaron\n')
}
