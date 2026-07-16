import { PurchaseController } from '../../src/controllers/PurchaseController.js'

function createMockService() {
  const purchases = []
  let nextId = 1

  return {
    async getAll() { return [...purchases] },

    async getById(id) {
      const p = purchases.find(x => x.id === id)
      if (!p) throw new Error(`Compra con id ${id} no encontrada`)
      return { ...p, items: [] }
    },

    async createPurchase(purchaseData, items) {
      const p = { id: nextId++, ...purchaseData, subtotal: 100, tax: 18, total: 118, status: 'completed', date: new Date().toISOString() }
      purchases.push(p)
      return { ...p, items }
    },

    async cancelPurchase(id) {
      const p = purchases.find(x => x.id === id)
      if (!p) throw new Error('No encontrada')
      p.status = 'cancelled'
      return { ...p }
    },

    _add(data) {
      const p = { id: nextId++, ...data, status: 'completed', date: new Date().toISOString() }
      purchases.push(p)
      return p
    }
  }
}

function createMockProductService() {
  return {
    async getAll() { return [{ id: 1, code: 'P001', name: 'Producto 1', purchasePrice: 30, stock: 50 }] }
  }
}

function createMockSupplierService() {
  return {
    async getAll() { return [{ id: 1, name: 'Proveedor 1', documentId: 'PROV-001' }] }
  }
}

function createMockView() {
  return {
    purchasesData: null,
    errorMessage: null,
    successMessage: null,
    formOpened: false,
    formClosed: false,
    detailOpened: false,
    savingState: false,
    loadingState: false,
    confirmed: true,

    reset() {
      this.purchasesData = null
      this.errorMessage = null
      this.successMessage = null
      this.formOpened = false
      this.formClosed = false
      this.detailOpened = false
      this.savingState = false
      this.loadingState = false
    },

    render(container) { this._container = container },

    renderPurchases(data) { this.purchasesData = data },

    showNewPurchaseForm(suppliers, products, { onSubmit, onCancel }) {
      this.formOpened = true
      this._formSubmit = onSubmit
      this._formCancel = onCancel
    },

    closeForm() { this.formClosed = true },

    showDetailModal(purchase, onClose) { this.detailOpened = true },
    closeDetailModal() { this.detailOpened = false },

    showLoading() { this.loadingState = true },
    hideLoading() { this.loadingState = false },
    showSaving() { this.savingState = true },
    hideSaving() { this.savingState = false },

    showSuccess(msg) { this.successMessage = msg },
    showError(msg) { this.errorMessage = msg },

    async confirmCancel() { return this.confirmed },
    async confirmDelete() { return this.confirmed },

    onNewPurchase(cb) { this._newPurchaseCb = cb },
    onViewDetail(cb) { this._detailCb = cb },
    onCancelPurchase(cb) { this._cancelCb = cb },
    onDeletePurchase(cb) { this._deleteCb = cb }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testInitLoadsPurchases() {
  const service = createMockService()
  const view = createMockView()
  const controller = new PurchaseController(service, view, createMockProductService(), createMockSupplierService())

  service._add({ id: 1, supplierName: 'Proveedor A', total: 100 })
  service._add({ id: 2, supplierName: 'Proveedor B', total: 200 })

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.purchasesData !== null, 'init debería cargar compras')
  assert(view.purchasesData.length === 2, 'init debería cargar 2 compras')

  console.log('  ✓ testInitLoadsPurchases')
}

async function testShowNewPurchase() {
  const service = createMockService()
  const view = createMockView()
  const controller = new PurchaseController(service, view, createMockProductService(), createMockSupplierService())

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showNewPurchase()
  assert(view.formOpened, 'showNewPurchase debería abrir formulario')

  console.log('  ✓ testShowNewPurchase')
}

async function testHandleCreate() {
  const service = createMockService()
  const view = createMockView()
  const controller = new PurchaseController(service, view, createMockProductService(), createMockSupplierService())

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showNewPurchase()

  await view._formSubmit({
    purchaseData: { supplierId: 1, supplierName: 'Proveedor 1', notes: '' },
    items: [{ productId: 1, quantity: 5, unitPrice: 30 }]
  })

  assert(view.successMessage !== null, 'handleCreate debería mostrar éxito')
  assert(view.formClosed, 'handleCreate debería cerrar formulario')
  assert(view.purchasesData.length === 1, 'handleCreate debería recargar lista')

  console.log('  ✓ testHandleCreate')
}

async function testHandleCreateError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new PurchaseController(service, view, createMockProductService(), createMockSupplierService())

  service.createPurchase = async () => { throw new Error('Error al crear compra') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showNewPurchase()

  await view._formSubmit({
    purchaseData: { supplierId: 1, supplierName: 'Proveedor 1', notes: '' },
    items: [{ productId: 1, quantity: 1 }]
  })

  assert(view.errorMessage === 'Error al crear compra', 'handleCreate debería mostrar error')

  console.log('  ✓ testHandleCreateError')
}

async function testShowDetail() {
  const service = createMockService()
  const view = createMockView()
  const controller = new PurchaseController(service, view, createMockProductService(), createMockSupplierService())

  service._add({ id: 1, supplierName: 'Test', total: 100 })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showDetail(1)
  assert(view.detailOpened, 'showDetail debería abrir modal de detalle')

  console.log('  ✓ testShowDetail')
}

async function testHandleCancel() {
  const service = createMockService()
  const view = createMockView()
  const controller = new PurchaseController(service, view, createMockProductService(), createMockSupplierService())

  service._add({ id: 1, supplierName: 'Test', total: 100 })

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = true
  await controller.handleCancel(1)

  assert(view.successMessage !== null, 'handleCancel debería mostrar éxito')
  const all = await service.getAll()
  assert(all[0].status === 'cancelled', 'La compra debería estar anulada')

  console.log('  ✓ testHandleCancel')
}

async function testInitLoadError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new PurchaseController(service, view, createMockProductService(), createMockSupplierService())

  service.getAll = async () => { throw new Error('Error al cargar compras') }

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.errorMessage === 'Error al cargar compras', 'init debería mostrar error si falla carga')

  console.log('  ✓ testInitLoadError')
}

