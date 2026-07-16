import { ExportService } from '../../src/services/ExportService.js'
import { ImportService } from '../../src/services/ImportService.js'
import { assert, createMockDB, SEED_ACCOUNTS, seedAccounts } from './helpers.js'

function createRepoFromTable(db, tableName, options = {}) {
  const { withFindById, withFindByDocumentId, withFindByCode, withUpdateStock, withSet, withGenerateNextCode, withGenerateNextDocumentId, withFindByCustomerAndDate, withFindBySupplierAndDate } = options
  const api = {
    async findAll() { return (await db[tableName].toArray()).map(d => ({ ...d })) },
    async findById(id) {
      if (!withFindById) return null
      const d = await db[tableName].get(id)
      return d ? { ...d } : null
    },
    async findByCode(code) {
      if (!withFindByCode) return null
      const all = await db[tableName].toArray()
      return all.find(d => d.code === code) || null
    },
    async findByDocumentId(documentId) {
      if (!withFindByDocumentId) return null
      const all = await db[tableName].toArray()
      return all.find(d => d.documentId === documentId) || null
    },
    async generateNextCode() {
      if (!withGenerateNextCode) return 'PROD-001'
      const all = await db[tableName].toArray()
      const max = all.reduce((m, p) => { const n = parseInt((p.code || 'PROD-000').replace('PROD-', '')); return n > m ? n : m }, 0)
      return `PROD-${String(max + 1).padStart(3, '0')}`
    },
    async generateNextDocumentId() {
      if (!withGenerateNextDocumentId) return 'C001'
      const all = await db[tableName].toArray()
      const max = all.reduce((m, c) => { const n = parseInt((c.documentId || 'C0').replace('C', '')); return n > m ? n : m }, 0)
      return `C${String(max + 1).padStart(3, '0')}`
    },
    async create(item) {
      const all = await db[tableName].toArray()
      const id = all.length > 0 ? Math.max(...all.map(d => d.id)) + 1 : 1
      const stored = { id, ...item }
      await db[tableName].add(stored)
      return { ...stored }
    },
    async update(id, changes) {
      await db[tableName].update(id, changes)
      const d = await db[tableName].get(id)
      return d ? { ...d } : null
    },
    async updateStock(productId, quantity) {
      if (!withUpdateStock) return null
      const d = await db[tableName].get(productId)
      if (d) {
        d.stock = Math.max(0, (d.stock || 0) + quantity)
        await db[tableName].update(productId, d)
        return { ...d }
      }
      return null
    },
    async set(key, value) {
      if (!withSet) return null
      const all = await db[tableName].toArray()
      const existing = all.find(d => d.key === key)
      if (existing) {
        existing.value = value
        existing.updatedAt = new Date().toISOString()
        await db[tableName].update(existing.id, existing)
        return { ...existing }
      }
      const all2 = await db[tableName].toArray()
      const id = all2.length > 0 ? Math.max(...all2.map(d => d.id)) + 1 : 1
      const stored = { id, key, value, updatedAt: new Date().toISOString() }
      await db[tableName].add(stored)
      return { ...stored }
    },
    async findByCustomerAndDate(customerId, date) {
      if (!withFindByCustomerAndDate) return null
      const all = await db[tableName].toArray()
      return all.find(d => d.customerId === customerId && d.date === date) || null
    },
    async findBySupplierAndDate(supplierId, date) {
      if (!withFindBySupplierAndDate) return null
      const all = await db[tableName].toArray()
      return all.find(d => d.supplierId === supplierId && d.date === date) || null
    },
    async count() { return (await db[tableName].toArray()).length }
  }
  if (withFindById) {
    api.findById = async (id) => {
      const d = await db[tableName].get(id)
      return d ? { ...d } : null
    }
  }
  if (withFindByDocumentId) {
    api.findByDocumentId = async (documentId) => {
      const all = await db[tableName].toArray()
      return all.find(d => d.documentId === documentId) || null
    }
  }
  if (withFindByCode) {
    api.findByCode = async (code) => {
      const all = await db[tableName].toArray()
      return all.find(d => d.code === code) || null
    }
  }
  if (withUpdateStock) {
    api.updateStock = async (productId, quantity) => {
      const d = await db[tableName].get(productId)
      if (d) {
        d.stock = Math.max(0, (d.stock || 0) + quantity)
        await db[tableName].update(productId, d)
        return { ...d }
      }
      return null
    }
  }
  if (withSet) {
    api.set = async (key, value) => {
      const all = await db[tableName].toArray()
      const existing = all.find(d => d.key === key)
      if (existing) {
        existing.value = value
        existing.updatedAt = new Date().toISOString()
        await db[tableName].update(existing.id, existing)
        return { ...existing }
      }
      const all2 = await db[tableName].toArray()
      const id = all2.length > 0 ? Math.max(...all2.map(d => d.id)) + 1 : 1
      const stored = { id, key, value, updatedAt: new Date().toISOString() }
      await db[tableName].add(stored)
      return { ...stored }
    }
  }
  if (withGenerateNextCode) {
    api.generateNextCode = async () => {
      const all = await db[tableName].toArray()
      const max = all.reduce((m, p) => { const n = parseInt((p.code || 'PROD-000').replace('PROD-', '')); return n > m ? n : m }, 0)
      return `PROD-${String(max + 1).padStart(3, '0')}`
    }
  }
  if (withGenerateNextDocumentId) {
    api.generateNextDocumentId = async () => {
      const all = await db[tableName].toArray()
      const max = all.reduce((m, c) => { const n = parseInt((c.documentId || 'C0').replace('C', '')); return n > m ? n : m }, 0)
      return `C${String(max + 1).padStart(3, '0')}`
    }
  }
  if (withFindByCustomerAndDate) {
    api.findByCustomerAndDate = async (customerId, date) => {
      const all = await db[tableName].toArray()
      return all.find(d => d.customerId === customerId && d.date === date) || null
    }
  }
  if (withFindBySupplierAndDate) {
    api.findBySupplierAndDate = async (supplierId, date) => {
      const all = await db[tableName].toArray()
      return all.find(d => d.supplierId === supplierId && d.date === date) || null
    }
  }
  return api
}

