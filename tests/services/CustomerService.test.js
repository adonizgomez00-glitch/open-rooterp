import { CustomerService } from '../../src/services/CustomerService.js'

function createMockRepository() {
  const customers = []
  let nextId = 1

  const repo = {
    customers: customers,

    async findAll() { return [...customers] },

    async findByDocumentId(documentId) {
      const c = customers.find(x => x.documentId === documentId)
      return c ? { ...c } : null
    },

    async findById(id) {
      const c = customers.find(x => x.id === id)
      return c ? { ...c } : null
    },

    async search(query) {
      const lower = query.toLowerCase()
      return customers.filter(c =>
        c.name.toLowerCase().includes(lower) ||
        c.documentId.toLowerCase().includes(lower) ||
        c.email.toLowerCase().includes(lower)
      )
    },

    async create(data) {
      const c = { id: nextId++, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      customers.push(c)
      return { ...c }
    },

    async update(id, data) {
      const idx = customers.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Cliente con id ${id} no encontrado`)
      customers[idx] = { ...customers[idx], ...data, updatedAt: new Date().toISOString() }
      return { ...customers[idx] }
    },

    async delete(id) {
      const idx = customers.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Cliente con id ${id} no encontrado`)
      customers.splice(idx, 1)
      return true
    }
  }

  return repo
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testGetAll() {
  const repo = createMockRepository()
  const service = new CustomerService(repo)

  repo.customers.push({ id: 1, documentId: 'C001', name: 'Cliente 1' })
  repo.customers.push({ id: 2, documentId: 'C002', name: 'Cliente 2' })

  const result = await service.getAll()
  assert(result.length === 2, 'getAll debería retornar 2 clientes')
  assert(result[0].name === 'Cliente 1', 'getAll debería retornar el primer cliente')
  console.log('  ✓ testGetAll')
}

async function testGetById() {
  const repo = createMockRepository()
  const service = new CustomerService(repo)

  repo.customers.push({ id: 1, documentId: 'C001', name: 'Cliente 1' })

  const customer = await service.getById(1)
  assert(customer !== null, 'getById debería retornar el cliente')
  assert(customer.documentId === 'C001', 'getById debería retornar el documento correcto')

  try {
    await service.getById(999)
    assert(false, 'getById debería lanzar error para ID inexistente')
  } catch { /* Expected */ }

  try {
    await service.getById(null)
    assert(false, 'getById debería lanzar error para ID nulo')
  } catch { /* Expected */ }

  console.log('  ✓ testGetById')
}

async function testSearch() {
  const repo = createMockRepository()
  const service = new CustomerService(repo)

  repo.customers.push({ id: 1, documentId: 'C001', name: 'Juan Pérez', email: 'juan@email.com' })
  repo.customers.push({ id: 2, documentId: 'C002', name: 'María García', email: 'maria@email.com' })
  repo.customers.push({ id: 3, documentId: 'C003', name: 'Carlos López', email: 'carlos@email.com' })

  const result1 = await service.search('Juan')
  assert(result1.length === 1, 'search("Juan") debería retornar 1 resultado')
  assert(result1[0].name === 'Juan Pérez', 'search debería encontrar por nombre')

  const result2 = await service.search('C002')
  assert(result2.length === 1, 'search("C002") debería retornar 1 resultado')

  const result3 = await service.search('')
  assert(result3.length === 3, 'search("") debería retornar todos')

  const result4 = await service.search('XYZ')
  assert(result4.length === 0, 'search("XYZ") debería retornar vacío')

  console.log('  ✓ testSearch')
}

async function testCreate() {
  const repo = createMockRepository()
  const service = new CustomerService(repo)

  const customer = await service.create({
    documentId: 'C001',
    name: 'Nuevo Cliente',
    email: 'cliente@email.com',
    phone: '999888777'
  })

  assert(customer.id !== undefined, 'create debería asignar un ID')
  assert(customer.name === 'Nuevo Cliente', 'create debería retornar el cliente creado')
  assert(repo.customers.length === 1, 'create debería agregar al repositorio')

  console.log('  ✓ testCreate')
}

async function testUpdate() {
  const repo = createMockRepository()
  const service = new CustomerService(repo)

  repo.customers.push({ id: 1, documentId: 'C001', name: 'Nombre Original', email: 'original@email.com' })

  const updated = await service.update(1, { name: 'Nombre Actualizado', phone: '111222333' })

  assert(updated.name === 'Nombre Actualizado', 'update debería cambiar el nombre')
  assert(updated.phone === '111222333', 'update debería cambiar el teléfono')
  assert(updated.documentId === 'C001', 'update no debería cambiar campos no enviados')

  try {
    await service.update(999, { name: 'No existe' })
    assert(false, 'update debería lanzar error para ID inexistente')
  } catch { /* Expected */ }

  console.log('  ✓ testUpdate')
}

async function testDelete() {
  const repo = createMockRepository()
  const service = new CustomerService(repo)

  repo.customers.push({ id: 1, documentId: 'C001', name: 'Cliente a eliminar' })

  assert(repo.customers.length === 1, 'debería haber 1 cliente antes de eliminar')

  await service.delete(1)
  assert(repo.customers.length === 0, 'delete debería eliminar el cliente')

  try {
    await service.delete(999)
    assert(false, 'delete debería lanzar error para ID inexistente')
  } catch { /* Expected */ }

  console.log('  ✓ testDelete')
}

async function testGetByIdError() {
  const repo = createMockRepository()
  const service = new CustomerService(repo)

  try {
    await service.getById(undefined)
    assert(false, 'getById(undefined) debería lanzar error')
  } catch (error) {
    assert(error.message.includes('ID'), 'El mensaje de error debería mencionar ID')
  }

  console.log('  ✓ testGetByIdError')
}

export async function runCustomerServiceTests() {
  console.log('\n--- CustomerService Tests ---\n')

  await testGetAll()
  await testGetById()
  await testSearch()
  await testCreate()
  await testUpdate()
  await testDelete()
  await testGetByIdError()

  console.log('\n✓ Todos los tests de CustomerService pasaron\n')
}