async function testShowNewPurchaseError() {
  const service = createMockService()
  const view = createMockView()

  const productService = { getAll: async () => { throw new Error('Error al cargar productos') } }
  const controller2 = new PurchaseController(service, view, productService, createMockSupplierService())

  const container = document.createElement('div')
  await controller2.init(container)

  await controller2.showNewPurchase()

  assert(view.errorMessage === 'Error al cargar productos', 'showNewPurchase debería mostrar error')

  console.log('  ✓ testShowNewPurchaseError')
}

async function testShowDetailError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new PurchaseController(service, view, createMockProductService(), createMockSupplierService())

  service.getById = async () => { throw new Error('Error al obtener compra') }

  const container = document.createElement('div')
  await controller.init(container)

  view.reset()
  await controller.showDetail(999)

  assert(view.errorMessage === 'Error al obtener compra', 'showDetail debería mostrar error')

  console.log('  ✓ testShowDetailError')
}

async function testHandleCancelError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new PurchaseController(service, view, createMockProductService(), createMockSupplierService())

  service._add({ id: 1, supplierName: 'Test', total: 100 })
  service.cancelPurchase = async () => { throw new Error('Error al anular compra') }

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = true
  await controller.handleCancel(1)

  assert(view.errorMessage === 'Error al anular compra', 'handleCancel debería mostrar error')

  console.log('  ✓ testHandleCancelError')
}

async function testHandleCancelCancelled() {
  const service = createMockService()
  const view = createMockView()
  const controller = new PurchaseController(service, view, createMockProductService(), createMockSupplierService())

  service._add({ id: 1, supplierName: 'Test', total: 100 })

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = false
  view.reset()

  await controller.handleCancel(1)

  assert(view.successMessage === null, 'Cancelación rechazada no debería mostrar éxito')

  console.log('  ✓ testHandleCancelCancelled')
}

export async function runPurchaseControllerTests() {
  console.log('\n--- PurchaseController Tests ---\n')

  await testInitLoadsPurchases()
  await testShowNewPurchase()
  await testHandleCreate()
  await testHandleCreateError()
  await testShowDetail()
  await testHandleCancel()
  await testHandleCancelCancelled()
  await testInitLoadError()
  await testShowNewPurchaseError()
  await testShowDetailError()
  await testHandleCancelError()

  console.log('\n✓ Todos los tests de PurchaseController pasaron\n')
}