function createSaleRepoWithItems(db, saleIdCounter) {
  let counter = saleIdCounter
  return {
    async findAll() { return (await db.sales.toArray()).map(d => ({ ...d })) },
    async findById(id) {
      const d = await db.sales.get(id)
      if (!d) return null
      const items = (await db.saleItems.toArray()).filter(i => i.saleId === id)
      const obj = { ...d, items: items.map(i => ({ ...i })) }
      obj.toJSON = function () { return { ...this, items: this.items.map(i => ({ ...i })) } }
      return obj
    },
    async createWithItems(saleData, itemsData) {
      const id = ++counter
      await db.sales.add({ ...saleData, id })
      for (const item of itemsData) {
        await db.saleItems.add({ ...item, saleId: id })
      }
      return this.findById(id)
    },
    async count() { return db.sales.count() },
    async findByCustomerAndDate(customerId, date) {
      const all = await db.sales.toArray()
      return all.find(d => d.customerId === customerId && d.date === date) || null
    }
  }
}

function createPurchaseRepoWithItems(db, purchaseIdCounter) {
  let counter = purchaseIdCounter
  return {
    async findAll() { return (await db.purchases.toArray()).map(d => ({ ...d })) },
    async findById(id) {
      const d = await db.purchases.get(id)
      if (!d) return null
      const items = (await db.purchaseItems.toArray()).filter(i => i.purchaseId === id)
      const obj = { ...d, items: items.map(i => ({ ...i })) }
      obj.toJSON = function () { return { ...this, items: this.items.map(i => ({ ...i })) } }
      return obj
    },
    async createWithItems(purchaseData, itemsData) {
      const id = ++counter
      await db.purchases.add({ ...purchaseData, id })
      for (const item of itemsData) {
        await db.purchaseItems.add({ ...item, purchaseId: id })
      }
      return this.findById(id)
    },
    async count() { return db.purchases.count() },
    async findBySupplierAndDate(supplierId, date) {
      const all = await db.purchases.toArray()
      return all.find(d => d.supplierId === supplierId && d.date === date) || null
    }
  }
}

