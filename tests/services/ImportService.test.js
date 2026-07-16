import { ImportService } from '../../src/services/ImportService.js'

function createMockRepo() {
  const data = []
  return {
    _data: data,
    async findAll() { return data },
    async findById(id) { return data.find(d => d.id === id) || null },
    async findByCode(code) { return data.find(d => d.code === code) || null },
    async findByDocumentId(documentId) { return data.find(d => d.documentId === documentId) || null },
    async findByCustomerAndDate(customerId, date) { return null },
    async findBySupplierAndDate(supplierId, date) { return null },
    async create(item) { const newItem = { id: data.length + 1, ...item }; data.push(newItem); return newItem },
    async update(id, itemData) { const idx = data.findIndex(d => d.id === id); if (idx >= 0) { data[idx] = { ...data[idx], ...itemData, id }; return data[idx] } return null },
    async delete(id) { const idx = data.findIndex(d => d.id === id); if (idx >= 0) { data.splice(idx, 1); return true } return false },
    async count() { return data.length },
    async generateNextCode() { return 'PROD-001' },
    async generateNextDocumentId() { return 'C001' },
    async updateStock(productId, quantity) { const item = data.find(d => d.id === productId); if (item) { item.stock = Math.max(0, (item.stock || 0) + quantity) } return item },
    async createWithItems(saleData, items) { const sale = { id: data.length + 1, ...saleData }; data.push(sale); return sale },
    async set(key, value) {
      const existing = data.find(d => d.key === key)
      const setting = { id: existing?.id, key, value, updatedAt: new Date().toISOString() }
      if (existing) {
        Object.assign(existing, setting)
      } else {
        const { id, ...data } = setting
        delete data.id
        this._data.push({ ...data, id: this._data.length + 1 })
      }
      return setting
    }
  }
}

function createMockReportRepo() {
  return {
    async generate(filter) {
      return { items: [], summary: {} }
    }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testParseCSVBasic() {
  const csv = 'name,code,price\nProducto A,PROD-001,100\nProducto B,PROD-002,200'
  const records = ImportService.parseCSV(csv)
  assert(records.length === 2, 'Debería parsear 2 registros')
  assert(records[0].name === 'Producto A', 'Primer nombre debería ser Producto A')
  assert(records[0].code === 'PROD-001', 'Primer código debería ser PROD-001')
  assert(records[1].price === '200', 'Segundo precio debería ser 200')
  console.log('  ✓ testParseCSVBasic')
}

async function testParseCSVWithQuotes() {
  const csv = 'name,description\n"Producto, con coma","Descripción normal"'
  const records = ImportService.parseCSV(csv)
  assert(records.length === 1, 'Debería parsear 1 registro con comillas')
  assert(records[0].name === 'Producto, con coma', 'Debería manejar comas dentro de comillas')
  assert(records[0].description === 'Descripción normal', 'Descripción normal debería funcionar')
  console.log('  ✓ testParseCSVWithQuotes')
}

async function testParseCSVEmpty() {
  const records = ImportService.parseCSV('')
  assert(records.length === 0, 'CSV vacío debería retornar array vacío')
  console.log('  ✓ testParseCSVEmpty')
}

async function testParseCSVOnlyHeaders() {
  const csv = 'name,code\n'
  const records = ImportService.parseCSV(csv)
  assert(records.length === 0, 'Solo headers debería retornar array vacío')
  console.log('  ✓ testParseCSVOnlyHeaders')
}

async function testParseJSONArray() {
  const json = '[{"name": "Producto A", "code": "P001"}, {"name": "Producto B", "code": "P002"}]'
  const records = ImportService.parseJSON(json)
  assert(records.length === 2, 'Debería parsear array JSON')
  assert(records[0].name === 'Producto A', 'Primer nombre correcto')
  console.log('  ✓ testParseJSONArray')
}

async function testParseJSONObjectWithArray() {
  const json = '{"products": [{"name": "Producto A"}, {"name": "Producto B"}]}'
  const records = ImportService.parseJSON(json)
  assert(records.length === 2, 'Debería extraer array del objeto')
  console.log('  ✓ testParseJSONObjectWithArray')
}

async function testParseJSONEmpty() {
  const records = ImportService.parseJSON('')
  assert(records.length === 0, 'JSON vacío debería retornar array vacío')
  console.log('  ✓ testParseJSONEmpty')
}

async function testImportProducts() {
  const productRepo = createMockRepo()
  const service = new ImportService(productRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { name: 'Producto 1', code: 'P001', purchasePrice: '50', salePrice: '100', stock: '10', stockMin: '5' },
    { name: 'Producto 2', code: 'P002', purchasePrice: '30', salePrice: '60', stock: '5', stockMin: '2' }
  ]

  const result = await service.importProducts(records)
  assert(result.imported === 2, 'Debería importar 2 productos')
  assert(result.skipped === 0, 'No debería omitir ninguno')
  assert(result.errors.length === 0, 'No debería haber errores')
  console.log('  ✓ testImportProducts')
}

async function testImportProductsWithAutoCode() {
  const productRepo = createMockRepo()
  const service = new ImportService(productRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { name: 'Producto sin código' }
  ]

  const result = await service.importProducts(records)
  assert(result.imported === 1, 'Debería importar 1 producto con código autogenerado')
  assert(result.errors.length === 0, 'No debería haber errores')
  console.log('  ✓ testImportProductsWithAutoCode')
}

async function testImportProductsSkipsInvalid() {
  const productRepo = createMockRepo()
  const service = new ImportService(productRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { name: '   ', code: 'P001' },
    { name: 'Válido', code: 'P002' }
  ]

  const result = await service.importProducts(records)
  assert(result.imported === 2, 'Debería importar 2 (genera nombre por defecto para el primero)')
  assert(result.skipped === 0, 'No debería omitir ninguno')
  assert(result.errors.length === 0, 'No debería haber errores')
  console.log('  ✓ testImportProductsSkipsInvalid')
}

async function testImportCustomers() {
  const customerRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), customerRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { documentId: '12345678', name: 'Cliente A', email: 'a@test.com', phone: '123456789', address: 'Calle 1' },
    { name: 'Cliente B', email: 'b@test.com' }
  ]

  const result = await service.importCustomers(records)
  assert(result.imported === 2, 'Debería importar 2 clientes')
  assert(result.skipped === 0, 'No debería omitir ninguno')
  console.log('  ✓ testImportCustomers')
}

