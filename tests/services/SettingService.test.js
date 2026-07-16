import { SettingService } from '../../src/services/SettingService.js'

function createMockRepository() {
  const settings = []

  return {
    settings,

    async findAll() {
      return settings.map(s => ({ ...s }))
    },

    async get(key) {
      const s = settings.find(x => x.key === key)
      return s ? s.value : null
    },

    async set(key, value) {
      const existing = settings.find(x => x.key === key)
      if (existing) {
        existing.value = value
        existing.updatedAt = new Date().toISOString()
      } else {
        settings.push({ id: settings.length + 1, key, value, updatedAt: new Date().toISOString() })
      }
    }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testGetAllReturnsAll() {
  const repo = createMockRepository()
  const service = new SettingService(repo)

  repo.settings.push({ id: 1, key: 'business_name', value: 'Mi Empresa' })
  repo.settings.push({ id: 2, key: 'tax_rate', value: '0.12' })

  const all = await service.getAll()
  assert(all.length === 2, 'getAll debería retornar 2 settings')

  console.log('  ✓ testGetAllReturnsAll')
}

async function testGetByKey() {
  const repo = createMockRepository()
  const service = new SettingService(repo)

  repo.settings.push({ id: 1, key: 'business_name', value: 'Mi Empresa' })

  const value = await service.get('business_name')
  assert(value === 'Mi Empresa', 'get debería retornar el valor correcto')

  const missing = await service.get('inexistente')
  assert(missing === null, 'get debería retornar null para clave inexistente')

  console.log('  ✓ testGetByKey')
}

async function testGetWithEmptyKey() {
  const repo = createMockRepository()
  const service = new SettingService(repo)

  try {
    await service.get('')
    assert(false, 'get con key vacía debería lanzar error')
  } catch (error) {
    assert(error.message.includes('clave'), 'get debería mencionar "clave" en el error')
  }

  try {
    await service.get(null)
    assert(false, 'get con key null debería lanzar error')
  } catch {
    // Expected
  }

  console.log('  ✓ testGetWithEmptyKey')
}

async function testUpdate() {
  const repo = createMockRepository()
  const service = new SettingService(repo)

  repo.settings.push({ id: 1, key: 'business_name', value: 'Antiguo' })

  await service.update('business_name', 'Nuevo Nombre')
  const value = await service.get('business_name')
  assert(value === 'Nuevo Nombre', 'update debería cambiar el valor')

  console.log('  ✓ testUpdate')
}

async function testUpdateWithInvalidArgs() {
  const repo = createMockRepository()
  const service = new SettingService(repo)

  try {
    await service.update('', 'valor')
    assert(false, 'update con key vacía debería lanzar error')
  } catch {
    // Expected
  }

  try {
    await service.update('key', null)
    assert(false, 'update con value null debería lanzar error')
  } catch {
    // Expected
  }

  console.log('  ✓ testUpdateWithInvalidArgs')
}

async function testUpdateMany() {
  const repo = createMockRepository()
  const service = new SettingService(repo)

  repo.settings.push({ id: 1, key: 'a', value: '1' })
  repo.settings.push({ id: 2, key: 'b', value: '2' })

  await service.updateMany([
    { key: 'a', value: 'uno' },
    { key: 'b', value: 'dos' }
  ])

  const va = await service.get('a')
  const vb = await service.get('b')
  assert(va === 'uno', 'updateMany debería actualizar "a"')
  assert(vb === 'dos', 'updateMany debería actualizar "b"')

  console.log('  ✓ testUpdateMany')
}

async function testGetAllEmpty() {
  const repo = createMockRepository()
  const service = new SettingService(repo)

  const all = await service.getAll()
  assert(Array.isArray(all), 'getAll debería retornar un array')
  assert(all.length === 0, 'getAll debería retornar array vacío sin settings')

  console.log('  ✓ testGetAllEmpty')
}

async function testUpdateCreatesNewKey() {
  const repo = createMockRepository()
  const service = new SettingService(repo)

  await service.update('new_key', 'new_value')
  const value = await service.get('new_key')
  assert(value === 'new_value', 'update debería crear clave inexistente')

  console.log('  ✓ testUpdateCreatesNewKey')
}

async function testUpdateStringifiesValue() {
  const repo = createMockRepository()
  const service = new SettingService(repo)

  await service.update('number_key', 42)
  const value = await service.get('number_key')
  assert(value === '42', 'update debería convertir número a string')

  await service.update('bool_key', true)
  const boolValue = await service.get('bool_key')
  assert(boolValue === 'true', 'update debería convertir boolean a string')

  console.log('  ✓ testUpdateStringifiesValue')
}

async function testUpdateManyEmpty() {
  const repo = createMockRepository()
  const service = new SettingService(repo)

  repo.settings.push({ id: 1, key: 'a', value: '1' })

  await service.updateMany([])
  const all = await service.getAll()
  assert(all.length === 1, 'updateMany vacío no debería modificar settings')

  console.log('  ✓ testUpdateManyEmpty')
}

async function testUpdateManyWithInvalidEntry() {
  const repo = createMockRepository()
  const service = new SettingService(repo)

  repo.settings.push({ id: 1, key: 'a', value: '1' })

  try {
    await service.updateMany([{ key: '', value: 'x' }])
    assert(false, 'updateMany con key vacía debería lanzar error')
  } catch {
    // Expected
  }

  console.log('  ✓ testUpdateManyWithInvalidEntry')
}

export async function runSettingServiceTests() {
  console.log('\n--- SettingService Tests ---\n')

  await testGetAllReturnsAll()
  await testGetAllEmpty()
  await testGetByKey()
  await testGetWithEmptyKey()
  await testUpdate()
  await testUpdateWithInvalidArgs()
  await testUpdateCreatesNewKey()
  await testUpdateStringifiesValue()
  await testUpdateMany()
  await testUpdateManyEmpty()
  await testUpdateManyWithInvalidEntry()

  console.log('\n✓ Todos los tests de SettingService pasaron\n')
}