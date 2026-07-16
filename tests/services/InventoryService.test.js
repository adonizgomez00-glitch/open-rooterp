import { InventoryService } from '../../src/services/InventoryService.js'

function createMockProductRepo() {
  const products = []
  let nextId = 1

  return {
    async findAll() { return [...products] },

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
      const p = { id: nextId++, ...data }
      products.push(p)
      return p
    }
  }
}

function createMockInventoryRepo() {
  const movements = []
  let nextId = 1

  return {
    async findByProduct(productId) {
      return movements.filter(m => m.productId === productId).sort((a, b) => new Date(b.date) - new Date(a.date))
    },

    async create(data) {
      const m = { id: nextId++, ...data }
      movements.push(m)
      return { ...m }
    },

    async getStockByProduct(productId) {
      return movements.reduce((stock, m) => {
        if (m.productId !== productId) return stock
        const qty = m.quantity ?? 0
        if (m.type === 'entry' || m.type === 'purchase') return stock + Math.abs(qty)
        if (m.type === 'exit' || m.type === 'sale') return stock - Math.abs(qty)
        return stock + qty
      }, 0)
    },

    async findAll() { return [...movements] },

    _add(data) {
      const m = { id: nextId++, ...data }
      movements.push(m)
      return m
    },

    _getAll() { return movements }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testGetStockOverview() {
  const productRepo = createMockProductRepo()
  const inventoryRepo = createMockInventoryRepo()
  const service = new InventoryService(null, productRepo, inventoryRepo)

  productRepo._add({ id: 1, code: 'P001', name: 'Producto A', category: 'Cat1', stock: 0, stockMin: 5 })
  productRepo._add({ id: 2, code: 'P002', name: 'Producto B', category: 'Cat2', stock: 0, stockMin: 0 })

  inventoryRepo._add({ productId: 1, type: 'entry', quantity: 10, date: new Date().toISOString() })
  inventoryRepo._add({ productId: 1, type: 'exit', quantity: -3, date: new Date().toISOString() })

  const overview = await service.getStockOverview()
  assert(overview.length === 2, 'getStockOverview debería retornar 2 productos')

  const prodA = overview.find(p => p.id === 1)
  assert(prodA.stock === 7, 'Stock de Producto A debería ser 7 (10 - 3)')
  assert(prodA.status === 'ok', 'Producto A (stock 7, min 5) debería tener estado ok')

  const prodB = overview.find(p => p.id === 2)
  assert(prodB.stock === 0, 'Stock de Producto B debería ser 0')
  assert(prodB.status === 'ok', 'Producto B (sin stockMin) debería tener estado ok')

  console.log('  ✓ testGetStockOverview')
}

async function testGetStockStatus() {
  const service = new InventoryService(null, null)

  assert(service._getStockStatus(10, 5) === 'ok', 'stock > min debería ser ok')
  assert(service._getStockStatus(5, 5) === 'low', 'stock == min debería ser low')
  assert(service._getStockStatus(3, 5) === 'low', 'stock < min debería ser low')
  assert(service._getStockStatus(0, 5) === 'critical', 'stock == 0 debería ser critical')
  assert(service._getStockStatus(-1, 5) === 'critical', 'stock < 0 debería ser critical')
  assert(service._getStockStatus(10, 0) === 'ok', 'stockMin == 0 debería ser ok')

  console.log('  ✓ testGetStockStatus')
}

async function testGetMovementsByProduct() {
  const productRepo = createMockProductRepo()
  const inventoryRepo = createMockInventoryRepo()
  const service = new InventoryService(null, productRepo, inventoryRepo)

  productRepo._add({ id: 1, code: 'P001', name: 'Producto A' })
  inventoryRepo._add({ productId: 1, type: 'entry', quantity: 10 })
  inventoryRepo._add({ productId: 1, type: 'exit', quantity: -3 })

  const movements = await service.getMovementsByProduct(1)
  assert(movements.length === 2, 'getMovementsByProduct debería retornar 2 movimientos')

  try {
    await service.getMovementsByProduct(null)
    assert(false, 'getMovementsByProduct(null) debería lanzar error')
  } catch { /* Expected */ }

  try {
    await service.getMovementsByProduct(999)
    assert(false, 'getMovementsByProduct(999) debería lanzar error')
  } catch { /* Expected */ }

  console.log('  ✓ testGetMovementsByProduct')
}

async function testCreateAdjustment() {
  const productRepo = createMockProductRepo()
  const inventoryRepo = createMockInventoryRepo()
  const service = new InventoryService(null, productRepo, inventoryRepo)

  productRepo._add({ id: 1, code: 'P001', name: 'Producto A', stock: 10 })

  const result = await service.createAdjustment({
    productId: 1,
    type: 'entry',
    quantity: 5,
    notes: 'Ajuste manual'
  })

  assert(result !== null, 'createAdjustment debería retornar el movimiento')
  assert(result.type === 'entry', 'El tipo debería ser entry')
  assert(result.stockBefore === 0, 'El stock antes del primer movimiento debería ser 0')
  assert(result.stockAfter === 5, 'El stock después debería ser 5')

  const stock = await inventoryRepo.getStockByProduct(1)
  assert(stock === 5, 'El stock calculado debería ser 5')

  const updatedProduct = await productRepo.findById(1)
  assert(updatedProduct.stock === 5, 'El stock del producto debería actualizarse')

  console.log('  ✓ testCreateAdjustment')
}

async function testCreateAdjustmentExit() {
  const productRepo = createMockProductRepo()
  const inventoryRepo = createMockInventoryRepo()
  const service = new InventoryService(null, productRepo, inventoryRepo)

  productRepo._add({ id: 1, code: 'P001', name: 'Producto A' })

  // First add stock
  await service.createAdjustment({ productId: 1, type: 'entry', quantity: 10 })

  const result = await service.createAdjustment({
    productId: 1,
    type: 'exit',
    quantity: 3,
    notes: 'Salida manual'
  })

  assert(result.stockAfter === 7, 'Stock después de salida debería ser 7')
  assert(result.quantity === -3, 'La cantidad de salida debería ser negativa')

  console.log('  ✓ testCreateAdjustmentExit')
}

async function testCreateAdjustmentPreventsNegativeStock() {
  const productRepo = createMockProductRepo()
  const inventoryRepo = createMockInventoryRepo()
  const service = new InventoryService(null, productRepo, inventoryRepo)

  productRepo._add({ id: 1, code: 'P001', name: 'Producto A' })

  try {
    await service.createAdjustment({ productId: 1, type: 'exit', quantity: 10 })
    assert(false, 'createAdjustment debería prevenir stock negativo')
  } catch (error) {
    assert(error.message.includes('negativo'), 'El error debería mencionar stock negativo')
  }

  console.log('  ✓ testCreateAdjustmentPreventsNegativeStock')
}

async function testCreateAdjustmentValidation() {
  const productRepo = createMockProductRepo()
  const inventoryRepo = createMockInventoryRepo()
  const service = new InventoryService(null, productRepo, inventoryRepo)

  productRepo._add({ id: 1, code: 'P001', name: 'Producto A' })

  try {
    await service.createAdjustment({ productId: null, type: 'entry', quantity: 5 })
    assert(false, 'debería validar producto requerido')
  } catch (error) {
    assert(error.message.includes('producto'), 'Error debería mencionar producto')
  }

  try {
    await service.createAdjustment({ productId: 1, type: '', quantity: 5 })
    assert(false, 'debería validar tipo requerido')
  } catch (error) {
    assert(error.message.includes('tipo'), 'Error debería mencionar tipo')
  }

  try {
    await service.createAdjustment({ productId: 1, type: 'entry', quantity: 0 })
    assert(false, 'debería validar cantidad no cero')
  } catch (error) {
    assert(error.message.includes('cantidad'), 'Error debería mencionar cantidad')
  }

  console.log('  ✓ testCreateAdjustmentValidation')
}

async function testGetProductById() {
  const productRepo = createMockProductRepo()
  const service = new InventoryService(null, productRepo, null)

  productRepo._add({ id: 1, code: 'P001', name: 'Producto A' })

  const product = await service.getProductById(1)
  assert(product.id === 1, 'getProductById debería retornar el producto')

  try {
    await service.getProductById(null)
    assert(false, 'getProductById(null) debería lanzar error')
  } catch { /* Expected */ }

  try {
    await service.getProductById(999)
    assert(false, 'getProductById(999) debería lanzar error')
  } catch { /* Expected */ }

  console.log('  ✓ testGetProductById')
}

export async function runInventoryServiceTests() {
  console.log('\n--- InventoryService Tests ---\n')

  await testGetStockOverview()
  await testGetStockStatus()
  await testGetMovementsByProduct()
  await testCreateAdjustment()
  await testCreateAdjustmentExit()
  await testCreateAdjustmentPreventsNegativeStock()
  await testCreateAdjustmentValidation()
  await testGetProductById()

  console.log('\n✓ Todos los tests de InventoryService pasaron\n')
}