async function testImportCustomersSkipsInvalid() {
  const customerRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), customerRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { name: '' },
    { name: 'Cliente Válido' }
  ]

  const result = await service.importCustomers(records)
  assert(result.imported === 1, 'Debería importar solo 1')
  assert(result.skipped === 1, 'Debería omitir 1')
  console.log('  ✓ testImportCustomersSkipsInvalid')
}

async function testImportSuppliers() {
  const supplierRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), createMockRepo(), supplierRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { documentId: '87654321', name: 'Proveedor A', email: 'a@test.com', phone: '987654321', address: 'Av. Principal' }
  ]

  const result = await service.importSuppliers(records)
  assert(result.imported === 1, 'Debería importar 1 proveedor')
  console.log('  ✓ testImportSuppliers')
}

async function testImportSales() {
  const customerRepo = createMockRepo()
  customerRepo._data.push({ id: 1, documentId: '12345678', name: 'Cliente A' })
  const saleRepo = createMockRepo()
  saleRepo.createWithItems = async (saleData, items) => {
    const sale = { id: saleRepo._data.length + 1, ...saleData, items }
    saleRepo._data.push(sale)
    return sale
  }
  const service = new ImportService(createMockRepo(), customerRepo, createMockRepo(), createMockRepo(), saleRepo, createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { customerId: '12345678', date: '2026-01-15T10:00:00.000Z', total: '150', tax: '27', items: [{ productId: 1, quantity: 2, price: 75 }] }
  ]

  const result = await service.importSales(records)
  assert(result.imported === 1, 'Debería importar 1 venta')
  console.log('  ✓ testImportSales')
}

async function testImportSalesSkipsMissingCustomer() {
  const customerRepo = createMockRepo()
  const saleRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), customerRepo, createMockRepo(), createMockRepo(), saleRepo, createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { customerId: '99999999', date: '2026-01-15T10:00:00.000Z', total: '100', items: [] }
  ]

  const result = await service.importSales(records)
  assert(result.imported === 0, 'No debería importar ninguna venta')
  assert(result.skipped === 1, 'Debería omitir 1')
  assert(result.errors[0].message.includes('no encontrado'), 'Error debería mencionar cliente no encontrado')
  console.log('  ✓ testImportSalesSkipsMissingCustomer')
}

