import { SessionService } from '../../src/services/SessionService.js'

function createMockSessionRepository() {
  const sessions = []
  let nextId = 1

  return {
    async findByToken(token) {
      const s = sessions.find(x => x.token === token)
      if (!s) return null
      return {
        ...s,
        isExpired() {
          return this.expiresAt ? new Date(this.expiresAt) < new Date() : false
        }
      }
    },

    async create(data) {
      const s = {
        id: nextId++, ...data,
        isExpired() {
          return this.expiresAt ? new Date(this.expiresAt) < new Date() : false
        }
      }
      sessions.push(s)
      return { ...s, isExpired: s.isExpired }
    },

    async update(id, data) {
      const idx = sessions.findIndex(x => x.id === id)
      if (idx === -1) throw new Error('Sesión no encontrada')
      sessions[idx] = { ...sessions[idx], ...data }
      return { ...sessions[idx], isExpired: sessions[idx].isExpired }
    },

    async delete(id) {
      const idx = sessions.findIndex(x => x.id === id)
      if (idx > -1) sessions.splice(idx, 1)
      return true
    },

    async deleteByToken(token) {
      const idx = sessions.findIndex(x => x.token === token)
      if (idx === -1) return false
      sessions.splice(idx, 1)
      return true
    },

    async deleteByUser(userId) {
      const toDelete = sessions.filter(x => x.userId === userId)
      for (const s of toDelete) {
        const idx = sessions.indexOf(s)
        sessions.splice(idx, 1)
      }
      return toDelete.length
    },

    async deleteExpired() {
      const now = new Date().toISOString()
      const expired = sessions.filter(s => s.expiresAt && s.expiresAt < now)
      for (const s of expired) {
        const idx = sessions.indexOf(s)
        sessions.splice(idx, 1)
      }
      return expired.length
    }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testCreateSession() {
  const repo = createMockSessionRepository()
  const service = new SessionService(repo)

  const session = await service.create(1)
  assert(session !== null, 'create debe retornar sesión')
  assert(session.userId === 1, 'create debe asignar userId')
  assert(session.token.length > 10, 'create debe generar token')

  console.log('  ✓ testCreateSession')
}

async function testGetByToken() {
  const repo = createMockSessionRepository()
  const service = new SessionService(repo)

  const session = await service.create(1)
  const found = await service.getByToken(session.token)
  assert(found !== null, 'getByToken debe encontrar sesión activa')
  assert(found.userId === 1, 'getByToken debe retornar userId correcto')

  const notFound = await service.getByToken('invalid-token')
  assert(notFound === null, 'getByToken debe retornar null para token inválido')

  console.log('  ✓ testGetByToken')
}

async function testDestroy() {
  const repo = createMockSessionRepository()
  const service = new SessionService(repo)

  const session = await service.create(1)
  const result = await service.destroy(session.token)
  assert(result === true, 'destroy debe retornar true')

  const found = await service.getByToken(session.token)
  assert(found === null, 'destroy debe eliminar la sesión')

  console.log('  ✓ testDestroy')
}

async function testDestroyByUser() {
  const repo = createMockSessionRepository()
  const service = new SessionService(repo)

  await service.create(1)
  await service.create(1)
  await service.create(1)

  await service.destroyByUser(1)

  const stored = service.getStoredToken()
  assert(stored === null, 'destroyByUser debe limpiar token persistido')

  console.log('  ✓ testDestroyByUser')
}

async function testCleanExpired() {
  const repo = createMockSessionRepository()
  const service = new SessionService(repo)

  const past = new Date(Date.now() - 100000).toISOString()
  await repo.create({ userId: 1, token: 'expired-1', expiresAt: past })
  await repo.create({ userId: 1, token: 'expired-2', expiresAt: past })

  const count = await service.cleanExpired()
  assert(count === 2, 'cleanExpired debe eliminar 2 sesiones expiradas')

  console.log('  ✓ testCleanExpired')
}

async function testGetStoredToken() {
  const service = new SessionService(createMockSessionRepository())

  const token = service.getStoredToken()
  assert(token === null, 'getStoredToken debe retornar null sin token persistido')

  console.log('  ✓ testGetStoredToken')
}

export async function runSessionServiceTests() {
  console.log('\n--- SessionService Tests ---\n')

  await testCreateSession()
  await testGetByToken()
  await testDestroy()
  await testDestroyByUser()
  await testCleanExpired()
  await testGetStoredToken()

  console.log('\n✓ Todos los tests de SessionService pasaron\n')
}
