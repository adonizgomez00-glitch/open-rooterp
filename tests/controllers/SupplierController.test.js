import { SupplierController } from '../../src/controllers/SupplierController.js'

function createMockRepo() {
  return {
    async generateNextDocumentId() { return 'PROV-004' }
  }
}

function createMockService() {
  let suppliers = []
  let nextId = 1

  return {
    async getAll() { return [...suppliers] },

    async getById(id) {
      const s = suppliers.find(x => x.id === id)
      if (!s) throw new Error(`Proveedor con id ${id} no encontrado`)
      return { ...s }
    },

    async search(query) {
      if (!query.trim()) return [...suppliers]
      const lower = query.toLowerCase()
      return suppliers.filter(s => s.name.toLowerCase().includes(lower))
    },

    async create(data) {
      const s = { id: nextId++, ...data }
      suppliers.push(s)
      return { ...s }
    },

    async update(id, data) {
      const idx = suppliers.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Proveedor con id ${id} no encontrado`)
      suppliers[idx] = { ...suppliers[idx], ...data }
      return { ...suppliers[idx] }
    },

    async delete(id) {
      const idx = suppliers.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Proveedor con id ${id} no encontrado`)
      suppliers.splice(idx, 1)
      return true
    }
  }
}

function createMockView() {
  return {
    rendered: false,
    suppliersData: null,
    errorMessage: null,
    successMessage: null,
    formOpened: false,
    formClosed: false,
    formEntity: null,
    savingState: false,
    loadingState: false,
    confirmed: true,

    reset() {
      this.rendered = false
      this.suppliersData = null
      this.errorMessage = null
      this.successMessage = null
      this.formOpened = false
      this.formClosed = false
      this.formEntity = null
      this.savingState = false
      this.loadingState = false
    },

    render(container) {
      this.rendered = true
      this._container = container
    },

    renderSuppliers(suppliers) {
      this.suppliersData = suppliers
    },

    showForm(entity, onSubmit, onCancel) {
      this.formOpened = true
      this.formEntity = entity
      this._formSubmit = onSubmit
      this._formCancel = onCancel
    },

    closeForm() { this.formClosed = true },

    showLoading() { this.loadingState = true },
    hideLoading() { this.loadingState = false },
    showSaving() { this.savingState = true },
    hideSaving() { this.savingState = false },

    showSuccess(msg) { this.successMessage = msg },
    showError(msg) { this.errorMessage = msg },

    async confirmDelete() { return this.confirmed },

    onSearch(cb) { this._searchCb = cb },
    onCreate(cb) { this._createCb = cb },
    onEdit(cb) { this._editCb = cb },
    onDelete(cb) { this._deleteCb = cb }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testInitLoadsSuppliers() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SupplierController(service, view, createMockRepo())

  await service.create({ documentId: 'PROV-001', name: 'Proveedor 1' })
  await service.create({ documentId: 'PROV-002', name: 'Proveedor 2' })

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.rendered, 'init debería llamar a view.render')
  assert(view.suppliersData !== null, 'init debería cargar proveedores')
  assert(view.suppliersData.length === 2, 'init debería cargar 2 proveedores')

  console.log('  ✓ testInitLoadsSuppliers')
}

async function testHandleSearch() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SupplierController(service, view, createMockRepo())

  await service.create({ documentId: 'PROV-001', name: 'Tech Solutions' })
  await service.create({ documentId: 'PROV-002', name: 'Global Imports' })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSearch('Tech')
  assert(view.suppliersData.length === 1, 'búsqueda debería filtrar a 1 proveedor')
  assert(view.suppliersData[0].name === 'Tech Solutions', 'búsqueda debería encontrar Tech')

  await controller.handleSearch('')
  assert(view.suppliersData.length === 2, 'búsqueda vacía debería retornar todos')

  console.log('  ✓ testHandleSearch')
}

async function testHandleCreate() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SupplierController(service, view, createMockRepo())

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showCreateForm()
  assert(view.formOpened, 'showCreateForm debería abrir formulario')
  assert(view.formEntity === null, 'showCreateForm debería pasar null')

  await view._formSubmit({ documentId: 'PROV-001', name: 'Nuevo Proveedor', email: 'prov@email.com' })

  assert(view.successMessage !== null, 'handleSave debería mostrar éxito')
  assert(view.formClosed, 'handleSave debería cerrar formulario')
  assert(view.suppliersData.length === 1, 'handleSave debería recargar lista')

  console.log('  ✓ testHandleCreate')
}

