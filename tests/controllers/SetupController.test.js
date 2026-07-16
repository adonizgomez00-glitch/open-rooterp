import { SetupController } from '../../src/controllers/SetupController.js'

function createMockSystemService() {
  let configured = false

  return {
    async isFirstRun() { return !configured },

    async setupInitial(data) {
      if (configured) throw new Error('El sistema ya ha sido configurado')
      configured = true
      return { role: { id: 1, name: 'Administrador' }, username: data.username }
    },

    async ensureDefaultPermissions() { return true }
  }
}

function createMockPasswordService() {
  return {
    async hash(password) { return 'hashed:' + password },

    async verify(password, stored) {
      return stored === 'hashed:' + password
    },

    needsRehash(stored) { return false }
  }
}

function createMockAuthService() {
  return {
    _authenticated: false,

    async authenticate(username, password) {
      this._authenticated = true
      return { user: { username }, session: { token: 'abc' } }
    }
  }
}

function createMockView() {
  return {
    rendered: false,
    errorMessage: null,
    successMessage: null,
    loadingState: false,
    setupCb: null,

    render(container) {
      this.rendered = true
      this._container = container
    },

    onSetup(cb) {
      this.setupCb = cb
    },

    showError(msg) { this.errorMessage = msg },
    showSuccess(msg) { this.successMessage = msg },
    showLoading() { this.loadingState = true },
    hideLoading() { this.loadingState = false }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testInit() {
  const systemService = createMockSystemService()
  const passwordService = createMockPasswordService()
  const authService = createMockAuthService()
  const view = createMockView()
  let completed = false

  const controller = new SetupController(systemService, passwordService, authService, view, () => { completed = true })

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.rendered, 'init debe renderizar la vista')
  assert(typeof view.setupCb === 'function', 'init debe registrar callback')

  console.log('  ✓ testInit')
}

async function testHandleSetupSuccess() {
  const systemService = createMockSystemService()
  const passwordService = createMockPasswordService()
  const authService = createMockAuthService()
  const view = createMockView()
  let completed = false

  const controller = new SetupController(systemService, passwordService, authService, view, () => { completed = true })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSetup({
    businessName: 'Mi Empresa',
    username: 'admin',
    password: 'secure123'
  })

  assert(view.successMessage !== null, 'handleSetup debe mostrar éxito')
  assert(completed === true, 'handleSetup debe llamar callback onComplete')
  assert(authService._authenticated, 'handleSetup debe autenticar')

  console.log('  ✓ testHandleSetupSuccess')
}

async function testHandleSetupError() {
  const systemService = createMockSystemService()
  const passwordService = createMockPasswordService()
  const authService = createMockAuthService()
  const view = createMockView()

  // Simulate error by making hash throw
  passwordService.hash = async () => { throw new Error('Error al generar hash') }

  let completed = false
  const controller = new SetupController(systemService, passwordService, authService, view, () => { completed = true })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleSetup({
    businessName: 'Mi Empresa',
    username: 'admin',
    password: 'secure123'
  })

  assert(view.errorMessage !== null, 'handleSetup debe mostrar error si falla')
  assert(completed === false, 'handleSetup no debe llamar callback con error')

  console.log('  ✓ testHandleSetupError')
}

export async function runSetupControllerTests() {
  console.log('\n--- SetupController Tests ---\n')

  await testInit()
  await testHandleSetupSuccess()
  await testHandleSetupError()

  console.log('\n✓ Todos los tests de SetupController pasaron\n')
}