async function testImportPurchases() {
  const supplierRepo = createMockRepo()
  supplierRepo._data.push({ id: 1, documentId: '87654321', name: 'Proveedor A' })
  const purchaseRepo = createMockRepo()
  purchaseRepo.createWithItems = async (purchaseData, items) => {
    const purchase = { id: purchaseRepo._data.length + 1, ...purchaseData, items }
    purchaseRepo._data.push(purchase)
    return purchase
  }
  const service = new ImportService(createMockRepo(), createMockRepo(), supplierRepo, createMockRepo(), createMockRepo(), purchaseRepo, createMockRepo(), createMockReportRepo())

  const records = [
    { supplierId: '87654321', date: '2026-01-15T10:00:00.000Z', total: '200', items: [{ productId: 1, quantity: 5, price: 40 }] }
  ]

  const result = await service.importPurchases(records)
  assert(result.imported === 1, 'Debería importar 1 compra')
  console.log('  ✓ testImportPurchases')
}

async function testImportInventory() {
  const productRepo = createMockRepo()
  productRepo._data.push({ id: 1, code: 'P001', name: 'Producto 1', stock: 0 })
  const inventoryRepo = createMockRepo()
  const service = new ImportService(productRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), inventoryRepo, createMockReportRepo())

  const records = [
    { product: 'P001', type: 'entry', quantity: '10', date: '2026-01-15T10:00:00.000Z', reference: 'Compra inicial' }
  ]

  const result = await service.importInventory(records)
  assert(result.imported === 1, 'Debería importar 1 movimiento')
  assert(productRepo._data[0].stock === 10, 'Stock debería actualizarse a 10')
  console.log('  ✓ testImportInventory')
}

async function testImportInventoryExit() {
  const productRepo = createMockRepo()
  productRepo._data.push({ id: 1, code: 'P001', name: 'Producto 1', stock: 20 })
  const inventoryRepo = createMockRepo()
  const service = new ImportService(productRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), inventoryRepo, createMockReportRepo())

  const records = [
    { product: 'P001', type: 'exit', quantity: '5', date: '2026-01-15T10:00:00.000Z' }
  ]

  const result = await service.importInventory(records)
  assert(result.imported === 1, 'Debería importar 1 movimiento de salida')
  assert(productRepo._data[0].stock === 15, 'Stock debería reducirse a 15')
  console.log('  ✓ testImportInventoryExit')
}

async function testImportSettings() {
  const settingRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), createMockRepo(), createMockRepo(), settingRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { key: 'tax_rate', value: '18' },
    { key: 'currency_symbol', value: 'S/' }
  ]

  const result = await service.importSettings(records)
  assert(result.imported === 2, 'Debería importar 2 configuraciones')
  assert(settingRepo._data.length === 2, 'Repositorio debería tener 2 settings')
  console.log('  ✓ testImportSettings')
}

async function testImportDataAutoDetectProducts() {
  const productRepo = createMockRepo()
  const service = new ImportService(productRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { name: 'Producto 1', code: 'P001', price: 100 },
    { name: 'Producto 2', code: 'P002', price: 200 }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 2, 'Debería auto-detectar productos e importar 2')
  console.log('  ✓ testImportDataAutoDetectProducts')
}

async function testImportDataAutoDetectCustomers() {
  const customerRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), customerRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { documento: '12345678', cliente: 'Cliente A', email: 'a@test.com' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Debería auto-detectar clientes e importar 1')
  console.log('  ✓ testImportDataAutoDetectCustomers')
}

async function testImportDataManualEntity() {
  const productRepo = createMockRepo()
  const service = new ImportService(productRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { name: 'Producto 1', code: 'P001' }
  ]

  const result = await service.importData('products', records)
  assert(result.imported === 1, 'Debería importar 1 producto con entidad manual')
  console.log('  ✓ testImportDataManualEntity')
}

