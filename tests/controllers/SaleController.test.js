import { SaleController } from '../../src/controllers/SaleController.js'

function createMockService() {
  const sales = []
  let nextId = 1

  return {
    async getAll() { return [...sales] },

    async getById(id) {
      const s = sales.find(x => x.id === id)
      if (!s) throw new Error(`Venta con id ${id} no encontrada`)
      return { ...s, items: [] }
    },

    async createSale(saleData, items) {
      const s = { id: nextId++, ...saleData, subtotal: 100, tax: 18, total: 118, status: 'completed', date: new Date().toISOString() }
      sales.push(s)
      return { ...s, items }
    },

    async cancelSale(id) {
      const s = sales.find(x => x.id === id)
      if (!s) throw new Error('No encontrada')
      s.status = 'cancelled'
      return { ...s }
    },

    _add(data) {
      const s = { id: nextId++, ...data, status: 'completed', date: new Date().toISOString() }
      sales.push(s)
      return s
    }
  }
}

function createMockProductService() {
  return {
    async getAll() { return [{ id: 1, code: 'P001', name: 'Producto 1', salePrice: 100, stock: 50 }] }
  }
}

function createMockCustomerService() {
  return {
    async getAll() { return [{ id: 1, name: 'Cliente 1', documentId: 'C001' }] }
  }
}

function createMockView() {
  return {
    salesData: null,
    errorMessage: null,
    successMessage: null,
    formOpened: false,
    formClosed: false,
    detailOpened: false,
    savingState: false,
    loadingState: false,
    confirmed: true,

    reset() {
      this.salesData = null
      this.errorMessage = null
      this.successMessage = null
      this.formOpened = false
      this.formClosed = false
      this.detailOpened = false
      this.savingState = false
      this.loadingState = false
    },

    render(container) { this._container = container },

    renderSales(data) { this.salesData = data },

    showNewSaleForm(customers, products, { onSubmit, onCancel }) {
      this.formOpened = true
      this._formSubmit = onSubmit
      this._formCancel = onCancel
    },

    closeForm() { this.formClosed = true },

    showDetailModal(sale, onClose) { this.detailOpened = true },
    closeDetailModal() { this.detailOpened = false },

    showLoading() { this.loadingState = true },
    hideLoading() { this.loadingState = false },
    showSaving() { this.savingState = true },
    hideSaving() { this.savingState = false },

    showSuccess(msg) { this.successMessage = msg },
    showError(msg) { this.errorMessage = msg },

    async confirmCancel() { return this.confirmed },
    async confirmDelete() { return this.confirmed },

    onNewSale(cb) { this._newSaleCb = cb },
    onViewDetail(cb) { this._detailCb = cb },
    onCancelSale(cb) { this._cancelCb = cb },
    onDeleteSale(cb) { this._deleteCb = cb }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testInitLoadsSales() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SaleController(service, view, createMockProductService(), createMockCustomerService())

  service._add({ id: 1, customerName: 'Cliente A', total: 100 })
  service._add({ id: 2, customerName: 'Cliente B', total: 200 })

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.salesData !== null, 'init debería cargar ventas')
  assert(view.salesData.length === 2, 'init debería cargar 2 ventas')

  console.log('  ✓ testInitLoadsSales')
}

async function testShowNewSale() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SaleController(service, view, createMockProductService(), createMockCustomerService())

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showNewSale()
  assert(view.formOpened, 'showNewSale debería abrir formulario')

  console.log('  ✓ testShowNewSale')
}

async function testHandleCreate() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SaleController(service, view, createMockProductService(), createMockCustomerService())

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showNewSale()

  await view._formSubmit({
    saleData: { customerId: 1, customerName: 'Cliente 1', notes: '' },
    items: [{ productId: 1, quantity: 2, unitPrice: 100 }]
  })

  assert(view.successMessage !== null, 'handleCreate debería mostrar éxito')
  assert(view.formClosed, 'handleCreate debería cerrar formulario')
  assert(view.salesData.length === 1, 'handleCreate debería recargar lista')

  console.log('  ✓ testHandleCreate')
}