async function testExportFullDataAndReimport() {
  const db = createMockDB()
  const now = new Date().toISOString()

  const productData = { id: 1, code: 'PROD-001', name: 'Producto Test', category: 'Test', purchasePrice: 50, salePrice: 100, stock: 10, stockMin: 2, active: true, createdAt: now, updatedAt: now }
  const customerData = { id: 1, documentId: 'C001', name: 'Cliente Test', email: 'test@test.com', phone: '5555-0000', address: '', active: true, createdAt: now, updatedAt: now }
  const supplierData = { id: 1, documentId: 'PROV-001', name: 'Proveedor Test', email: 'prov@test.com', phone: '5555-0000', address: '', active: true, createdAt: now, updatedAt: now }
  const settingData = { id: 1, key: 'tax_rate', value: '18', updatedAt: now }
  const movementData = { id: 1, productId: 1, productName: 'Producto Test', type: 'entry', quantity: 10, stockBefore: 0, stockAfter: 10, reference: 'initial', date: now }

  await db.products.add(productData)
  await db.customers.add(customerData)
  await db.suppliers.add(supplierData)
  await db.settings.add(settingData)
  await db.inventoryMovements.add(movementData)

  const productRepo = createRepoFromTable(db, 'products', { withFindAll: true, withFindByCode: true, withGenerateNextCode: true, withUpdateStock: true })
  const customerRepo = createRepoFromTable(db, 'customers', { withFindAll: true, withFindByDocumentId: true, withGenerateNextDocumentId: true })
  const supplierRepo = createRepoFromTable(db, 'suppliers', { withFindAll: true, withFindByDocumentId: true, withGenerateNextDocumentId: true })
  const settingRepo = createRepoFromTable(db, 'settings', { withFindAll: true, withSet: true })
  const saleRepo = createRepoFromTable(db, 'sales', { withFindAll: true, withFindByCustomerAndDate: true })
  const purchaseRepo = createRepoFromTable(db, 'purchases', { withFindAll: true, withFindBySupplierAndDate: true })
  const inventoryRepo = createRepoFromTable(db, 'inventoryMovements', { withFindAll: true })

  const exportSvc = new ExportService(productRepo, customerRepo, supplierRepo, saleRepo, purchaseRepo, inventoryRepo, settingRepo)
  const importSvc = new ImportService(productRepo, customerRepo, supplierRepo, settingRepo, saleRepo, purchaseRepo, inventoryRepo, null)

  const exported = await exportSvc.getAllData()
  assert(exported.products.length === 1, 'Should export 1 product')
  assert(exported.customers.length === 1, 'Should export 1 customer')
  assert(exported.suppliers.length === 1, 'Should export 1 supplier')
  assert(exported.movements.length === 1, 'Should export 1 movement')
  assert(exported.settings.length === 1, 'Should export 1 setting')

  db.products.clear()
  db.customers.clear()
  db.suppliers.clear()
  db.settings.clear()
  db.inventoryMovements.clear()

  assert((await db.products.count()) === 0, 'Products should be empty after clear')
  assert((await db.customers.count()) === 0, 'Customers should be empty after clear')

  const importResult = await importSvc.importFullExport(exported)
  assert(importResult.totalImported === 5, `Should import 5 entities total, got ${importResult.totalImported}`)
  assert((await db.products.count()) === 1, 'Products should be restored')
  assert((await db.customers.count()) === 1, 'Customers should be restored')
  assert((await db.suppliers.count()) === 1, 'Suppliers should be restored')
  assert((await db.settings.count()) === 1, 'Settings should be restored')
  assert((await db.inventoryMovements.count()) === 1, 'Movements should be restored')

  const restoredProduct = (await db.products.toArray())[0]
  assert(restoredProduct.name === 'Producto Test', `Product name should match, got ${restoredProduct.name}`)
  assert(restoredProduct.stock === 20, `Product stock should be 20 (10 from product + 10 from movement), got ${restoredProduct.stock}`)

  const restoredSetting = (await db.settings.toArray())[0]
  assert(restoredSetting.value === '18', `Tax rate should be restored, got ${restoredSetting.value}`)

  console.log('  ✓ testExportFullDataAndReimport')
}

