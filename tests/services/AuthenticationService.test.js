import { AuthenticationService } from '../../src/services/AuthenticationService.js'
import { User } from '../../src/models/User.js'

function createMockUserRepo() {
  const users = []
  let nextId = 1

  function wrap(u) {
    return User.fromDB(u)
  }

  const repo = {
    async findByUsername(username) {
      const u = users.find(x => x.username === username)
      return u ? wrap(u) : null
    },

    async findById(id) {
      const u = users.find(x => x.id === id)
      return u ? wrap(u) : null
    },

    async update(id, data) {
      const idx = users.findIndex(x => x.id === id)
      if (idx === -1) throw new Error('Usuario no encontrado')
      users[idx] = { ...users[idx], ...data }
      return wrap(users[idx])
    },

    _addUser(user) {
      const u = { id: nextId++, ...user }
      users.push(u)
      return u
    }
  }

  return repo
}

function createMockSessionService() {
  return {
    _token: null,

    async create(userId) {
      this._token = 'session-token-' + userId
      return { userId, token: this._token, createdAt: new Date().toISOString() }
    },

    async destroy(token) {
      if (this._token === token) {
        this._token = null
        return true
      }
      return false
    },

    getStoredToken() {
      return this._token
    },

    async getByToken(token) {
      if (this._token === token) {
        return { userId: 1, token, expiresAt: new Date(Date.now() + 86400000).toISOString() }
      }
      return null
    }
  }
}

function createMockPasswordService() {
  return {
    _hashes: {},

    async hash(password) {
      const h = 'hashed:' + password
      this._hashes[password] = h
      return h
    },

    async verify(password, stored) {
      return stored === 'hashed:' + password
    },

    needsRehash(stored) {
      return false
    },

    _setHash(password, hash) {
      this._hashes[password] = hash
    }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testAuthenticateSuccess() {
  const userRepo = createMockUserRepo()
  const sessionService = createMockSessionService()
  const passwordService = createMockPasswordService()
  const service = new AuthenticationService(userRepo, sessionService, passwordService)

  const hash = await passwordService.hash('pass123')
  userRepo._addUser({ username: 'admin', passwordHash: hash, roleId: 1, active: true })

  const result = await service.authenticate('admin', 'pass123')
  assert(result !== null, 'authenticate debe retornar resultado')
  assert(result.user.username === 'admin', 'authenticate debe retornar usuario')
  assert(result.session !== undefined, 'authenticate debe crear sesión')

  console.log('  ✓ testAuthenticateSuccess')
}

async function testAuthenticateWrongPassword() {
  const userRepo = createMockUserRepo()
  const sessionService = createMockSessionService()
  const passwordService = createMockPasswordService()
  const service = new AuthenticationService(userRepo, sessionService, passwordService)

  const hash = await passwordService.hash('pass123')
  userRepo._addUser({ username: 'admin', passwordHash: hash, roleId: 1, active: true })

  try {
    await service.authenticate('admin', 'wrongpass')
    assert(false, 'authenticate debe lanzar error con contraseña incorrecta')
  } catch (error) {
    assert(error.message.includes('incorrectos'), 'Error debe mencionar credenciales incorrectas')
  }

  console.log('  ✓ testAuthenticateWrongPassword')
}

async function testAuthenticateNonExistentUser() {
  const userRepo = createMockUserRepo()
  const sessionService = createMockSessionService()
  const passwordService = createMockPasswordService()
  const service = new AuthenticationService(userRepo, sessionService, passwordService)

  try {
    await service.authenticate('noexiste', 'pass123')
    assert(false, 'authenticate debe lanzar error con usuario inexistente')
  } catch (error) {
    assert(error.message.includes('incorrectos'), 'Error debe ser genérico')
  }

  console.log('  ✓ testAuthenticateNonExistentUser')
}

async function testAuthenticateInactiveUser() {
  const userRepo = createMockUserRepo()
  const sessionService = createMockSessionService()
  const passwordService = createMockPasswordService()
  const service = new AuthenticationService(userRepo, sessionService, passwordService)

  const hash = await passwordService.hash('pass123')
  userRepo._addUser({ username: 'inactivo', passwordHash: hash, roleId: 1, active: false })

  try {
    await service.authenticate('inactivo', 'pass123')
    assert(false, 'authenticate debe lanzar error con usuario inactivo')
  } catch (error) {
    assert(error.message.includes('incorrectos'), 'Error debe ser genérico')
  }

  console.log('  ✓ testAuthenticateInactiveUser')
}

async function testAuthenticateEmptyCredentials() {
  const userRepo = createMockUserRepo()
  const sessionService = createMockSessionService()
  const passwordService = createMockPasswordService()
  const service = new AuthenticationService(userRepo, sessionService, passwordService)

  try {
    await service.authenticate('', 'pass')
    assert(false, 'authenticate debe lanzar error con usuario vacío')
  } catch (error) {
    assert(error.message.includes('requerido'), 'Error debe mencionar requerido')
  }

  try {
    await service.authenticate('admin', '')
    assert(false, 'authenticate debe lanzar error con contraseña vacía')
  } catch (error) {
    assert(error.message.includes('requerid'), 'Error debe mencionar requerido/requerida')
  }

  console.log('  ✓ testAuthenticateEmptyCredentials')
}

async function testGetCurrentUser() {
  const userRepo = createMockUserRepo()
  const sessionService = createMockSessionService()
  const passwordService = createMockPasswordService()
  const service = new AuthenticationService(userRepo, sessionService, passwordService)

  const hash = await passwordService.hash('pass123')
  userRepo._addUser({ id: 1, username: 'admin', passwordHash: hash, roleId: 1, active: true })

  // Authenticate first
  await service.authenticate('admin', 'pass123')

  const currentUser = await service.getCurrentUser()
  assert(currentUser !== null, 'getCurrentUser debe retornar usuario después de login')
  assert(currentUser.username === 'admin', 'getCurrentUser debe retornar username correcto')

  console.log('  ✓ testGetCurrentUser')
}

async function testLogout() {
  const userRepo = createMockUserRepo()
  const sessionService = createMockSessionService()
  const passwordService = createMockPasswordService()
  const service = new AuthenticationService(userRepo, sessionService, passwordService)

  const hash = await passwordService.hash('pass123')
  userRepo._addUser({ id: 1, username: 'admin', passwordHash: hash, roleId: 1, active: true })

  await service.authenticate('admin', 'pass123')
  assert(service.isAuthenticated() === true, 'isAuthenticated debe retornar true después de login')

  await service.logout()
  assert(service.isAuthenticated() === false, 'isAuthenticated debe retornar false después de logout')

  console.log('  ✓ testLogout')
}

export async function runAuthenticationServiceTests() {
  console.log('\n--- AuthenticationService Tests ---\n')

  await testAuthenticateSuccess()
  await testAuthenticateWrongPassword()
  await testAuthenticateNonExistentUser()
  await testAuthenticateInactiveUser()
  await testAuthenticateEmptyCredentials()
  await testGetCurrentUser()
  await testLogout()

  console.log('\n✓ Todos los tests de AuthenticationService pasaron\n')
}