async function testImportDataUnknownEntity() {
  const service = new ImportService(createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  try {
    await service.importData('unknown', [{ name: 'Test' }])
    assert(false, 'Debería lanzar error para entidad desconocida')
  } catch (error) {
    assert(error.message.includes('Entidad desconocida'), 'Error debería mencionar entidad desconocida')
  }
  console.log('  ✓ testImportDataUnknownEntity')
}

async function testSanitizeRecord() {
  const service = new ImportService(createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const record = { name: '  Producto  ', code: ' P001 ', price: 100 }
  const sanitized = service._sanitizeRecord(record)
  assert(sanitized.name === 'Producto', 'Debería trim string')
  assert(sanitized.code === 'P001', 'Debería trim string')
  assert(sanitized.price === 100, 'Debería mantener números')
  console.log('  ✓ testSanitizeRecord')
}

async function testSanitizeRecordNull() {
  const service = new ImportService(createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const sanitized = service._sanitizeRecord(null)
  assert(typeof sanitized === 'object', 'Debería retornar objeto vacío para null')
  assert(Object.keys(sanitized).length === 0, 'Debería ser objeto vacío')
  console.log('  ✓ testSanitizeRecordNull')
}

async function testImportDataAutoDetectCustomersEnglishHeaders() {
  const customerRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), customerRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { customer: 'John Doe', email: 'john@test.com', phone: '123456789', address: '123 Main St' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Debería auto-detectar clientes con headers en inglés (customer, email, phone, address)')
  assert(customerRepo._data.length === 1, 'Cliente debería guardarse en customerRepo')
  assert(customerRepo._data[0].name === 'John Doe', 'Nombre debería ser John Doe')
  assert(customerRepo._data[0].email === 'john@test.com', 'Email debería coincidir')
  console.log('  ✓ testImportDataAutoDetectCustomersEnglishHeaders')
}

async function testImportDataAutoDetectSuppliersEnglishHeaders() {
  const supplierRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), createMockRepo(), supplierRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { supplier: 'Supplier Co', email: 'supplier@test.com', phone: '987654321', address: '456 Oak Ave' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Debería auto-detectar proveedores con headers en inglés (supplier, email, phone, address)')
  assert(supplierRepo._data.length === 1, 'Proveedor debería guardarse en supplierRepo')
  assert(supplierRepo._data[0].name === 'Supplier Co', 'Nombre debería ser Supplier Co')
  console.log('  ✓ testImportDataAutoDetectSuppliersEnglishHeaders')
}

async function testImportDataAutoDetectInventoryEnglishHeaders() {
  const productRepo = createMockRepo()
  productRepo._data.push({ id: 1, code: 'P001', name: 'Producto Test', stock: 10 })
  const inventoryRepo = createMockRepo()
  const service = new ImportService(productRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), inventoryRepo, createMockReportRepo())

  const records = [
    { product: 'P001', type: 'entry', quantity: '5', date: '2026-06-01T10:00:00.000Z' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Debería auto-detectar inventario con headers en inglés')
  console.log('  ✓ testImportDataAutoDetectInventoryEnglishHeaders')
}

async function testImportDataMovementsAlias() {
  const productRepo = createMockRepo()
  productRepo._data.push({ id: 1, code: 'P001', name: 'Producto Test', stock: 10 })
  const inventoryRepo = createMockRepo()
  const service = new ImportService(productRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), inventoryRepo, createMockReportRepo())

  const records = [
    { product: 'P001', type: 'entry', quantity: '5' }
  ]

  const result = await service.importData('movements', records)
  assert(result.imported === 1, 'Alias "movements" debería importar inventario')
  console.log('  ✓ testImportDataMovementsAlias')
}

async function testImportDataConfigAlias() {
  const settingRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), createMockRepo(), createMockRepo(), settingRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { key: 'tax_rate', value: '18' }
  ]

  const result = await service.importData('config', records)
  assert(result.imported === 1, 'Alias "config" debería importar configuraciones')
  assert(settingRepo._data.length === 1, 'Setting debería guardarse')
  console.log('  ✓ testImportDataConfigAlias')
}

async function testImportSuppliersNotSavedAsCustomers() {
  const customerRepo = createMockRepo()
  const supplierRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), customerRepo, supplierRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { name: 'Proveedor ABC', email: 'abc@proveedor.com', phone: '111222333', address: 'Av. Principal 456' }
  ]

  try {
    await service.importData('auto', records)
    assert(false, 'Debería lanzar error por ambigüedad cliente/proveedor')
  } catch (error) {
    assert(error.message.includes('distinguir entre Clientes y Proveedores'), 'Error debe mencionar ambigüedad')
  }
  assert(customerRepo._data.length === 0, 'No debería haber clientes guardados')
  assert(supplierRepo._data.length === 0, 'No debería haber proveedores guardados')
  console.log('  ✓ testImportSuppliersNotSavedAsCustomers')
}

