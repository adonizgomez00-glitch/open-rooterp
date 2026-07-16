import { SettingsController } from '../../src/controllers/SettingsController.js'

function createMockRepo() {
  return {
    async get(key) {
      return key === 'currency_symbol' ? 'Q/ ' : null
    }
  }
}

function createMockService() {
  let settings = []

  return {
    settings,

    async getAll() { return settings.map(s => ({ ...s })) },

    async updateMany(entries) {
      for (const { key, value } of entries) {
        const existing = settings.find(s => s.key === key)
        if (existing) {
          existing.value = value
        } else {
          settings.push({ id: settings.length + 1, key, value })
        }
      }
    }
  }
}

function createMockView() {
  return {
    rendered: false,
    settingsData: null,
    errorMessage: null,
    successMessage: null,
    savingState: false,
    loadingState: false,
    saveCb: null,
    formRendered: false,

    render(container) {
      this.rendered = true
      this._container = container
    },

    renderForm(settings) {
      this.settingsData = settings
      this.formRendered = true
    },

    onSave(cb) {
      this.saveCb = cb
    },

    showLoading() { this.loadingState = true },
    hideLoading() { this.loadingState = false },
    showSaving() { this.savingState = true },
    hideSaving() { this.savingState = false },

    showSuccess(msg) { this.successMessage = msg },
    showError(msg) { this.errorMessage = msg }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testInitCallsRenderAndLoadsSettings() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SettingsController(service, view, createMockRepo())

  service.settings.push({ id: 1, key: 'business_name', value: 'Mi Empresa' })
  service.settings.push({ id: 2, key: 'tax_rate', value: '0.12' })

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.rendered, 'init debería llamar a view.render')
  assert(view.settingsData !== null, 'init debería cargar settings')
  assert(view.settingsData.length === 2, 'init debería cargar 2 settings')

  console.log('  ✓ testInitCallsRenderAndLoadsSettings')
}

async function testHandleSaveUpdatesSettings() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SettingsController(service, view, createMockRepo())

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSave([
    { key: 'business_name', value: 'Nuevo Nombre' },
    { key: 'tax_rate', value: '0.15' }
  ])

  assert(view.successMessage !== null, 'handleSave debería mostrar éxito')
  const all = await service.getAll()
  assert(all.length === 2, 'handleSave debería crear las settings')
  assert(all.find(s => s.key === 'business_name').value === 'Nuevo Nombre', 'handleSave debería actualizar valor')

  console.log('  ✓ testHandleSaveUpdatesSettings')
}

async function testHandleSaveError() {
  const service = {
    async getAll() { return [] },
    async updateMany() { throw new Error('Error al guardar') }
  }

  const view = createMockView()
  const controller = new SettingsController(service, view, createMockRepo())

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSave([{ key: 'a', value: 'b' }])

  assert(view.errorMessage === 'Error al guardar', 'handleSave debería mostrar error')
  assert(view.successMessage === null, 'handleSave no debería mostrar éxito si falla')

  console.log('  ✓ testHandleSaveError')
}

async function testInitCallsOnSave() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SettingsController(service, view, createMockRepo())

  const container = document.createElement('div')
  await controller.init(container)

  assert(typeof view.saveCb === 'function', 'init debería registrar callback onSave')

  console.log('  ✓ testInitCallsOnSave')
}

async function testInitWithLoadError() {
  const service = {
    async getAll() { throw new Error('Error de carga') }
  }
  const view = createMockView()
  const controller = new SettingsController(service, view, createMockRepo())

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.errorMessage === 'Error de carga', 'init debería mostrar error si falla la carga')
  assert(view.loadingState === false, 'init debería ocultar loading tras error')

  console.log('  ✓ testInitWithLoadError')
}

async function testHandleSaveWithEmptyEntries() {
  const service = createMockService()
  const view = createMockView()
  const controller = new SettingsController(service, view, createMockRepo())

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSave([])
  assert(view.successMessage !== null, 'handleSave con array vacío debería mostrar éxito')

  console.log('  ✓ testHandleSaveWithEmptyEntries')
}

async function testHandleSaveAlwaysHidesSaving() {
  let callCount = 0
  const service = {
    async getAll() { return [] },
    async updateMany() {
      callCount++
      throw new Error('Error')
    }
  }
  const view = createMockView()
  const controller = new SettingsController(service, view, createMockRepo())

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.savingState === false, 'savingState debería iniciar en false')
  await controller.handleSave([{ key: 'a', value: 'b' }])
  assert(view.savingState === false, 'handleSave debería ocultar saving incluso tras error')

  console.log('  ✓ testHandleSaveAlwaysHidesSaving')
}

async function testHandleSaveShowsSaving() {
  let resolveUpdate = null
  const service = {
    async getAll() { return [] },
    async updateMany() {
      return new Promise((resolve) => {
        resolveUpdate = resolve
      })
    }
  }
  const view = createMockView()
  const controller = new SettingsController(service, view, createMockRepo())

  const container = document.createElement('div')
  await controller.init(container)

  const savePromise = controller.handleSave([{ key: 'a', value: 'b' }])
  assert(view.savingState === true, 'handleSave debería mostrar saving durante la operación')
  resolveUpdate()
  await savePromise
  assert(view.savingState === false, 'handleSave debería ocultar saving tras completar')

  console.log('  ✓ testHandleSaveShowsSaving')
}

async function testHandleSaveErrorShowsCorrectMessage() {
  const service = {
    async getAll() { return [] },
    async updateMany() { throw new Error('Error personalizado') }
  }
  const view = createMockView()
  const controller = new SettingsController(service, view, createMockRepo())

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSave([{ key: 'a', value: 'b' }])
  assert(view.errorMessage === 'Error personalizado', 'handleSave debería mostrar el mensaje de error exacto')
  assert(view.successMessage === null, 'handleSave no debería mostrar éxito si falla')

  console.log('  ✓ testHandleSaveErrorShowsCorrectMessage')
}

export async function runSettingsControllerTests() {
  console.log('\n--- SettingsController Tests ---\n')

  await testInitCallsRenderAndLoadsSettings()
  await testInitCallsOnSave()
  await testInitWithLoadError()
  await testHandleSaveUpdatesSettings()
  await testHandleSaveWithEmptyEntries()
  await testHandleSaveError()
  await testHandleSaveErrorShowsCorrectMessage()
  await testHandleSaveAlwaysHidesSaving()
  await testHandleSaveShowsSaving()

  console.log('\n✓ Todos los tests de SettingsController pasaron\n')
}