async function testExportCSVAndReimportProducts() {
  const db = createMockDB()
  const now = new Date().toISOString()

  const products = [
    { id: 1, code: 'PROD-001', name: 'Producto A', category: 'Cat1', purchasePrice: 50, salePrice: 100, stock: 10, stockMin: 2, active: true, createdAt: now, updatedAt: now },
    { id: 2, code: 'PROD-002', name: 'Producto B', category: 'Cat2', purchasePrice: 30, salePrice: 60, stock: 5, stockMin: 1, active: true, createdAt: now, updatedAt: now }
  ]
  for (const p of products) await db.products.add(p)

  const productRepo = createRepoFromTable(db, 'products', { withFindAll: true, withFindByCode: true, withGenerateNextCode: true, withUpdateStock: true })
  const customerRepo = createRepoFromTable(db, 'customers', { withFindAll: true })
  const supplierRepo = createRepoFromTable(db, 'suppliers', { withFindAll: true })
  const settingRepo = createRepoFromTable(db, 'settings', { withFindAll: true })
  const saleRepo = createRepoFromTable(db, 'sales', { withFindAll: true })
  const purchaseRepo = createRepoFromTable(db, 'purchases', { withFindAll: true })
  const inventoryRepo = createRepoFromTable(db, 'inventoryMovements', { withFindAll: true })

  const exportSvc = new ExportService(productRepo, customerRepo, supplierRepo, saleRepo, purchaseRepo, inventoryRepo, settingRepo)

  const exportedProducts = await exportSvc.getEntityData('products')
  assert(exportedProducts.length === 2, 'Should export 2 products')

  const csv = ExportService.toCSV(exportedProducts)
  assert(csv.length > 0, 'CSV should not be empty')
  assert(csv.includes('PROD-001'), 'CSV should contain PROD-001')
  assert(csv.includes('Producto A'), 'CSV should contain Producto A')

  const parsedRecords = ImportService.parseCSV(csv)
  assert(parsedRecords.length === 2, 'CSV should parse back to 2 records')

  db.products.clear()
  assert((await db.products.count()) === 0, 'Products should be empty')

  const importSvc = new ImportService(productRepo, customerRepo, supplierRepo, settingRepo, saleRepo, purchaseRepo, inventoryRepo, null)
  const result = await importSvc.importData('auto', parsedRecords)
  assert(result.imported === 2, `Should import 2 products, got ${result.imported}`)
  assert(result.errors.length === 0, 'Should have no errors')
  assert((await db.products.count()) === 2, 'Products should be restored')

  const restored = await db.products.toArray()
  const productA = restored.find(p => p.name === 'Producto A')
  assert(productA, 'Producto A should exist')
  assert(productA.salePrice == 100, `Producto A salePrice should be 100, got ${productA.salePrice}`)

  console.log('  ✓ testExportCSVAndReimportProducts')
}

async function testExportCSVAndReimportCustomers() {
  const db = createMockDB()
  const now = new Date().toISOString()

  const customers = [
    { id: 1, documentId: 'C001', name: 'Juan Pérez', email: 'juan@test.com', phone: '5555-0001', address: 'Calle 1', active: true, createdAt: now, updatedAt: now },
    { id: 2, documentId: 'C002', name: 'María García', email: 'maria@test.com', phone: '5555-0002', address: 'Calle 2', active: true, createdAt: now, updatedAt: now }
  ]
  for (const c of customers) await db.customers.add(c)

  const productRepo = createRepoFromTable(db, 'products', { withFindAll: true })
  const customerRepo = createRepoFromTable(db, 'customers', { withFindAll: true, withFindByDocumentId: true, withGenerateNextDocumentId: true })
  const supplierRepo = createRepoFromTable(db, 'suppliers', { withFindAll: true })
  const settingRepo = createRepoFromTable(db, 'settings', { withFindAll: true })
  const saleRepo = createRepoFromTable(db, 'sales', { withFindAll: true })
  const purchaseRepo = createRepoFromTable(db, 'purchases', { withFindAll: true })
  const inventoryRepo = createRepoFromTable(db, 'inventoryMovements', { withFindAll: true })

  const exportSvc = new ExportService(productRepo, customerRepo, supplierRepo, saleRepo, purchaseRepo, inventoryRepo, settingRepo)
  const exported = await exportSvc.getEntityData('customers')
  assert(exported.length === 2, 'Should export 2 customers')

  const csv = ExportService.toCSV(exported)
  const parsed = ImportService.parseCSV(csv)
  assert(parsed.length === 2, 'CSV should parse to 2 records')

  db.customers.clear()
  assert((await db.customers.count()) === 0, 'Customers should be empty')

  const importSvc = new ImportService(productRepo, customerRepo, supplierRepo, settingRepo, saleRepo, purchaseRepo, inventoryRepo, null)
  const result = await importSvc.importData('auto', parsed)
  assert(result.imported === 2, `Should import 2 customers, got ${result.imported}`)
  assert((await db.customers.count()) === 2, 'Customers should be restored')

  const restored = await db.customers.toArray()
  assert(restored.some(c => c.name === 'Juan Pérez'), 'Juan Pérez should exist')
  assert(restored.some(c => c.email === 'maria@test.com'), 'María García should exist')

  console.log('  ✓ testExportCSVAndReimportCustomers')
}

