import { ProductService } from '../../src/services/ProductService.js'

function createMockRepository() {
  const products = []
  let nextId = 1

  return {
    products,

    async findAll() {
      return [...products]
    },

    async findById(id) {
      const p = products.find(x => x.id === id)
      return p ? { ...p } : null
    },

    async search(query) {
      const lower = query.toLowerCase()
      return products.filter(p =>
        p.name.toLowerCase().includes(lower) ||
        p.code.toLowerCase().includes(lower)
      )
    },

    async create(data) {
      const p = { id: nextId++, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      products.push(p)
      return { ...p }
    },

    async update(id, data) {
      const idx = products.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Producto con id ${id} no encontrado`)
      products[idx] = { ...products[idx], ...data, updatedAt: new Date().toISOString() }
      return { ...products[idx] }
    },

    async delete(id) {
      const idx = products.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Producto con id ${id} no encontrado`)
      products.splice(idx, 1)
      return true
    },

    async findLowStock(threshold) {
      return products.filter(p => p.stock <= threshold)
    },

    async findByCategory(category) {
      return products.filter(p => p.category === category)
    }
  }
}

function assert(condition, message = 'Assertion failed') {
  if (!condition) throw new Error(message)
}

async function testGetAll() {
  const repo = createMockRepository()
  const service = new ProductService(repo)

  repo.products.push({ id: 1, code: 'P001', name: 'Producto 1' })
  repo.products.push({ id: 2, code: 'P002', name: 'Producto 2' })

  const result = await service.getAll()
  assert(result.length === 2, 'getAll debería retornar 2 productos')
  assert(result[0].name === 'Producto 1', 'getAll debería retornar el primer producto')
  console.log('  ✓ testGetAll')
}

async function testGetById() {
  const repo = createMockRepository()
  const service = new ProductService(repo)

  repo.products.push({ id: 1, code: 'P001', name: 'Producto 1' })

  const product = await service.getById(1)
  assert(product !== null, 'getById debería retornar el producto')
  assert(product.code === 'P001', 'getById debería retornar el código correcto')

  try {
    await service.getById(999)
    assert(false, 'getById debería lanzar error para ID inexistente')
  } catch {
    // Expected
  }

  try {
    await service.getById(null)
    assert(false, 'getById debería lanzar error para ID nulo')
  } catch {
    // Expected
  }

  console.log('  ✓ testGetById')
}

async function testSearch() {
  const repo = createMockRepository()
  const service = new ProductService(repo)

  repo.products.push({ id: 1, code: 'P001', name: 'Laptop HP' })
  repo.products.push({ id: 2, code: 'P002', name: 'Monitor Samsung' })
  repo.products.push({ id: 3, code: 'P003', name: 'Teclado Mecánico' })

  const result1 = await service.search('laptop')
  assert(result1.length === 1, 'search("laptop") debería retornar 1 resultado')
  assert(result1[0].name === 'Laptop HP', 'search debería encontrar por nombre')

  const result2 = await service.search('P002')
  assert(result2.length === 1, 'search("P002") debería retornar 1 resultado')
  assert(result2[0].code === 'P002', 'search debería encontrar por código')

  const result3 = await service.search('')
  assert(result3.length === 3, 'search("") debería retornar todos')

  const result4 = await service.search('XYZ')
  assert(result4.length === 0, 'search("XYZ") debería retornar vacío')

  console.log('  ✓ testSearch')
}

async function testCreate() {
  const repo = createMockRepository()
  const service = new ProductService(repo)

  const product = await service.create({
    code: 'P001',
    name: 'Producto Nuevo',
    salePrice: 100,
    purchasePrice: 60,
    stock: 10
  })

  assert(product.id !== undefined, 'create debería asignar un ID')
  assert(product.name === 'Producto Nuevo', 'create debería retornar el producto creado')
  assert(repo.products.length === 1, 'create debería agregar al repositorio')

  console.log('  ✓ testCreate')
}

async function testUpdate() {
  const repo = createMockRepository()
  const service = new ProductService(repo)

  repo.products.push({ id: 1, code: 'P001', name: 'Nombre Original', salePrice: 100 })

  const updated = await service.update(1, { name: 'Nombre Actualizado', salePrice: 150 })

  assert(updated.name === 'Nombre Actualizado', 'update debería cambiar el nombre')
  assert(updated.salePrice === 150, 'update debería cambiar el precio')
  assert(updated.code === 'P001', 'update no debería cambiar campos no enviados')

  try {
    await service.update(999, { name: 'No existe' })
    assert(false, 'update debería lanzar error para ID inexistente')
  } catch {
    // Expected
  }

  console.log('  ✓ testUpdate')
}

async function testDelete() {
  const repo = createMockRepository()
  const service = new ProductService(repo)

  repo.products.push({ id: 1, code: 'P001', name: 'Producto a eliminar' })

  assert(repo.products.length === 1, 'debería haber 1 producto antes de eliminar')

  await service.delete(1)
  assert(repo.products.length === 0, 'delete debería eliminar el producto')

  try {
    await service.delete(999)
    assert(false, 'delete debería lanzar error para ID inexistente')
  } catch {
    // Expected
  }

  console.log('  ✓ testDelete')
}

async function testGetLowStock() {
  const repo = createMockRepository()
  const service = new ProductService(repo)

  repo.products.push({ id: 1, code: 'P001', name: 'Bajo stock', stock: 3 })
  repo.products.push({ id: 2, code: 'P002', name: 'Stock suficiente', stock: 20 })

  const low = await service.getLowStock(10)
  assert(low.length === 1, 'getLowStock(10) debería retornar 1 producto')
  assert(low[0].id === 1, 'getLowStock debería retornar el producto con stock bajo')

  console.log('  ✓ testGetLowStock')
}

async function testGetByCategory() {
  const repo = createMockRepository()
  const service = new ProductService(repo)

  repo.products.push({ id: 1, code: 'P001', name: 'Laptop', category: 'Electrónica' })
  repo.products.push({ id: 2, code: 'P002', name: 'Teclado', category: 'Periféricos' })

  const result = await service.getByCategory('Electrónica')
  assert(result.length === 1, 'getByCategory debería retornar 1 producto')
  assert(result[0].name === 'Laptop', 'getByCategory debería retornar el producto correcto')

  try {
    await service.getByCategory('')
    assert(false, 'getByCategory debería lanzar error para categoría vacía')
  } catch {
    // Expected
  }

  console.log('  ✓ testGetByCategory')
}

async function testGetByIdError() {
  const repo = createMockRepository()
  const service = new ProductService(repo)

  try {
    await service.getById(undefined)
    assert(false, 'getById(undefined) debería lanzar error')
  } catch (error) {
    assert(error.message.includes('ID'), 'El mensaje de error debería mencionar ID')
  }

  console.log('  ✓ testGetByIdError')
}

export async function runProductServiceTests() {
  console.log('\n--- ProductService Tests ---\n')

  await testGetAll()
  await testGetById()
  await testSearch()
  await testCreate()
  await testUpdate()
  await testDelete()
  await testGetLowStock()
  await testGetByCategory()
  await testGetByIdError()

  console.log('\n✓ Todos los tests de ProductService pasaron\n')
}
