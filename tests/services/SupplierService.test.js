import { SupplierService } from '../../src/services/SupplierService.js'

function createMockRepository() {
  const suppliers = []
  let nextId = 1

  const repo = {
    suppliers,

    async findAll() { return [...suppliers] },

    async findById(id) {
      const s = suppliers.find(x => x.id === id)
      return s ? { ...s } : null
    },

    async search(query) {
      const lower = query.toLowerCase()
      return suppliers.filter(s =>
        s.name.toLowerCase().includes(lower) ||
        s.documentId.toLowerCase().includes(lower) ||
        s.email.toLowerCase().includes(lower)
      )
    },

    async create(data) {
      const s = { id: nextId++, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      suppliers.push(s)
      return { ...s }
    },

    async update(id, data) {
      const idx = suppliers.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Proveedor con id ${id} no encontrado`)
      suppliers[idx] = { ...suppliers[idx], ...data, updatedAt: new Date().toISOString() }
      return { ...suppliers[idx] }
    },

    async delete(id) {
      const idx = suppliers.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Proveedor con id ${id} no encontrado`)
      suppliers.splice(idx, 1)
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
  const service = new SupplierService(repo)

  repo.suppliers.push({ id: 1, documentId: 'PROV-001', name: 'Proveedor 1' })
  repo.suppliers.push({ id: 2, documentId: 'PROV-002', name: 'Proveedor 2' })

  const result = await service.getAll()
  assert(result.length === 2, 'getAll debería retornar 2 proveedores')
  assert(result[0].name === 'Proveedor 1', 'getAll debería retornar el primer proveedor')
  console.log('  ✓ testGetAll')
}

async function testGetById() {
  const repo = createMockRepository()
  const service = new SupplierService(repo)

  repo.suppliers.push({ id: 1, documentId: 'PROV-001', name: 'Proveedor 1' })

  const supplier = await service.getById(1)
  assert(supplier !== null, 'getById debería retornar el proveedor')
  assert(supplier.documentId === 'PROV-001', 'getById debería retornar el documento correcto')

  try {
    await service.getById(999)
    assert(false, 'getById debería lanzar error para ID inexistente')
  } catch { }

  try {
    await service.getById(null)
    assert(false, 'getById debería lanzar error para ID nulo')
  } catch { }

  console.log('  ✓ testGetById')
}

async function testSearch() {
  const repo = createMockRepository()
  const service = new SupplierService(repo)

  repo.suppliers.push({ id: 1, documentId: 'PROV-001', name: 'Tech Solutions', email: 'tech@email.com' })
  repo.suppliers.push({ id: 2, documentId: 'PROV-002', name: 'Global Imports', email: 'global@email.com' })
  repo.suppliers.push({ id: 3, documentId: 'PROV-003', name: 'Office Supplies', email: 'office@email.com' })

  const result1 = await service.search('Tech')
  assert(result1.length === 1, 'search("Tech") debería retornar 1 resultado')
  assert(result1[0].name === 'Tech Solutions', 'search debería encontrar por nombre')

  const result2 = await service.search('PROV-002')
  assert(result2.length === 1, 'search por documento debería retornar 1 resultado')

  const result3 = await service.search('')
  assert(result3.length === 3, 'search("") debería retornar todos')

  const result4 = await service.search('XYZ')
  assert(result4.length === 0, 'search("XYZ") debería retornar vacío')

  console.log('  ✓ testSearch')
}

async function testCreate() {
  const repo = createMockRepository()
  const service = new SupplierService(repo)

  const supplier = await service.create({
    documentId: 'PROV-001',
    name: 'Nuevo Proveedor',
    email: 'proveedor@email.com',
    phone: '999888777'
  })

  assert(supplier.id !== undefined, 'create debería asignar un ID')
  assert(supplier.name === 'Nuevo Proveedor', 'create debería retornar el proveedor creado')
  assert(repo.suppliers.length === 1, 'create debería agregar al repositorio')

  console.log('  ✓ testCreate')
}

async function testUpdate() {
  const repo = createMockRepository()
  const service = new SupplierService(repo)

  repo.suppliers.push({ id: 1, documentId: 'PROV-001', name: 'Nombre Original', email: 'original@email.com' })

  const updated = await service.update(1, { name: 'Nombre Actualizado', phone: '111222333' })

  assert(updated.name === 'Nombre Actualizado', 'update debería cambiar el nombre')
  assert(updated.phone === '111222333', 'update debería cambiar el teléfono')
  assert(updated.documentId === 'PROV-001', 'update no debería cambiar campos no enviados')

  try {
    await service.update(999, { name: 'No existe' })
    assert(false, 'update debería lanzar error para ID inexistente')
  } catch { }

  console.log('  ✓ testUpdate')
}

async function testDelete() {
  const repo = createMockRepository()
  const service = new SupplierService(repo)

  repo.suppliers.push({ id: 1, documentId: 'PROV-001', name: 'Proveedor a eliminar' })

  assert(repo.suppliers.length === 1, 'debería haber 1 proveedor antes de eliminar')

  await service.delete(1)
  assert(repo.suppliers.length === 0, 'delete debería eliminar el proveedor')

  try {
    await service.delete(999)
    assert(false, 'delete debería lanzar error para ID inexistente')
  } catch { }

  console.log('  ✓ testDelete')
}

async function testGetByIdError() {
  const repo = createMockRepository()
  const service = new SupplierService(repo)

  try {
    await service.getById(undefined)
    assert(false, 'getById(undefined) debería lanzar error')
  } catch (error) {
    assert(error.message.includes('ID'), 'El mensaje de error debería mencionar ID')
  }

  console.log('  ✓ testGetByIdError')
}

export async function runSupplierServiceTests() {
  console.log('\n--- SupplierService Tests ---\n')

  await testGetAll()
  await testGetById()
  await testSearch()
  await testCreate()
  await testUpdate()
  await testDelete()
  await testGetByIdError()

  console.log('\n✓ Todos los tests de SupplierService pasaron\n')
}
