import { ProductController } from '../../src/controllers/ProductController.js'

function createMockRepo() {
  return {
    async generateNextCode() { return 'PROD-011' }
  }
}

function createMockService() {
  let products = []
  let nextId = 1

  return {
    async getAll() { return [...products] },

    async getById(id) {
      const p = products.find(x => x.id === id)
      if (!p) throw new Error(`Producto con id ${id} no encontrado`)
      return { ...p }
    },

    async search(query) {
      if (!query.trim()) return [...products]
      const lower = query.toLowerCase()
      return products.filter(p => p.name.toLowerCase().includes(lower))
    },

    async create(data) {
      const p = { id: nextId++, ...data }
      products.push(p)
      return { ...p }
    },

    async update(id, data) {
      const idx = products.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Producto con id ${id} no encontrado`)
      products[idx] = { ...products[idx], ...data }
      return { ...products[idx] }
    },

    async delete(id) {
      const idx = products.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Producto con id ${id} no encontrado`)
      products.splice(idx, 1)
      return true
    }
  }
}

function createMockView() {
  return {
    rendered: false,
    productsData: null,
    errorMessage: null,
    successMessage: null,
    formOpened: false,
    formClosed: false,
    formProduct: null,
    savingState: false,
    loadingState: false,
    confirmed: true,

    reset() {
      this.rendered = false
      this.productsData = null
      this.errorMessage = null
      this.successMessage = null
      this.formOpened = false
      this.formClosed = false
      this.formProduct = null
      this.savingState = false
      this.loadingState = false
    },

    render(container) {
      this.rendered = true
      this._container = container
    },

    renderProducts(products) {
      this.productsData = products
    },

    showForm(product, onSubmit, onCancel) {
      this.formOpened = true
      this.formProduct = product
      this._formSubmit = onSubmit
      this._formCancel = onCancel
    },

    closeForm() {
      this.formClosed = true
    },

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

async function testInitLoadsProducts() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ProductController(service, view, createMockRepo())

  await service.create({ code: 'P001', name: 'Producto 1' })
  await service.create({ code: 'P002', name: 'Producto 2' })

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.rendered, 'init debería llamar a view.render')
  assert(view.productsData !== null, 'init debería cargar productos')
  assert(view.productsData.length === 2, 'init debería cargar 2 productos')

  console.log('  ✓ testInitLoadsProducts')
}

async function testHandleSearch() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ProductController(service, view, createMockRepo())

  await service.create({ code: 'P001', name: 'Laptop HP' })
  await service.create({ code: 'P002', name: 'Monitor Samsung' })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSearch('Laptop')
  assert(view.productsData.length === 1, 'búsqueda debería filtrar a 1 producto')
  assert(view.productsData[0].name === 'Laptop HP', 'búsqueda debería encontrar Laptop')

  await controller.handleSearch('')
  assert(view.productsData.length === 2, 'búsqueda vacía debería retornar todos')

  console.log('  ✓ testHandleSearch')
}

async function testHandleCreate() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ProductController(service, view, createMockRepo())

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showCreateForm()
  assert(view.formOpened, 'showCreateForm debería abrir formulario')
  assert(view.formProduct === null, 'showCreateForm debería pasar null como producto')

  // Simulate form submit
  await view._formSubmit({ code: 'P001', name: 'Nuevo Producto', salePrice: 100 })

  assert(view.successMessage !== null, 'handleSave debería mostrar éxito')
  assert(view.formClosed, 'handleSave debería cerrar formulario')
  assert(view.productsData.length === 1, 'handleSave debería recargar lista')

  console.log('  ✓ testHandleCreate')
}

