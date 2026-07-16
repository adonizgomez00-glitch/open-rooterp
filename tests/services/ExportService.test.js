import { ExportService } from '../../src/services/ExportService.js'

function createMockRepo(data) {
  return {
    async findAll() { return data }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testGetEntityDataProducts() {
  const products = [
    { id: 1, code: 'P001', name: 'Producto 1', price: 100, stock: 10 },
    { id: 2, code: 'P002', name: 'Producto 2', price: 200, stock: 5 }
  ]
  const service = new ExportService(
    createMockRepo(products), createMockRepo([]), createMockRepo([]),
    createMockRepo([]), createMockRepo([]), createMockRepo([]), createMockRepo([])
  )

  const result = await service.getEntityData('products')
  assert(result.length === 2, 'Debería devolver 2 productos')
  assert(result[0].code === 'P001', 'Primer producto debería ser P001')

  console.log('  ✓ testGetEntityDataProducts')
}

async function testGetEntityDataCustomers() {
  const customers = [
    { id: 1, name: 'Cliente A', documentId: '12345678' }
  ]
  const service = new ExportService(
    createMockRepo([]), createMockRepo(customers), createMockRepo([]),
    createMockRepo([]), createMockRepo([]), createMockRepo([]), createMockRepo([])
  )

  const result = await service.getEntityData('customers')
  assert(result.length === 1, 'Debería devolver 1 cliente')
  assert(result[0].name === 'Cliente A', 'Nombre debería ser Cliente A')

  console.log('  ✓ testGetEntityDataCustomers')
}

async function testGetAllData() {
  const products = [{ id: 1, name: 'Prod' }]
  const customers = [{ id: 1, name: 'Cliente' }]
  const suppliers = [{ id: 1, name: 'Proveedor' }]
  const sales = [{ id: 1, total: 100 }]
  const purchases = [{ id: 1, total: 50 }]
  const movements = [{ id: 1, productId: 1, type: 'entry', quantity: 10 }]
  const settings = [{ key: 'tax', value: '18' }]

  const service = new ExportService(
    createMockRepo(products), createMockRepo(customers), createMockRepo(suppliers),
    createMockRepo(sales), createMockRepo(purchases), createMockRepo(movements),
    createMockRepo(settings)
  )

  const result = await service.getAllData()
  assert(result.products.length === 1, 'Debería tener products')
  assert(result.customers.length === 1, 'Debería tener customers')
  assert(result.suppliers.length === 1, 'Debería tener suppliers')
  assert(result.sales.length === 1, 'Debería tener sales')
  assert(result.purchases.length === 1, 'Debería tener purchases')
  assert(result.movements.length === 1, 'Debería tener movements')
  assert(result.settings.length === 1, 'Debería tener settings')

  console.log('  ✓ testGetAllData')
}

async function testToCSV() {
  const data = [
    { id: 1, name: 'Juan', email: 'juan@test.com' },
    { id: 2, name: 'María', email: 'maria@test.com' }
  ]

  const csv = ExportService.toCSV(data)
  const lines = csv.split('\n')

  assert(lines.length === 3, 'CSV debería tener 3 líneas (header + 2 datos)')
  assert(lines[0] === 'id,name,email', 'Header debería ser id,name,email')
  assert(lines[1] === '1,Juan,juan@test.com', 'Primera fila de datos incorrecta')

  console.log('  ✓ testToCSV')
}

async function testToCSVEscapesCommas() {
  const data = [
    { name: 'Smith, John', note: 'test' }
  ]

  const csv = ExportService.toCSV(data)
  const lines = csv.split('\n')

  assert(lines[1] === '"Smith, John",test', 'CSV debería escapar comas con quotes')

  console.log('  ✓ testToCSVEscapesCommas')
}

async function testToCSVEmptyData() {
  const csv = ExportService.toCSV([])
  assert(csv === '', 'CSV vacío debería retornar cadena vacía')

  console.log('  ✓ testToCSVEmptyData')
}

async function testToJSON() {
  const data = [
    { id: 1, name: 'Test' }
  ]

  const json = ExportService.toJSON(data)
  const parsed = JSON.parse(json)

  assert(parsed.length === 1, 'JSON debería tener 1 elemento')
  assert(parsed[0].name === 'Test', 'JSON debería tener name Test')

  console.log('  ✓ testToJSON')
}

export async function runExportServiceTests() {
  console.log('\n--- ExportService Tests ---\n')

  await testGetEntityDataProducts()
  await testGetEntityDataCustomers()
  await testGetAllData()
  await testToCSV()
  await testToCSVEscapesCommas()
  await testToCSVEmptyData()
  await testToJSON()

  console.log('\n✓ Todos los tests de ExportService pasaron\n')
}
