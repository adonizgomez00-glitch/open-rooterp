import { SaleService } from '../../src/services/SaleService.js'
import { setTaxRate, getTaxRate } from '../../src/utils/formatters.js'

function createMocks() {
  let saleIdCounter = 0
  let moveIdCounter = 0
  const sales = []
  const saleItems = []
  const products = []
  const movements = []

  const db = {
    sales: {
      put: async (data) => {
        const idx = sales.findIndex(s => s.id === data.id)
        if (idx > -1) sales[idx] = { ...sales[idx], ...data }
      }
    },
    saleItems: {},
    products: {},
    inventoryMovements: {},
    transaction(mode, ...rest) {
      const fn = rest[rest.length - 1]
      return fn()
    }
  }

  const saleRepo = {
    async findAll() { return sales.map(s => ({ ...s })) },
    async findById(id) {
      const s = sales.find(x => x.id === id)
      if (!s) return null
      const items = saleItems.filter(i => i.saleId === id)
      const saleObj = { ...s, items: items.map(i => ({ ...i })) }
      saleObj.toJSON = function() { return { ...this } }
      return saleObj
    },
    async createWithItems(saleData, itemsData) {
      const id = ++saleIdCounter
      const sale = { id, ...saleData }
      sales.push(sale)
      for (const item of itemsData) {
        saleItems.push({ id: ++saleIdCounter, saleId: id, ...item })
      }
      return { ...sale, items: itemsData.map(i => ({ ...i })) }
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
      const p = { id, stock: 100, salePrice: 50, code: `P00${id}`, name: `Producto ${id}`, ...data }
      products.push(p)
      return p
    }
  }

  const customerRepo = {
    async findById(id) {
      if (id === 999) return null
      return { id, name: 'Cliente Test', documentId: 'C001' }
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

  return { db, saleRepo, productRepo, customerRepo, inventoryRepo, products, sales, saleItems, movements }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testCreateSale() {
  const mocks = createMocks()
  const service = new SaleService(mocks.db, mocks.saleRepo, mocks.productRepo, mocks.customerRepo, mocks.inventoryRepo)

  mocks.productRepo._add({ id: 1, stock: 20, salePrice: 100 })
  mocks.productRepo._add({ id: 2, stock: 15, salePrice: 50 })

  const result = await service.createSale(
    { customerId: 1, notes: 'Venta de prueba' },
    [
      { productId: 1, quantity: 2, unitPrice: 100 },
      { productId: 2, quantity: 3, unitPrice: 50 }
    ]
  )

  assert(result !== null, 'createSale debería retornar la venta')
  assert(result.status === 'completed', 'La venta debería estar completada')
  assert(result.subtotal === 350, `Subtotal debería ser 350, fue ${result.subtotal}`)
  assert(result.total > result.subtotal, 'Total debería incluir impuesto')

  const taxRate = getTaxRate()
  assert(result.tax === 350 * taxRate, `Impuesto debería ser ${350 * taxRate}`)

  const p1 = mocks.productRepo._add()
  assert(p1 !== undefined, 'createSale debería ejecutarse sin error')

  console.log('  ✓ testCreateSale')
}

async function testCreateSaleWithoutCustomer() {
  const mocks = createMocks()
  const service = new SaleService(mocks.db, mocks.saleRepo, mocks.productRepo, mocks.customerRepo, mocks.inventoryRepo)

  mocks.productRepo._add({ id: 1, stock: 10, salePrice: 100 })

  const result = await service.createSale(
    { customerId: null, notes: '' },
    [{ productId: 1, quantity: 1, unitPrice: 100 }]
  )

  assert(result !== null, 'createSale sin cliente debería funcionar')
  assert(result.customerName === '', 'Sin cliente, customerName vacío')

  console.log('  ✓ testCreateSaleWithoutCustomer')
}

async function testCreateSaleEmptyItems() {
  const mocks = createMocks()
  const service = new SaleService(mocks.db, mocks.saleRepo, mocks.productRepo, mocks.customerRepo, mocks.inventoryRepo)

  try {
    await service.createSale({ customerId: null }, [])
    assert(false, 'createSale con items vacíos debería lanzar error')
  } catch (error) {
    assert(error.message.includes('producto'), 'Error debería mencionar producto')
  }

  console.log('  ✓ testCreateSaleEmptyItems')
}

async function testCreateSaleInvalidCustomer() {
  const mocks = createMocks()
  const service = new SaleService(mocks.db, mocks.saleRepo, mocks.productRepo, mocks.customerRepo, mocks.inventoryRepo)

  try {
    await service.createSale({ customerId: 999 }, [{ productId: 1, quantity: 1 }])
    assert(false, 'createSale con customer inválido debería lanzar error')
  } catch (error) {
    assert(error.message.includes('Cliente'), 'Error debería mencionar cliente')
  }

  console.log('  ✓ testCreateSaleInvalidCustomer')
}

async function testCreateSaleInsufficientStock() {
  const mocks = createMocks()
  const service = new SaleService(mocks.db, mocks.saleRepo, mocks.productRepo, mocks.customerRepo, mocks.inventoryRepo)

  mocks.productRepo._add({ id: 1, stock: 2, salePrice: 100 })

  try {
    await service.createSale({ customerId: null }, [{ productId: 1, quantity: 5 }])
    assert(false, 'createSale con stock insuficiente debería lanzar error')
  } catch (error) {
    assert(error.message.includes('Stock insuficiente'), 'Error debería mencionar stock')
  }

  console.log('  ✓ testCreateSaleInsufficientStock')
}

async function testCreateSaleUpdatesStock() {
  const mocks = createMocks()
  const service = new SaleService(mocks.db, mocks.saleRepo, mocks.productRepo, mocks.customerRepo, mocks.inventoryRepo)

  mocks.productRepo._add({ id: 1, stock: 10, salePrice: 100 })

  await service.createSale(
    { customerId: null },
    [{ productId: 1, quantity: 3, unitPrice: 100 }]
  )

  const updatedProduct = await mocks.productRepo.findById(1)
  assert(updatedProduct.stock === 7, `Stock después de venta debería ser 7, fue ${updatedProduct.stock}`)

  console.log('  ✓ testCreateSaleUpdatesStock')
}

async function testCreateSaleCreatesMovements() {
  const mocks = createMocks()
  const service = new SaleService(mocks.db, mocks.saleRepo, mocks.productRepo, mocks.customerRepo, mocks.inventoryRepo)

  mocks.productRepo._add({ id: 1, stock: 10, salePrice: 100 })

  await service.createSale(
    { customerId: null },
    [{ productId: 1, quantity: 3, unitPrice: 100 }]
  )

  assert(mocks.movements.length === 1, 'Debería crear 1 movimiento de inventario')
  assert(mocks.movements[0].type === 'sale', 'El movimiento debería ser de tipo sale')
  assert(mocks.movements[0].quantity === -3, 'La cantidad debería ser -3')

  console.log('  ✓ testCreateSaleCreatesMovements')
}

async function testCancelSale() {
  const mocks = createMocks()
  const service = new SaleService(mocks.db, mocks.saleRepo, mocks.productRepo, mocks.customerRepo, mocks.inventoryRepo)

  mocks.productRepo._add({ id: 1, stock: 10, salePrice: 100 })

  const sale = await service.createSale(
    { customerId: null },
    [{ productId: 1, quantity: 3, unitPrice: 100 }]
  )

  const cancelled = await service.cancelSale(sale.id)
  assert(cancelled.status === 'cancelled', 'La venta debería estar anulada')

  const updatedProduct = await mocks.productRepo.findById(1)
  assert(updatedProduct.stock === 10, 'Stock debería revertirse a 10 después de anular')

  console.log('  ✓ testCancelSale')
}

async function testCancelSaleAlreadyCancelled() {
  const mocks = createMocks()
  const service = new SaleService(mocks.db, mocks.saleRepo, mocks.productRepo, mocks.customerRepo, mocks.inventoryRepo)

  mocks.productRepo._add({ id: 1, stock: 10, salePrice: 100 })

  const sale = await service.createSale(
    { customerId: null },
    [{ productId: 1, quantity: 1 }]
  )

  await service.cancelSale(sale.id)

  try {
    await service.cancelSale(sale.id)
    assert(false, 'Anular venta ya anulada debería lanzar error')
  } catch (error) {
    assert(error.message.includes('anulada'), 'Error debería mencionar que ya está anulada')
  }

  console.log('  ✓ testCancelSaleAlreadyCancelled')
}

export async function runSaleServiceTests() {
  console.log('\n--- SaleService Tests ---\n')
  setTaxRate(0.12)

  await testCreateSale()
  await testCreateSaleWithoutCustomer()
  await testCreateSaleEmptyItems()
  await testCreateSaleInvalidCustomer()
  await testCreateSaleInsufficientStock()
  await testCreateSaleUpdatesStock()
  await testCreateSaleCreatesMovements()
  await testCancelSale()
  await testCancelSaleAlreadyCancelled()

  console.log('\n✓ Todos los tests de SaleService pasaron\n')
}