async function testImportCustomersNotSavedAsSuppliers() {
  const customerRepo = createMockRepo()
  const supplierRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), customerRepo, supplierRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { name: 'Cliente XYZ', email: 'xyz@cliente.com', phone: '999888777', address: 'Jr. Las Flores 123' }
  ]

  try {
    await service.importData('auto', records)
    assert(false, 'Debería lanzar error por ambigüedad cliente/proveedor')
  } catch (error) {
    assert(error.message.includes('distinguir entre Clientes y Proveedores'), 'Error debe mencionar ambigüedad')
  }
  assert(customerRepo._data.length === 0, 'No debería haber clientes guardados')
  assert(supplierRepo._data.length === 0, 'No debería haber proveedores guardados')
  console.log('  ✓ testImportCustomersNotSavedAsSuppliers')
}

async function testImportProductsNotSavedAsCustomers() {
  const productRepo = createMockRepo()
  const customerRepo = createMockRepo()
  const service = new ImportService(productRepo, customerRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { name: 'Laptop Gamer', code: 'LAP-001', purchasePrice: '800', salePrice: '1200', stock: '10', category: 'Electrónica' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Debería importar 1 producto')
  assert(productRepo._data.length === 1, 'Producto debería guardarse en productRepo')
  assert(customerRepo._data.length === 0, 'No debería haber clientes guardados')
  console.log('  ✓ testImportProductsNotSavedAsCustomers')
}

async function testImportSalesAmbiguousWithPurchases() {
  const saleRepo = createMockRepo()
  saleRepo.createWithItems = async (saleData, items) => {
    const sale = { id: saleRepo._data.length + 1, ...saleData, items }
    saleRepo._data.push(sale)
    return sale
  }
  const purchaseRepo = createMockRepo()
  purchaseRepo.createWithItems = async (purchaseData, items) => {
    const purchase = { id: purchaseRepo._data.length + 1, ...purchaseData, items }
    purchaseRepo._data.push(purchase)
    return purchase
  }
  const customerRepo = createMockRepo()
  customerRepo._data.push({ id: 1, documentId: '12345678', name: 'Cliente A' })
  const supplierRepo = createMockRepo()
  supplierRepo._data.push({ id: 1, documentId: '87654321', name: 'Proveedor A' })
  const service = new ImportService(createMockRepo(), customerRepo, supplierRepo, createMockRepo(), saleRepo, purchaseRepo, createMockRepo(), createMockReportRepo())

  const records = [
    { fecha: '2026-06-01', total: '150', items: '[]' }
  ]

  try {
    await service.importData('auto', records)
    assert(false, 'Debería lanzar error por ambigüedad ventas/compras')
  } catch (error) {
    assert(error.message.includes('distinguir entre Ventas y Compras'), 'Error debe mencionar ambigüedad')
  }
  assert(saleRepo._data.length === 0, 'No debería haber ventas guardadas')
  assert(purchaseRepo._data.length === 0, 'No debería haber compras guardadas')
  console.log('  ✓ testImportSalesAmbiguousWithPurchases')
}

async function testImportSalesDetectedBySaleHeader() {
  const saleRepo = createMockRepo()
  saleRepo.createWithItems = async (saleData, items) => {
    const sale = { id: saleRepo._data.length + 1, ...saleData, items }
    saleRepo._data.push(sale)
    return sale
  }
  const customerRepo = createMockRepo()
  customerRepo._data.push({ id: 1, documentId: '12345678', name: 'Cliente A' })
  const service = new ImportService(createMockRepo(), customerRepo, createMockRepo(), createMockRepo(), saleRepo, createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { customerId: '12345678', fecha: '2026-06-01', total: '150', tax: '27', items: [] }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Venta con customerId debe detectarse como sales')
  assert(saleRepo._data.length === 1, 'Venta debe guardarse en saleRepo')
  console.log('  ✓ testImportSalesDetectedBySaleHeader')
}

async function testImportPurchasesDetectedByPurchaseHeader() {
  const purchaseRepo = createMockRepo()
  purchaseRepo.createWithItems = async (purchaseData, items) => {
    const purchase = { id: purchaseRepo._data.length + 1, ...purchaseData, items }
    purchaseRepo._data.push(purchase)
    return purchase
  }
  const supplierRepo = createMockRepo()
  supplierRepo._data.push({ id: 1, documentId: '87654321', name: 'Proveedor A' })
  const service = new ImportService(createMockRepo(), createMockRepo(), supplierRepo, createMockRepo(), createMockRepo(), purchaseRepo, createMockRepo(), createMockReportRepo())

  const records = [
    { supplierId: '87654321', fecha: '2026-06-01', total: '200', items: [] }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Compra con supplierId debe detectarse como purchases')
  assert(purchaseRepo._data.length === 1, 'Compra debe guardarse en purchaseRepo')
  console.log('  ✓ testImportPurchasesDetectedByPurchaseHeader')
}

async function testImportInventoryDetectedByTypeHeader() {
  const productRepo = createMockRepo()
  productRepo._data.push({ id: 1, code: 'P001', name: 'Producto 1', stock: 10 })
  const inventoryRepo = createMockRepo()
  const service = new ImportService(productRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), inventoryRepo, createMockReportRepo())

  const records = [
    { producto: 'P001', type: 'entry', cantidad: '5' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Inventario debe detectarse por type/cantidad')
  console.log('  ✓ testImportInventoryDetectedByTypeHeader')
}

async function testImportSuppliersDetectedByDocIdPrefixed() {
  const supplierRepo = createMockRepo()
  const customerRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), customerRepo, supplierRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { id: '2', documentId: 'PROV-002', name: 'Importaciones Globales, S.A.', email: 'info@importglobal.com', phone: '5555-1002', address: '1a. Avenida 5-30, Zona 10' },
    { id: '3', documentId: 'PROV-003', name: 'Suministros Office S.A.', email: 'pedidos@suministros.com', phone: '5555-1003', address: '7a. Avenida 15-45, Zona 13' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 2, 'Debería importar 2 proveedores con documentId PROV-*')
  assert(supplierRepo._data.length === 2, 'Proveedores deben guardarse en supplierRepo')
  assert(customerRepo._data.length === 0, 'No debe guardarse en customerRepo')
  assert(supplierRepo._data[0].name === 'Importaciones Globales, S.A.', 'Nombre del primer proveedor correcto')
  console.log('  ✓ testImportSuppliersDetectedByDocIdPrefixed')
}

async function testImportCustomersDetectedByDocIdPrefixed() {
  const supplierRepo = createMockRepo()
  const customerRepo = createMockRepo()
  const service = new ImportService(createMockRepo(), customerRepo, supplierRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { documentId: 'C001', name: 'Cliente Uno', email: 'cliente1@test.com', phone: '111111111', address: 'Calle 1' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Debería importar 1 cliente con documentId C*')
  assert(customerRepo._data.length === 1, 'Cliente debe guardarse en customerRepo')
  assert(supplierRepo._data.length === 0, 'No debe guardar en supplierRepo')
  console.log('  ✓ testImportCustomersDetectedByDocIdPrefixed')
}

async function testImportSalesExportedCSV() {
  const customerRepo = createMockRepo()
  customerRepo._data.push({ id: 1, documentId: 'C001', name: 'Cliente Export' })
  const saleRepo = createMockRepo()
  saleRepo.createWithItems = async (saleData, items) => {
    const sale = { id: saleRepo._data.length + 1, ...saleData, items }
    saleRepo._data.push(sale)
    return sale
  }
  const service = new ImportService(createMockRepo(), customerRepo, createMockRepo(), createMockRepo(), saleRepo, createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { id: '1', customerId: '1', customerName: 'Cliente Export', date: '2026-07-08T10:00:00.000Z', subtotal: '100', tax: '18', total: '118', status: 'completed', notes: '', createdAt: '2026-07-08T10:00:00.000Z', updatedAt: '2026-07-08T10:00:00.000Z' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Venta exportada debe importarse correctamente')
  assert(result.skipped === 0, 'No debe omitir ninguna')
  assert(saleRepo._data.length === 1, 'Venta guardada en saleRepo')
  console.log('  ✓ testImportSalesExportedCSV')
}

async function testImportSalesOcasionalCSV() {
  const customerRepo = createMockRepo()
  const saleRepo = createMockRepo()
  saleRepo.createWithItems = async (saleData, items) => {
    const sale = { id: saleRepo._data.length + 1, ...saleData, items }
    saleRepo._data.push(sale)
    return sale
  }
  const service = new ImportService(createMockRepo(), customerRepo, createMockRepo(), createMockRepo(), saleRepo, createMockRepo(), createMockRepo(), createMockReportRepo())

  const records = [
    { id: '1', customerId: '', customerName: 'Cliente ocasional', date: '2026-07-09T01:34:21.318Z', subtotal: '650', tax: '78', total: '728', status: 'completed', notes: '', createdAt: '2026-07-09T01:34:21.318Z', updatedAt: '2026-07-09T01:34:21.318Z' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Venta ocasional debe importarse correctamente')
  assert(result.skipped === 0, 'No debe omitir ninguna')
  assert(saleRepo._data.length === 1, 'Venta guardada en saleRepo')
  assert(customerRepo._data.length === 1, 'Cliente ocasional creado automáticamente')
  assert(customerRepo._data[0].name === 'Cliente ocasional', 'Nombre del cliente ocasional correcto')
  console.log('  ✓ testImportSalesOcasionalCSV')
}

async function testImportPurchasesExportedCSV() {
  const supplierRepo = createMockRepo()
  supplierRepo._data.push({ id: 1, documentId: 'PROV-001', name: 'Proveedor Export' })
  const purchaseRepo = createMockRepo()
  purchaseRepo.createWithItems = async (purchaseData, items) => {
    const purchase = { id: purchaseRepo._data.length + 1, ...purchaseData, items }
    purchaseRepo._data.push(purchase)
    return purchase
  }
  const service = new ImportService(createMockRepo(), createMockRepo(), supplierRepo, createMockRepo(), createMockRepo(), purchaseRepo, createMockRepo(), createMockReportRepo())

  const records = [
    { id: '1', supplierId: '1', supplierName: 'Proveedor Export', date: '2026-07-08T10:00:00.000Z', subtotal: '200', tax: '36', total: '236', status: 'completed', notes: '', createdAt: '2026-07-08T10:00:00.000Z', updatedAt: '2026-07-08T10:00:00.000Z' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Compra exportada debe importarse correctamente')
  assert(result.skipped === 0, 'No debe omitir ninguna')
  assert(purchaseRepo._data.length === 1, 'Compra guardada en purchaseRepo')
  console.log('  ✓ testImportPurchasesExportedCSV')
}

async function testImportMovementsExportedCSV() {
  const productRepo = createMockRepo()
  productRepo._data.push({ id: 1, code: 'PROD-001', name: 'Producto Test', stock: 20 })
  const inventoryRepo = createMockRepo()
  const service = new ImportService(productRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), createMockRepo(), inventoryRepo, createMockReportRepo())

  const records = [
    { id: '1', productId: '1', productName: 'Producto Test', type: 'entry', quantity: '10', stockBefore: '10', stockAfter: '20', reference: 'Compra', referenceId: '1', notes: '', date: '2026-07-08T10:00:00.000Z' }
  ]

  const result = await service.importData('auto', records)
  assert(result.imported === 1, 'Movimiento exportado debe importarse correctamente')
  assert(result.skipped === 0, 'No debe omitir ninguno')
  assert(inventoryRepo._data.length === 1, 'Movimiento guardado en inventoryRepo')
  assert(productRepo._data[0].stock === 30, 'Stock debe actualizarse (20 + 10)')
  console.log('  ✓ testImportMovementsExportedCSV')
}

async function testParseJSONFullExport() {
  const json = '{"products":[{"code":"P001","name":"Prod 1"}],"customers":[{"documentId":"C001","name":"Cliente 1"}],"suppliers":[{"documentId":"PROV-001","name":"Prov 1"}],"movements":[],"sales":[],"purchases":[],"settings":[{"key":"tax_rate","value":"18"}]}'
  const result = ImportService.parseJSON(json)
  assert(ImportService.isFullExport(result) === true, 'Debería detectarse como full export')
  assert(result.products.length === 1, 'products debe estar presente')
  assert(result.customers.length === 1, 'customers debe estar presente')
  assert(result.settings.length === 1, 'settings debe estar presente')
  console.log('  ✓ testParseJSONFullExport')
}

async function testParseJSONFullExportIgnoresEmpty() {
  const json = '{"products":[{"code":"P001"}],"customers":[],"suppliers":[],"movements":[],"sales":[],"purchases":[],"settings":[]}'
  const result = ImportService.parseJSON(json)
  assert(ImportService.isFullExport(result) === true, 'Debe detectarse incluso con arrays vacíos')
  console.log('  ✓ testParseJSONFullExportIgnoresEmpty')
}

async function testImportFullExport() {
  const productRepo = createMockRepo()
  const customerRepo = createMockRepo()
  const supplierRepo = createMockRepo()
  const settingRepo = createMockRepo()
  const service = new ImportService(productRepo, customerRepo, supplierRepo, settingRepo, createMockRepo(), createMockRepo(), createMockRepo(), createMockReportRepo())

  const data = {
    products: [{ name: 'Producto 1', code: 'P001', purchasePrice: '50', salePrice: '100', stock: '10' }],
    customers: [{ documentId: 'C001', name: 'Cliente 1', email: 'c1@test.com' }],
    suppliers: [{ documentId: 'PROV-001', name: 'Proveedor 1', email: 'p1@test.com' }],
    settings: [{ key: 'tax_rate', value: '18' }]
  }

  const result = await service.importFullExport(data)
  assert(productRepo._data.length === 1, 'Producto importado')
  assert(customerRepo._data.length === 1, 'Cliente importado')
  assert(supplierRepo._data.length === 1, 'Proveedor importado')
  assert(settingRepo._data.length === 1, 'Setting importado')
  assert(result.totalImported === 4, 'Total importados debe ser 4')
  assert(result.entities.length === 4, '4 entidades procesadas')
  console.log('  ✓ testImportFullExport')
}

export async function runImportServiceTests() {
  console.log('\n--- ImportService Tests ---\n')

  await testParseCSVBasic()
  await testParseCSVWithQuotes()
  await testParseCSVEmpty()
  await testParseCSVOnlyHeaders()
  await testParseJSONArray()
  await testParseJSONObjectWithArray()
  await testParseJSONEmpty()
  await testImportProducts()
  await testImportProductsWithAutoCode()
  await testImportProductsSkipsInvalid()
  await testImportCustomers()
  await testImportCustomersSkipsInvalid()
  await testImportSuppliers()
  await testImportSales()
  await testImportSalesSkipsMissingCustomer()
  await testImportPurchases()
  await testImportInventory()
  await testImportInventoryExit()
  await testImportSettings()
  await testImportDataAutoDetectProducts()
  await testImportDataAutoDetectCustomers()
  await testImportDataManualEntity()
  await testImportDataUnknownEntity()
  await testSanitizeRecord()
  await testSanitizeRecordNull()
  await testImportDataAutoDetectCustomersEnglishHeaders()
  await testImportDataAutoDetectSuppliersEnglishHeaders()
  await testImportDataAutoDetectInventoryEnglishHeaders()
  await testImportDataMovementsAlias()
  await testImportDataConfigAlias()
  await testImportSuppliersNotSavedAsCustomers()
  await testImportCustomersNotSavedAsSuppliers()
  await testImportProductsNotSavedAsCustomers()
  await testImportSalesAmbiguousWithPurchases()
  await testImportSalesDetectedBySaleHeader()
  await testImportPurchasesDetectedByPurchaseHeader()
  await testImportInventoryDetectedByTypeHeader()
  await testImportSuppliersDetectedByDocIdPrefixed()
  await testImportCustomersDetectedByDocIdPrefixed()
  await testImportSalesExportedCSV()
  await testImportSalesOcasionalCSV()
  await testImportPurchasesExportedCSV()
  await testImportMovementsExportedCSV()
  await testParseJSONFullExport()
  await testParseJSONFullExportIgnoresEmpty()
  await testImportFullExport()

  console.log('\n✓ Todos los tests de ImportService pasaron\n')
}