async function testImportInventoryUpdatesStock() {
  const db = createMockDB()
  const now = new Date().toISOString()

  await db.products.add({ id: 1, code: 'PROD-001', name: 'Producto Stock', category: 'Test', purchasePrice: 50, salePrice: 100, stock: 20, stockMin: 2, active: true, createdAt: now, updatedAt: now })

  const productRepo = createRepoFromTable(db, 'products', { withFindAll: true, withFindByCode: true, withFindById: true, withUpdateStock: true })
  const customerRepo = createRepoFromTable(db, 'customers', { withFindAll: true })
  const supplierRepo = createRepoFromTable(db, 'suppliers', { withFindAll: true })
  const settingRepo = createRepoFromTable(db, 'settings', { withFindAll: true })
  const saleRepo = createRepoFromTable(db, 'sales', { withFindAll: true })
  const purchaseRepo = createRepoFromTable(db, 'purchases', { withFindAll: true })
  const inventoryRepo = createRepoFromTable(db, 'inventoryMovements', { withFindAll: true })

  const importSvc = new ImportService(productRepo, customerRepo, supplierRepo, settingRepo, saleRepo, purchaseRepo, inventoryRepo, null)

  const result = await importSvc.importData('inventory', [
    { product: 'PROD-001', type: 'entry', quantity: '5', date: now }
  ])

  assert(result.imported === 1, 'Should import 1 movement')
  assert(result.errors.length === 0, 'Should have no errors')

  const updatedProduct = await db.products.get(1)
  assert(updatedProduct.stock === 25, `Stock should be 25 (20+5), got ${updatedProduct.stock}`)

  const movements = await db.inventoryMovements.toArray()
  assert(movements.length === 1, 'Should have 1 movement')
  assert(movements[0].productId === 1, 'Movement should reference product 1')

  const exitResult = await importSvc.importData('inventory', [
    { product: 'PROD-001', type: 'exit', quantity: '3', date: now }
  ])
  assert(exitResult.imported === 1, 'Should import 1 exit movement')
  const afterExit = await db.products.get(1)
  assert(afterExit.stock === 22, `Stock should be 22 (25-3), got ${afterExit.stock}`)

  console.log('  ✓ testImportInventoryUpdatesStock')
}

async function testImportSalesWithOcasionalCustomer() {
  const db = createMockDB()
  const now = new Date().toISOString()

  await db.products.add({ id: 1, code: 'PROD-001', name: 'Producto Venta', category: 'Test', purchasePrice: 50, salePrice: 100, stock: 10, stockMin: 2, active: true, createdAt: now, updatedAt: now })

  const productRepo = createRepoFromTable(db, 'products', { withFindAll: true, withFindByCode: true, withFindById: true, withUpdateStock: true })
  const customerRepo = createRepoFromTable(db, 'customers', { withFindAll: true, withFindByDocumentId: true, withGenerateNextDocumentId: true, withFindById: true })
  const supplierRepo = createRepoFromTable(db, 'suppliers', { withFindAll: true })
  const settingRepo = createRepoFromTable(db, 'settings', { withFindAll: true })
  const saleRepo = createSaleRepoWithItems(db, 100)
  const purchaseRepo = createRepoFromTable(db, 'purchases', { withFindAll: true })
  const inventoryRepo = createRepoFromTable(db, 'inventoryMovements', { withFindAll: true })

  const importSvc = new ImportService(productRepo, customerRepo, supplierRepo, settingRepo, saleRepo, purchaseRepo, inventoryRepo, null)

  const result = await importSvc.importSales([
    { customerName: 'Cliente ocasional', date: now, total: '100', tax: '18', items: [{ productId: 1, quantity: 1, price: 100 }] }
  ])

  assert(result.imported === 1, 'Should import 1 sale')
  assert(result.errors.length === 0, 'Should have no errors')

  const customers = await db.customers.toArray()
  const ocasional = customers.find(c => c.documentId === 'C-OCASIONAL')
  assert(ocasional, 'Cliente ocasional should be auto-created')
  assert(ocasional.name === 'Cliente ocasional', `Name should be 'Cliente ocasional', got ${ocasional.name}`)

  const sales = await db.sales.toArray()
  assert(sales.length === 1, 'Should have 1 sale')
  assert(sales[0].total === 100, `Sale total should be 100, got ${sales[0].total}`)

  const secondResult = await importSvc.importSales([
    { customerName: 'Cliente ocasional', date: now, total: '200', tax: '36', items: [{ productId: 1, quantity: 2, price: 100 }] }
  ])
  assert(secondResult.imported === 0, 'Second sale should be skipped as duplicate')
  assert(secondResult.skipped === 1, 'Should skip 1 duplicate')
  assert(secondResult.errors[0].message.includes('duplicada'), 'Should mention duplicate')

  console.log('  ✓ testImportSalesWithOcasionalCustomer')
}