async function testHandleUpdate() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SupplierController(service, view, createMockRepo())

  await service.create({ documentId: 'PROV-001', name: 'Original' })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showEditForm(1)
  assert(view.formOpened, 'showEditForm debería abrir formulario')
  assert(view.formEntity !== null, 'showEditForm debería pasar el proveedor')

  await view._formSubmit({ documentId: 'PROV-001', name: 'Actualizado' })

  assert(view.successMessage?.includes('actualizado'), 'update debería mostrar mensaje de actualización')
  const updated = await service.getById(1)
  assert(updated.name === 'Actualizado', 'update debería cambiar el nombre')

  console.log('  ✓ testHandleUpdate')
}

async function testHandleDelete() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SupplierController(service, view, createMockRepo())

  await service.create({ documentId: 'PROV-001', name: 'A eliminar' })

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = true
  await controller.handleDelete(1)

  assert(view.successMessage !== null, 'delete debería mostrar éxito')
  const all = await service.getAll()
  assert(all.length === 0, 'delete debería eliminar el proveedor')

  console.log('  ✓ testHandleDelete')
}

async function testHandleDeleteCancelled() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SupplierController(service, view, createMockRepo())

  await service.create({ documentId: 'PROV-001', name: 'A eliminar' })

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = false
  view.reset()

  await controller.handleDelete(1)

  const all = await service.getAll()
  assert(all.length === 1, 'delete cancelado no debería eliminar')
  assert(view.successMessage === null, 'delete cancelado no debería mostrar éxito')

  console.log('  ✓ testHandleDeleteCancelled')
}

async function testInitLoadError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SupplierController(service, view, createMockRepo())

  service.getAll = async () => { throw new Error('Error al cargar proveedores') }

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.errorMessage === 'Error al cargar proveedores', 'init debería mostrar error si falla carga')

  console.log('  ✓ testInitLoadError')
}

async function testShowEditFormError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SupplierController(service, view, createMockRepo())

  const container = document.createElement('div')
  await controller.init(container)

  service.getById = async () => { throw new Error('Error al obtener proveedor') }
  view.reset()

  await controller.showEditForm(999)
  assert(view.errorMessage === 'Error al obtener proveedor', 'showEditForm debería mostrar error')

  console.log('  ✓ testShowEditFormError')
}

async function testHandleSaveCreateError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SupplierController(service, view, createMockRepo())

  service.create = async () => { throw new Error('Error al crear proveedor') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showCreateForm()
  await view._formSubmit({ documentId: 'PROV-001', name: 'Nuevo' })

  assert(view.errorMessage === 'Error al crear proveedor', 'handleSave create debería mostrar error')

  console.log('  ✓ testHandleSaveCreateError')
}

async function testHandleSaveUpdateError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SupplierController(service, view, createMockRepo())

  await service.create({ documentId: 'PROV-001', name: 'Original' })
  service.update = async () => { throw new Error('Error al actualizar proveedor') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showEditForm(1)
  view.reset()
  await view._formSubmit({ documentId: 'PROV-001', name: 'Actualizado' })

  assert(view.errorMessage === 'Error al actualizar proveedor', 'handleSave update debería mostrar error')

  console.log('  ✓ testHandleSaveUpdateError')
}

async function testHandleDeleteError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SupplierController(service, view, createMockRepo())

  await service.create({ documentId: 'PROV-001', name: 'A eliminar' })
  service.delete = async () => { throw new Error('Error al eliminar proveedor') }

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = true
  await controller.handleDelete(1)

  assert(view.errorMessage === 'Error al eliminar proveedor', 'handleDelete debería mostrar error')

  console.log('  ✓ testHandleDeleteError')
}

async function testHandleSearchError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SupplierController(service, view, createMockRepo())

  service.search = async () => { throw new Error('Error de búsqueda') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSearch('algo')

  assert(view.errorMessage === 'Error de búsqueda', 'handleSearch debería mostrar error')

  console.log('  ✓ testHandleSearchError')
}

export async function runSupplierControllerTests() {
  console.log('\n--- SupplierController Tests ---\n')

  await testInitLoadsSuppliers()
  await testHandleSearch()
  await testHandleCreate()
  await testHandleUpdate()
  await testHandleDelete()
  await testHandleDeleteCancelled()
  await testInitLoadError()
  await testShowEditFormError()
  await testHandleSaveCreateError()
  await testHandleSaveUpdateError()
  await testHandleDeleteError()
  await testHandleSearchError()

  console.log('\n✓ Todos los tests de SupplierController pasaron\n')
}
