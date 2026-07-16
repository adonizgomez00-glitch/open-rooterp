import { LoginController } from '../../src/controllers/LoginController.js'

function createMockAuthService() {
  let authenticated = false

  return {
    _authenticated: false,

    async authenticate(username, password) {
      if (username === 'admin' && password === 'pass123') {
        this._authenticated = true
        return { user: { username: 'admin' }, session: { token: 'abc' } }
      }
      throw new Error('Usuario o contraseña incorrectos')
    },

    async logout() {
      this._authenticated = false
    },

    isAuthenticated() {
      return this._authenticated
    }
  }
}

function createMockView() {
  return {
    rendered: false,
    errorMessage: null,
    loadingState: false,
    loginCb: null,

    render(container) {
      this.rendered = true
      this._container = container
    },

    onLogin(cb) {
      this.loginCb = cb
    },

    showError(msg) {
      this.errorMessage = msg
    },

    showLoading() { this.loadingState = true },
    hideLoading() { this.loadingState = false }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testInit() {
  const authService = createMockAuthService()
  const view = createMockView()
  let authenticatedCalled = false

  const controller = new LoginController(authService, view, () => { authenticatedCalled = true })

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.rendered, 'init debe renderizar la vista')
  assert(typeof view.loginCb === 'function', 'init debe registrar callback de login')

  console.log('  ✓ testInit')
}

async function testHandleLoginSuccess() {
  const authService = createMockAuthService()
  const view = createMockView()
  let authenticatedCalled = false

  const controller = new LoginController(authService, view, () => { authenticatedCalled = true })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleLogin('admin', 'pass123')
  assert(authService.isAuthenticated(), 'handleLogin debe autenticar')
  assert(authenticatedCalled, 'handleLogin debe llamar callback onAuthenticated')

  console.log('  ✓ testHandleLoginSuccess')
}

async function testHandleLoginError() {
  const authService = createMockAuthService()
  const view = createMockView()
  let authenticatedCalled = false

  const controller = new LoginController(authService, view, () => { authenticatedCalled = true })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleLogin('admin', 'wrongpass')
  assert(view.errorMessage !== null, 'handleLogin debe mostrar error')
  assert(authenticatedCalled === false, 'handleLogin no debe llamar callback con error')

  console.log('  ✓ testHandleLoginError')
}

async function testHandleLogout() {
  const authService = createMockAuthService()
  const view = createMockView()

  const controller = new LoginController(authService, view, () => {})

  await controller.handleLogin('admin', 'pass123')
  assert(authService.isAuthenticated(), 'debe estar autenticado')

  await controller.handleLogout()
  assert(!authService._authenticated, 'handleLogout debe desautenticar')

  console.log('  ✓ testHandleLogout')
}

export async function runLoginControllerTests() {
  console.log('\n--- LoginController Tests ---\n')

  await testInit()
  await testHandleLoginSuccess()
  await testHandleLoginError()
  await testHandleLogout()

  console.log('\n✓ Todos los tests de LoginController pasaron\n')
}