async function testImportFullExportWithAccountingEntries() {
  const db = createMockDB()
  const now = new Date().toISOString()

  await seedAccounts(db)
  await db.products.add({ id: 1, code: 'PROD-001', name: 'Producto Contable', category: 'Test', purchasePrice: 50, salePrice: 100, stock: 10, stockMin: 2, active: true, createdAt: now, updatedAt: now })
  await db.customers.add({ id: 1, documentId: 'C001', name: 'Cliente Contable', email: 'c@test.com', phone: '', address: '', active: true, createdAt: now, updatedAt: now })

  await db.accountingEntries.add({
    id: 1, referenceType: 'sale', referenceId: 100, date: now,
    description: 'Venta TEST',
    items: [
      { accountId: 1, accountCode: '1101', accountName: 'Caja y Bancos', debit: 118, credit: 0 },
      { accountId: 6, accountCode: '4101', accountName: 'Ventas', debit: 0, credit: 100 },
      { accountId: 3, accountCode: '2101', accountName: 'IVA por Pagar', debit: 0, credit: 18 },
      { accountId: 7, accountCode: '5101', accountName: 'Costo de Ventas', debit: 50, credit: 0 },
      { accountId: 2, accountCode: '1201', accountName: 'Inventario', debit: 0, credit: 50 }
    ],
    totalDebit: 168, totalCredit: 168, createdAt: now
  })

  const productRepo = createRepoFromTable(db, 'products', { withFindAll: true, withFindByCode: true, withFindById: true, withUpdateStock: true })
  const customerRepo = createRepoFromTable(db, 'customers', { withFindAll: true, withFindByDocumentId: true, withFindById: true, withGenerateNextDocumentId: true })
  const supplierRepo = createRepoFromTable(db, 'suppliers', { withFindAll: true })
  const settingRepo = createRepoFromTable(db, 'settings', { withFindAll: true })
  const saleRepo = createRepoFromTable(db, 'sales', { withFindAll: true })
  const purchaseRepo = createRepoFromTable(db, 'purchases', { withFindAll: true })
  const inventoryRepo = createRepoFromTable(db, 'inventoryMovements', { withFindAll: true })
  const accountingRepo = createRepoFromTable(db, 'accountingEntries', { withFindAll: true })
  const accountRepo = createRepoFromTable(db, 'accounts', { withFindAll: true })

  const exportSvc = new ExportService(productRepo, customerRepo, supplierRepo, saleRepo, purchaseRepo, inventoryRepo, settingRepo)
  const exported = await exportSvc.getAllData()
  assert(exported.products.length === 1, 'Should export 1 product')

  db.products.clear()
  db.customers.clear()
  db.suppliers.clear()
  db.settings.clear()
  db.inventoryMovements.clear()
  db.sales.clear()
  db.purchases.clear()

  const importSvc = new ImportService(productRepo, customerRepo, supplierRepo, settingRepo, saleRepo, purchaseRepo, inventoryRepo, null)
  const result = await importSvc.importFullExport(exported)
  assert(result.totalImported >= 1, 'Should import at least product entity')

  const restoredProducts = await db.products.toArray()
  assert(restoredProducts.length === 1, 'Product should be restored')
  assert(restoredProducts[0].name === 'Producto Contable', 'Product name should match')

  console.log('  ✓ testImportFullExportWithAccountingEntries')
}

