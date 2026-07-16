import { CustomerController } from '../../src/controllers/CustomerController.js'

function createMockRepo() {
  return {
    async generateNextDocumentId() { return 'C006' }
  }
}

function createMockService() {
  let customers = []
  let nextId = 1

  return {
    async getAll() { return [...customers] },

    async getById(id) {
      const c = customers.find(x => x.id === id)
      if (!c) throw new Error(`Cliente con id ${id} no encontrado`)
      return { ...c }
    },

    async search(query) {
      if (!query.trim()) return [...customers]
      const lower = query.toLowerCase()
      return customers.filter(c => c.name.toLowerCase().includes(lower))
    },

    async create(data) {
      const c = { id: nextId++, ...data }
      customers.push(c)
      return { ...c }
    },

    async update(id, data) {
      const idx = customers.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Cliente con id ${id} no encontrado`)
      customers[idx] = { ...customers[idx], ...data }
      return { ...customers[idx] }
    },

    async delete(id) {
      const idx = customers.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Cliente con id ${id} no encontrado`)
      customers.splice(idx, 1)
      return true
    }
  }
}

function createMockView() {
  return {
    rendered: false,
    customersData: null,
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
      this.customersData = null
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

    renderCustomers(customers) {
      this.customersData = customers
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

async function testInitLoadsCustomers() {
  const service = createMockService()
  const view = createMockView()
  const controller = new CustomerController(service, view, createMockRepo())

  await service.create({ documentId: 'C001', name: 'Cliente 1' })
  await service.create({ documentId: 'C002', name: 'Cliente 2' })

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.rendered, 'init debería llamar a view.render')
  assert(view.customersData !== null, 'init debería cargar clientes')
  assert(view.customersData.length === 2, 'init debería cargar 2 clientes')

  console.log('  ✓ testInitLoadsCustomers')
}

async function testHandleSearch() {
  const service = createMockService()
  const view = createMockView()
  const controller = new CustomerController(service, view, createMockRepo())

  await service.create({ documentId: 'C001', name: 'Juan Pérez' })
  await service.create({ documentId: 'C002', name: 'María García' })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSearch('Juan')
  assert(view.customersData.length === 1, 'búsqueda debería filtrar a 1 cliente')
  assert(view.customersData[0].name === 'Juan Pérez', 'búsqueda debería encontrar Juan')

  await controller.handleSearch('')
  assert(view.customersData.length === 2, 'búsqueda vacía debería retornar todos')

  console.log('  ✓ testHandleSearch')
}

async function testHandleCreate() {
  const service = createMockService()
  const view = createMockView()
  const controller = new CustomerController(service, view, createMockRepo())

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showCreateForm()
  assert(view.formOpened, 'showCreateForm debería abrir formulario')
  assert(view.formEntity === null, 'showCreateForm debería pasar null')

  await view._formSubmit({ documentId: 'C001', name: 'Nuevo Cliente', email: 'cliente@email.com' })

  assert(view.successMessage !== null, 'handleSave debería mostrar éxito')
  assert(view.formClosed, 'handleSave debería cerrar formulario')
  assert(view.customersData.length === 1, 'handleSave debería recargar lista')

  console.log('  ✓ testHandleCreate')
}

async function testHandleUpdate() {
  const service = createMockService()
  const view = createMockView()
  const controller = new CustomerController(service, view, createMockRepo())

  await service.create({ documentId: 'C001', name: 'Original' })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showEditForm(1)
  assert(view.formOpened, 'showEditForm debería abrir formulario')
  assert(view.formEntity !== null, 'showEditForm debería pasar el cliente')

  await view._formSubmit({ documentId: 'C001', name: 'Actualizado' })

  assert(view.successMessage?.includes('actualizado'), 'update debería mostrar mensaje de actualización')
  const updated = await service.getById(1)
  assert(updated.name === 'Actualizado', 'update debería cambiar el nombre')

  console.log('  ✓ testHandleUpdate')
}

async function testHandleDelete() {
  const service = createMockService()
  const view = createMockView()
  const controller = new CustomerController(service, view, createMockRepo())

  await service.create({ documentId: 'C001', name: 'A eliminar' })

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = true
  await controller.handleDelete(1)

  assert(view.successMessage !== null, 'delete debería mostrar éxito')
  const all = await service.getAll()
  assert(all.length === 0, 'delete debería eliminar el cliente')

  console.log('  ✓ testHandleDelete')
}

async function testHandleDeleteCancelled() {
  const service = createMockService()
  const view = createMockView()
  const controller = new CustomerController(service, view, createMockRepo())

  await service.create({ documentId: 'C001', name: 'A eliminar' })

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
  const controller = new CustomerController(service, view, createMockRepo())

  service.getAll = async () => { throw new Error('Error al cargar clientes') }

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.errorMessage === 'Error al cargar clientes', 'init debería mostrar error si falla carga')

  console.log('  ✓ testInitLoadError')
}

async function testShowEditFormError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new CustomerController(service, view, createMockRepo())

  const container = document.createElement('div')
  await controller.init(container)

  service.getById = async () => { throw new Error('Error al obtener cliente') }
  view.reset()

  await controller.showEditForm(999)
  assert(view.errorMessage === 'Error al obtener cliente', 'showEditForm debería mostrar error')

  console.log('  ✓ testShowEditFormError')
}

async function testHandleSaveCreateError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new CustomerController(service, view, createMockRepo())

  service.create = async () => { throw new Error('Error al crear cliente') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showCreateForm()
  await view._formSubmit({ documentId: 'C001', name: 'Nuevo' })

  assert(view.errorMessage === 'Error al crear cliente', 'handleSave create debería mostrar error')

  console.log('  ✓ testHandleSaveCreateError')
}

async function testHandleSaveUpdateError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new CustomerController(service, view, createMockRepo())

  await service.create({ documentId: 'C001', name: 'Original' })
  service.update = async () => { throw new Error('Error al actualizar cliente') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showEditForm(1)
  view.reset()
  await view._formSubmit({ documentId: 'C001', name: 'Actualizado' })

  assert(view.errorMessage === 'Error al actualizar cliente', 'handleSave update debería mostrar error')

  console.log('  ✓ testHandleSaveUpdateError')
}

async function testHandleDeleteError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new CustomerController(service, view, createMockRepo())

  await service.create({ documentId: 'C001', name: 'A eliminar' })
  service.delete = async () => { throw new Error('Error al eliminar cliente') }

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = true
  await controller.handleDelete(1)

  assert(view.errorMessage === 'Error al eliminar cliente', 'handleDelete debería mostrar error')

  console.log('  ✓ testHandleDeleteError')
}

async function testHandleSearchError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new CustomerController(service, view, createMockRepo())

  service.search = async () => { throw new Error('Error de búsqueda') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSearch('algo')

  assert(view.errorMessage === 'Error de búsqueda', 'handleSearch debería mostrar error')

  console.log('  ✓ testHandleSearchError')
}

export async function runCustomerControllerTests() {
  console.log('\n--- CustomerController Tests ---\n')

  await testInitLoadsCustomers()
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

  console.log('\n✓ Todos los tests de CustomerController pasaron\n')
}