async function testHandleCreateError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SaleController(service, view, createMockProductService(), createMockCustomerService())

  service.createSale = async () => { throw new Error('Error al crear venta') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showNewSale()

  await view._formSubmit({
    saleData: { customerId: 1, customerName: 'Cliente 1', notes: '' },
    items: [{ productId: 1, quantity: 1 }]
  })

  assert(view.errorMessage === 'Error al crear venta', 'handleCreate debería mostrar error')

  console.log('  ✓ testHandleCreateError')
}

async function testShowDetail() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SaleController(service, view, createMockProductService(), createMockCustomerService())

  service._add({ id: 1, customerName: 'Test', total: 100 })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showDetail(1)
  assert(view.detailOpened, 'showDetail debería abrir modal de detalle')

  console.log('  ✓ testShowDetail')
}

async function testHandleCancel() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SaleController(service, view, createMockProductService(), createMockCustomerService())

  service._add({ id: 1, customerName: 'Test', total: 100 })

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = true
  await controller.handleCancel(1)

  assert(view.successMessage !== null, 'handleCancel debería mostrar éxito')
  const all = await service.getAll()
  assert(all[0].status === 'cancelled', 'La venta debería estar anulada')

  console.log('  ✓ testHandleCancel')
}

async function testInitLoadError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SaleController(service, view, createMockProductService(), createMockCustomerService())

  service.getAll = async () => { throw new Error('Error al cargar ventas') }

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.errorMessage === 'Error al cargar ventas', 'init debería mostrar error si falla carga')

  console.log('  ✓ testInitLoadError')
}

async function testShowNewSaleError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SaleController(service, view, createMockProductService(), createMockCustomerService())

  const productService = { getAll: async () => { throw new Error('Error al cargar productos') } }
  const controller2 = new SaleController(service, view, productService, createMockCustomerService())

  const container = document.createElement('div')
  await controller2.init(container)

  await controller2.showNewSale()

  assert(view.errorMessage === 'Error al cargar productos', 'showNewSale debería mostrar error')

  console.log('  ✓ testShowNewSaleError')
}

async function testShowDetailError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SaleController(service, view, createMockProductService(), createMockCustomerService())

  service.getById = async () => { throw new Error('Error al obtener venta') }

  const container = document.createElement('div')
  await controller.init(container)

  view.reset()
  await controller.showDetail(999)

  assert(view.errorMessage === 'Error al obtener venta', 'showDetail debería mostrar error')

  console.log('  ✓ testShowDetailError')
}

async function testHandleCancelError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SaleController(service, view, createMockProductService(), createMockCustomerService())

  service._add({ id: 1, customerName: 'Test', total: 100 })
  service.cancelSale = async () => { throw new Error('Error al anular venta') }

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = true
  await controller.handleCancel(1)

  assert(view.errorMessage === 'Error al anular venta', 'handleCancel debería mostrar error')

  console.log('  ✓ testHandleCancelError')
}

async function testHandleCancelCancelled() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SaleController(service, view, createMockProductService(), createMockCustomerService())

  service._add({ id: 1, customerName: 'Test', total: 100 })

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = false
  view.reset()

  await controller.handleCancel(1)

  assert(view.successMessage === null, 'Cancelación rechazada no debería mostrar éxito')

  console.log('  ✓ testHandleCancelCancelled')
}

export async function runSaleControllerTests() {
  console.log('\n--- SaleController Tests ---\n')

  await testInitLoadsSales()
  await testShowNewSale()
  await testHandleCreate()
  await testHandleCreateError()
  await testShowDetail()
  await testHandleCancel()
  await testHandleCancelCancelled()
  await testInitLoadError()
  await testShowNewSaleError()
  await testShowDetailError()
  await testHandleCancelError()

  console.log('\n✓ Todos los tests de SaleController pasaron\n')
}