async function testImportAutoDetectFullFlow() {
  const db = createMockDB()

  const productRepo = createRepoFromTable(db, 'products', { withFindAll: true, withFindByCode: true, withFindById: true, withUpdateStock: true, withGenerateNextCode: true })
  const customerRepo = createRepoFromTable(db, 'customers', { withFindAll: true, withFindByDocumentId: true, withFindById: true, withGenerateNextDocumentId: true })
  const supplierRepo = createRepoFromTable(db, 'suppliers', { withFindAll: true, withFindByDocumentId: true, withFindById: true, withGenerateNextDocumentId: true })
  const settingRepo = createRepoFromTable(db, 'settings', { withFindAll: true, withSet: true })
  const saleRepo = createSaleRepoWithItems(db, 100)
  const purchaseRepo = createPurchaseRepoWithItems(db, 200)
  const inventoryRepo = createRepoFromTable(db, 'inventoryMovements', { withFindAll: true })

  const importSvc = new ImportService(productRepo, customerRepo, supplierRepo, settingRepo, saleRepo, purchaseRepo, inventoryRepo, null)

  const productResult = await importSvc.importData('auto', [
    { name: 'Laptop', code: 'LAP-001', purchasePrice: '800', salePrice: '1200', stock: '5', category: 'Electrónica' }
  ])
  assert(productResult.imported === 1, 'Product with strong patterns should auto-detect as products')
  assert((await db.products.count()) === 1, 'Product should be in DB')

  const customerResult = await importSvc.importData('auto', [
    { documentId: 'C100', name: 'Cliente Nuevo', email: 'nuevo@test.com', phone: '123456789' }
  ])
  assert(customerResult.imported === 1, 'Customer with documentId/email should auto-detect')
  assert((await db.customers.count()) === 1, 'Customer should be in DB')

  const supplierResult = await importSvc.importData('auto', [
    { documentId: 'PROV-100', name: 'Proveedor Nuevo', email: 'prov@test.com' }
  ])
  assert(supplierResult.imported === 1, 'Supplier with PROV- documentId should auto-detect')
  assert((await db.suppliers.count()) === 1, 'Supplier should be in DB')

  const supplierByNameResult = await importSvc.importData('auto', [
    { name: 'Otro Proveedor', proveedor: 'Si', email: 'otro@test.com', phone: '987654321', address: 'Av. Siempre Viva' }
  ])
  assert(supplierByNameResult.imported === 1, 'Supplier with proveedor header should auto-detect')
  assert((await db.suppliers.count()) === 2, 'Second supplier should be in DB')

  const settingResult = await importSvc.importData('auto', [
    { key: 'business_name', value: 'Mi Empresa' }
  ])
  assert(settingResult.imported === 1, 'Setting with key/value should auto-detect')
  assert((await db.settings.count()) === 1, 'Setting should be in DB')

  const inventoryRecord = await productRepo.findByCode('LAP-001')
  assert(inventoryRecord, 'Product should exist for inventory test')

  const inventoryResult = await importSvc.importData('auto', [
    { product: 'LAP-001', type: 'entry', quantity: '10' }
  ])
  assert(inventoryResult.imported === 1, 'Inventory movement should auto-detect')
  const productAfter = await productRepo.findByCode('LAP-001')
  assert(productAfter.stock === 15, `Stock should be 15 (5+10), got ${productAfter.stock}`)

  console.log('  ✓ testImportAutoDetectFullFlow')
}

async function testImportRequiresManualEntitySelection() {
  const db = createMockDB()

  const customerRepo = createRepoFromTable(db, 'customers', { withFindAll: true })
  const supplierRepo = createRepoFromTable(db, 'suppliers', { withFindAll: true })
  const productRepo = createRepoFromTable(db, 'products', { withFindAll: true })
  const settingRepo = createRepoFromTable(db, 'settings', { withFindAll: true })
  const saleRepo = createRepoFromTable(db, 'sales', { withFindAll: true })
  const purchaseRepo = createRepoFromTable(db, 'purchases', { withFindAll: true })
  const inventoryRepo = createRepoFromTable(db, 'inventoryMovements', { withFindAll: true })

  const importSvc = new ImportService(productRepo, customerRepo, supplierRepo, settingRepo, saleRepo, purchaseRepo, inventoryRepo, null)

  try {
    await importSvc.importData('auto', [
      { name: 'Ambiguous Entity', email: 'test@test.com', phone: '123456789', address: 'Calle 123' }
    ])
    const errorMsg = 'Should have thrown: ambiguous entity without discriminators should require manual selection'
    assert(false, errorMsg)
  } catch (error) {
    assert(error.message.includes('distinguir entre Clientes y Proveedores'),
      `Error should ask for manual selection: ${error.message}`)
  }

  assert((await db.customers.count()) === 0, 'No customers should be saved on ambiguity')
  assert((await db.suppliers.count()) === 0, 'No suppliers should be saved on ambiguity')

  console.log('  ✓ testImportRequiresManualEntitySelection')
}