async function testHandleUpdate() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ProductController(service, view, createMockRepo())

  await service.create({ code: 'P001', name: 'Original' })

  const container = document.createElement('div')
  await controller.init(container)

  // Set editingId and simulate form submit
  await controller.showEditForm(1)
  assert(view.formOpened, 'showEditForm debería abrir formulario')
  assert(view.formProduct !== null, 'showEditForm debería pasar el producto')

  await view._formSubmit({ code: 'P001', name: 'Actualizado', salePrice: 150 })

  assert(view.successMessage?.includes('actualizado'), 'update debería mostrar mensaje de actualización')
  const updated = await service.getById(1)
  assert(updated.name === 'Actualizado', 'update debería cambiar el nombre')

  console.log('  ✓ testHandleUpdate')
}

async function testHandleDelete() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ProductController(service, view, createMockRepo())

  await service.create({ code: 'P001', name: 'A eliminar' })

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = true
  await controller.handleDelete(1)

  assert(view.successMessage !== null, 'delete debería mostrar éxito')
  const all = await service.getAll()
  assert(all.length === 0, 'delete debería eliminar el producto')

  console.log('  ✓ testHandleDelete')
}

async function testHandleDeleteCancelled() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ProductController(service, view, createMockRepo())

  await service.create({ code: 'P001', name: 'A eliminar' })

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = false
  view.reset()

  await controller.handleDelete(1)

  const all = await service.getAll()
  assert(all.length === 1, 'delete cancelado no debería eliminar el producto')
  assert(view.successMessage === null, 'delete cancelado no debería mostrar éxito')

  console.log('  ✓ testHandleDeleteCancelled')
}

async function testInitLoadError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ProductController(service, view, createMockRepo())

  service.getAll = async () => { throw new Error('Error al cargar productos') }

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.errorMessage === 'Error al cargar productos', 'init debería mostrar error si falla carga')

  console.log('  ✓ testInitLoadError')
}

async function testShowEditFormError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ProductController(service, view, createMockRepo())

  const container = document.createElement('div')
  await controller.init(container)

  service.getById = async () => { throw new Error('Error al obtener producto') }
  view.reset()

  await controller.showEditForm(999)
  assert(view.errorMessage === 'Error al obtener producto', 'showEditForm debería mostrar error')

  console.log('  ✓ testShowEditFormError')
}

async function testHandleSaveCreateError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ProductController(service, view, createMockRepo())

  service.create = async () => { throw new Error('Error al crear producto') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showCreateForm()
  await view._formSubmit({ code: 'P001', name: 'Nuevo' })

  assert(view.errorMessage === 'Error al crear producto', 'handleSave create debería mostrar error')

  console.log('  ✓ testHandleSaveCreateError')
}

async function testHandleSaveUpdateError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ProductController(service, view, createMockRepo())

  await service.create({ code: 'P001', name: 'Original' })
  service.update = async () => { throw new Error('Error al actualizar producto') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showEditForm(1)
  view.reset()
  await view._formSubmit({ code: 'P001', name: 'Actualizado' })

  assert(view.errorMessage === 'Error al actualizar producto', 'handleSave update debería mostrar error')

  console.log('  ✓ testHandleSaveUpdateError')
}

async function testHandleDeleteError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ProductController(service, view, createMockRepo())

  await service.create({ code: 'P001', name: 'A eliminar' })
  service.delete = async () => { throw new Error('Error al eliminar producto') }

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = true
  await controller.handleDelete(1)

  assert(view.errorMessage === 'Error al eliminar producto', 'handleDelete debería mostrar error')

  console.log('  ✓ testHandleDeleteError')
}

async function testHandleSearchError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ProductController(service, view, createMockRepo())

  // Break the service to simulate error
  service.search = async () => { throw new Error('Error de búsqueda') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSearch('algo')

  assert(view.errorMessage === 'Error de búsqueda', 'handleSearch debería mostrar error del servicio')

  console.log('  ✓ testHandleSearchError')
}

export async function runProductControllerTests() {
  console.log('\n--- ProductController Tests ---\n')

  // Setup minimal DOM
  if (typeof document === 'undefined') {
    global.document = { createElement: (tag) => ({ tagName: tag, appendChild() {}, innerHTML: '' }) }
  }

  await testInitLoadsProducts()
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

  console.log('\n✓ Todos los tests de ProductController pasaron\n')
}
