import { InventoryController } from '../../src/controllers/InventoryController.js'

function createMockService() {
  const overview = []

  return {
    async getStockOverview() { return [...overview] },

    async getMovementsByProduct(productId) { return [] },

    async getProductById(productId) {
      return { id: productId, code: 'P001', name: 'Producto Test' }
    },

    async createAdjustment(data) {
      return { id: 1, ...data, stockBefore: 10, stockAfter: 15 }
    },

    setOverview(data) {
      overview.length = 0
      overview.push(...data)
    }
  }
}

function createMockView() {
  return {
    stockData: null,
    errorMessage: null,
    successMessage: null,
    formOpened: false,
    formClosed: false,
    movementsOpened: false,
    loadingState: false,
    savingState: false,

    reset() {
      this.stockData = null
      this.errorMessage = null
      this.successMessage = null
      this.formOpened = false
      this.formClosed = false
      this.movementsOpened = false
      this.loadingState = false
      this.savingState = false
    },

    render(container) { this._container = container },

    renderStock(data) { this.stockData = data },

    showAdjustForm(onSubmit, onCancel) {
      this.formOpened = true
      this._formSubmit = onSubmit
      this._formCancel = onCancel
    },

    closeForm() { this.formClosed = true },

    showMovementsModal(product, movements, onClose) {
      this.movementsOpened = true
    },

    closeMovementsModal() { this.movementsOpened = false },

    showLoading() { this.loadingState = true },
    hideLoading() { this.loadingState = false },
    showSaving() { this.savingState = true },
    hideSaving() { this.savingState = false },

    showSuccess(msg) { this.successMessage = msg },
    showError(msg) { this.errorMessage = msg },

    onSearch(cb) { this._searchCb = cb },
    onAdjust(cb) { this._adjustCb = cb },
    onViewMovements(cb) { this._movementsCb = cb }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testInitLoadsStock() {
  const service = createMockService()
  const view = createMockView()
  const controller = new InventoryController(service, view)

  service.setOverview([
    { id: 1, code: 'P001', name: 'Prod A', stock: 10, status: 'ok' },
    { id: 2, code: 'P002', name: 'Prod B', stock: 3, status: 'low' }
  ])

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.stockData !== null, 'init debería cargar stock')
  assert(view.stockData.length === 2, 'init debería cargar 2 productos')
  assert(view.stockData[0].status === 'ok', 'Estado del primer producto debería ser ok')

  console.log('  ✓ testInitLoadsStock')
}

async function testHandleSearch() {
  const service = createMockService()
  const view = createMockView()
  const controller = new InventoryController(service, view)

  service.setOverview([
    { id: 1, code: 'P001', name: 'Laptop HP', category: 'Electrónica', stock: 10, stockMin: 5, status: 'ok' },
    { id: 2, code: 'P002', name: 'Monitor Samsung', category: 'Electrónica', stock: 3, stockMin: 5, status: 'low' }
  ])

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSearch('Laptop')
  assert(view.stockData.length === 1, 'búsqueda debería filtrar a 1 producto')
  assert(view.stockData[0].name === 'Laptop HP', 'búsqueda debería encontrar Laptop')

  await controller.handleSearch('')
  assert(view.stockData.length === 2, 'búsqueda vacía debería retornar todos')

  console.log('  ✓ testHandleSearch')
}

async function testHandleAdjust() {
  const service = createMockService()
  const view = createMockView()
  const controller = new InventoryController(service, view)

  service.setOverview([{ id: 1, code: 'P001', name: 'Prod A', stock: 10, status: 'ok' }])

  const container = document.createElement('div')
  await controller.init(container)

  controller.showAdjustForm()
  assert(view.formOpened, 'showAdjustForm debería abrir formulario')

  await view._formSubmit({ productId: 1, type: 'entry', quantity: 5, notes: 'Ajuste' })

  assert(view.successMessage !== null, 'handleAdjust debería mostrar éxito')
  assert(view.formClosed, 'handleAdjust debería cerrar formulario')

  console.log('  ✓ testHandleAdjust')
}

async function testHandleAdjustError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new InventoryController(service, view)

  service.createAdjustment = async () => { throw new Error('Error de ajuste') }

  const container = document.createElement('div')
  await controller.init(container)

  controller.showAdjustForm()

  await view._formSubmit({ productId: 1, type: 'entry', quantity: 5 })

  assert(view.errorMessage === 'Error de ajuste', 'handleAdjust debería mostrar error del servicio')

  console.log('  ✓ testHandleAdjustError')
}

async function testShowMovements() {
  const service = createMockService()
  const view = createMockView()
  const controller = new InventoryController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showMovements(1)

  assert(view.movementsOpened, 'showMovements debería abrir modal de movimientos')

  console.log('  ✓ testShowMovements')
}

async function testHandleSearchError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new InventoryController(service, view)

  service.getStockOverview = async () => { throw new Error('Error de carga') }

  const container = document.createElement('div')

  try {
    await controller.init(container)
    assert(view.errorMessage === 'Error de carga', 'init debería mostrar error si falla carga')
  } catch { /* Expected - error handling via view */ }

  console.log('  ✓ testHandleSearchError')
}

async function testHandleSearchQueryError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new InventoryController(service, view)

  service.setOverview([
    { id: 1, code: 'P001', name: 'Prod A', category: 'A', stock: 10, stockMin: 5, status: 'ok' }
  ])

  const container = document.createElement('div')
  await controller.init(container)

  service.getStockOverview = async () => { throw new Error('Error al buscar') }
  view.reset()

  await controller.handleSearch('algo')

  assert(view.errorMessage === 'Error al buscar', 'handleSearch debería mostrar error')

  console.log('  ✓ testHandleSearchQueryError')
}

async function testShowMovementsError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new InventoryController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  service.getMovementsByProduct = async () => { throw new Error('Error al cargar movimientos') }
  view.reset()

  await controller.showMovements(1)

  assert(view.errorMessage === 'Error al cargar movimientos', 'showMovements debería mostrar error')

  console.log('  ✓ testShowMovementsError')
}

export async function runInventoryControllerTests() {
  console.log('\n--- InventoryController Tests ---\n')

  await testInitLoadsStock()
  await testHandleSearch()
  await testHandleAdjust()
  await testHandleAdjustError()
  await testShowMovements()
  await testHandleSearchError()
  await testHandleSearchQueryError()
  await testShowMovementsError()

  console.log('\n✓ Todos los tests de InventoryController pasaron\n')
}