async function testExportJSONAndReimportWithFullExport() {
  const db = createMockDB()
  const now = new Date().toISOString()

  await db.products.add({ id: 1, code: 'PROD-001', name: 'Producto JSON', category: 'Test', purchasePrice: 40, salePrice: 80, stock: 15, stockMin: 3, active: true, createdAt: now, updatedAt: now })
  await db.customers.add({ id: 1, documentId: 'C001', name: 'Cliente JSON', email: 'cli@test.com', phone: '5555-0000', address: '', active: true, createdAt: now, updatedAt: now })
  await db.suppliers.add({ id: 1, documentId: 'PROV-001', name: 'Proveedor JSON', email: 'prov@test.com', phone: '5555-0000', address: '', active: true, createdAt: now, updatedAt: now })
  await db.settings.add({ id: 1, key: 'tax_rate', value: '12', updatedAt: now })

  const productRepo = createRepoFromTable(db, 'products', { withFindAll: true, withFindByCode: true, withUpdateStock: true, withGenerateNextCode: true })
  const customerRepo = createRepoFromTable(db, 'customers', { withFindAll: true, withFindByDocumentId: true, withFindById: true, withGenerateNextDocumentId: true })
  const supplierRepo = createRepoFromTable(db, 'suppliers', { withFindAll: true, withFindByDocumentId: true, withFindById: true, withGenerateNextDocumentId: true })
  const settingRepo = createRepoFromTable(db, 'settings', { withFindAll: true, withSet: true })
  const saleRepo = createRepoFromTable(db, 'sales', { withFindAll: true })
  const purchaseRepo = createRepoFromTable(db, 'purchases', { withFindAll: true })
  const inventoryRepo = createRepoFromTable(db, 'inventoryMovements', { withFindAll: true })

  const exportSvc = new ExportService(productRepo, customerRepo, supplierRepo, saleRepo, purchaseRepo, inventoryRepo, settingRepo)
  const exported = await exportSvc.getAllData()

  const jsonStr = ExportService.toJSON(exported)
  const parsed = ImportService.parseJSON(jsonStr)

  assert(ImportService.isFullExport(parsed) === true, 'Parsed JSON should be detected as full export')
  assert(parsed.products.length === 1, 'Products in parsed JSON')
  assert(parsed.customers.length === 1, 'Customers in parsed JSON')
  assert(parsed.suppliers.length === 1, 'Suppliers in parsed JSON')
  assert(parsed.settings.length === 1, 'Settings in parsed JSON')

  db.products.clear()
  db.customers.clear()
  db.suppliers.clear()
  db.settings.clear()

  const importSvc = new ImportService(productRepo, customerRepo, supplierRepo, settingRepo, saleRepo, purchaseRepo, inventoryRepo, null)
  const result = await importSvc.importFullExport(parsed)

  assert(result.totalImported === 4, `Should import 4 entities, got ${result.totalImported}`)
  assert(result.entities.length === 4, 'Should process 4 entities')

  const restoredProduct = await productRepo.findByCode('PROD-001')
  assert(restoredProduct, 'Product PROD-001 should exist')
  assert(restoredProduct.name === 'Producto JSON', 'Product name should match')
  assert(restoredProduct.stock === 15, 'Product stock should be restored')

  const restoredCustomer = await customerRepo.findByDocumentId('C001')
  assert(restoredCustomer, 'Customer C001 should exist')
  assert(restoredCustomer.email === 'cli@test.com', 'Customer email should match')

  const restoredSupplier = await supplierRepo.findByDocumentId('PROV-001')
  assert(restoredSupplier, 'Supplier PROV-001 should exist')
  assert(restoredSupplier.phone === '5555-0000', 'Supplier phone should match')

  const restoredSettings = await db.settings.toArray()
  assert(restoredSettings.length === 1, 'One setting restored')
  assert(restoredSettings[0].value === '12', 'Tax rate should be 12')

  console.log('  ✓ testExportJSONAndReimportWithFullExport')
}

async function testImportFullExportEmptyArrays() {
  const db = createMockDB()
  const productRepo = createRepoFromTable(db, 'products', { withFindAll: true })
  const customerRepo = createRepoFromTable(db, 'customers', { withFindAll: true })
  const supplierRepo = createRepoFromTable(db, 'suppliers', { withFindAll: true })
  const settingRepo = createRepoFromTable(db, 'settings', { withFindAll: true })
  const saleRepo = createRepoFromTable(db, 'sales', { withFindAll: true })
  const purchaseRepo = createRepoFromTable(db, 'purchases', { withFindAll: true })
  const inventoryRepo = createRepoFromTable(db, 'inventoryMovements', { withFindAll: true })

  const importSvc = new ImportService(productRepo, customerRepo, supplierRepo, settingRepo, saleRepo, purchaseRepo, inventoryRepo, null)

  const result = await importSvc.importFullExport({
    products: [],
    customers: [],
    suppliers: [],
    movements: [],
    sales: [],
    purchases: [],
    settings: []
  })

  assert(result.totalImported === 0, 'Should import 0 entities for empty arrays')
  assert(result.entities.length === 0, 'Should process 0 entities')

  console.log('  ✓ testImportFullExportEmptyArrays')
}

export async function runImportExportFlowTests() {
  console.log('\n--- Import/Export Integration Flow Tests ---\n')

  await testExportFullDataAndReimport()
  await testExportCSVAndReimportProducts()
  await testExportCSVAndReimportCustomers()
  await testImportInventoryUpdatesStock()
  await testImportSalesWithOcasionalCustomer()
  await testImportFullExportWithAccountingEntries()
  await testImportAutoDetectFullFlow()
  await testImportRequiresManualEntitySelection()
  await testExportJSONAndReimportWithFullExport()
  await testImportFullExportEmptyArrays()

  console.log('\n✓ Todos los tests de integración Import/Export pasaron\n')
}
