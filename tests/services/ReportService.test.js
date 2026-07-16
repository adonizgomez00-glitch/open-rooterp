import { ReportService } from '../../src/services/ReportService.js'

function createMocks() {
  const sales = [
    { id: 1, date: '2026-07-01', customerName: 'Cliente A', subtotal: 100, tax: 18, total: 118, status: 'completed' },
    { id: 2, date: '2026-07-05', customerName: 'Cliente B', subtotal: 200, tax: 36, total: 236, status: 'completed' },
    { id: 3, date: '2026-06-15', customerName: 'Cliente C', subtotal: 50, tax: 9, total: 59, status: 'cancelled' }
  ]

  const purchases = [
    { id: 1, date: '2026-07-02', supplierName: 'Prov A', subtotal: 300, tax: 54, total: 354, status: 'completed' },
    { id: 2, date: '2026-07-10', supplierName: 'Prov B', subtotal: 150, tax: 27, total: 177, status: 'cancelled' }
  ]

  const products = [
    { id: 1, code: 'P001', name: 'Producto 1', category: 'A', stock: 10, stockMin: 5 },
    { id: 2, code: 'P002', name: 'Producto 2', category: 'B', stock: 2, stockMin: 5 },
    { id: 3, code: 'P003', name: 'Producto 3', category: 'A', stock: 0, stockMin: 3 }
  ]

  const saleRepo = {
    async findByDateRange(start, end) {
      return sales.filter(s => s.date >= start && s.date <= end)
    },
    async count() { return sales.length }
  }

  const purchaseRepo = {
    async findByDateRange(start, end) {
      return purchases.filter(p => p.date >= start && p.date <= end)
    },
    async count() { return purchases.length }
  }

  const productRepo = {
    async findAll() { return products.map(p => ({ ...p })) },
    async count() { return products.length }
  }

  const customerRepo = {
    async count() { return 5 }
  }

  const supplierRepo = {
    async count() { return 3 }
  }

  const inventoryRepo = {
    stocks: { 1: 10, 2: 2, 3: 0 },
    async getStockByProduct(id) { return this.stocks[id] || 0 }
  }

  return { saleRepo, purchaseRepo, productRepo, customerRepo, supplierRepo, inventoryRepo, sales, purchases, products }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testGetSalesReport() {
  const mocks = createMocks()
  const service = new ReportService(mocks.saleRepo, mocks.purchaseRepo, mocks.productRepo, mocks.customerRepo, mocks.supplierRepo, mocks.inventoryRepo)

  const report = await service.getSalesReport('2026-07-01', '2026-07-31')

  assert(report.items.length === 2, 'getSalesReport debería retornar 2 ventas en julio')
  assert(report.summary.total === 2, 'total debería ser 2')
  assert(report.summary.completed === 2, 'completed debería ser 2')
  assert(report.summary.cancelled === 0, 'cancelled debería ser 0')
  assert(report.summary.totalAmount === 354, `totalAmount debería ser 354, fue ${report.summary.totalAmount}`)

  console.log('  ✓ testGetSalesReport')
}

async function testGetSalesReportEmpty() {
  const mocks = createMocks()
  const service = new ReportService(mocks.saleRepo, mocks.purchaseRepo, mocks.productRepo, mocks.customerRepo, mocks.supplierRepo, mocks.inventoryRepo)

  const report = await service.getSalesReport('2025-01-01', '2025-01-31')

  assert(report.items.length === 0, 'getSalesReport sin datos debería retornar 0 items')
  assert(report.summary.total === 0, 'total debería ser 0')

  console.log('  ✓ testGetSalesReportEmpty')
}

async function testGetPurchasesReport() {
  const mocks = createMocks()
  const service = new ReportService(mocks.saleRepo, mocks.purchaseRepo, mocks.productRepo, mocks.customerRepo, mocks.supplierRepo, mocks.inventoryRepo)

  const report = await service.getPurchasesReport('2026-07-01', '2026-07-31')

  assert(report.items.length === 2, 'getPurchasesReport debería retornar 2 compras en julio')
  assert(report.summary.total === 2, 'total debería ser 2')
  assert(report.summary.completed === 1, 'completed debería ser 1')
  assert(report.summary.cancelled === 1, 'cancelled debería ser 1')
  assert(report.summary.totalAmount === 354, `totalAmount debería ser 354, fue ${report.summary.totalAmount}`)

  console.log('  ✓ testGetPurchasesReport')
}

async function testGetStockReport() {
  const mocks = createMocks()
  const service = new ReportService(mocks.saleRepo, mocks.purchaseRepo, mocks.productRepo, mocks.customerRepo, mocks.supplierRepo, mocks.inventoryRepo)

  const report = await service.getStockReport()

  assert(report.items.length === 3, 'getStockReport debería retornar 3 productos')
  assert(report.summary.total === 3, 'total debería ser 3')

  const p1 = report.items.find(i => i.code === 'P001')
  assert(p1.status === 'ok', 'P001 con stock 10 y min 5 debería ser ok')

  const p2 = report.items.find(i => i.code === 'P002')
  assert(p2.status === 'low', 'P002 con stock 2 y min 5 debería ser low')

  const p3 = report.items.find(i => i.code === 'P003')
  assert(p3.status === 'critical', 'P003 con stock 0 debería ser critical')

  assert(report.summary.ok === 1, 'ok debería ser 1')
  assert(report.summary.low === 1, 'low debería ser 1')
  assert(report.summary.critical === 1, 'critical debería ser 1')

  console.log('  ✓ testGetStockReport')
}

async function testGetStockStatus() {
  const service = new ReportService(null, null, null, null, null, null)

  assert(service._getStockStatus(10, 5) === 'ok', 'stock > min debería ser ok')
  assert(service._getStockStatus(5, 5) === 'low', 'stock == min debería ser low')
  assert(service._getStockStatus(3, 5) === 'low', 'stock < min debería ser low')
  assert(service._getStockStatus(0, 5) === 'critical', 'stock == 0 debería ser critical')
  assert(service._getStockStatus(-1, 5) === 'critical', 'stock negativo debería ser critical')
  assert(service._getStockStatus(10, 0) === 'ok', 'stockMin == 0 debería ser ok')

  console.log('  ✓ testGetStockStatus')
}

async function testGetSummary() {
  const mocks = createMocks()
  const service = new ReportService(mocks.saleRepo, mocks.purchaseRepo, mocks.productRepo, mocks.customerRepo, mocks.supplierRepo, mocks.inventoryRepo)

  const summary = await service.getSummary()

  assert(summary.products === 3, 'products debería ser 3')
  assert(summary.customers === 5, 'customers debería ser 5')
  assert(summary.suppliers === 3, 'suppliers debería ser 3')
  assert(summary.sales === 3, 'sales debería ser 3')
  assert(summary.purchases === 2, 'purchases debería ser 2')

  console.log('  ✓ testGetSummary')
}

export async function runReportServiceTests() {
  console.log('\n--- ReportService Tests ---\n')

  await testGetSalesReport()
  await testGetSalesReportEmpty()
  await testGetPurchasesReport()
  await testGetStockReport()
  await testGetStockStatus()
  await testGetSummary()

  console.log('\n✓ Todos los tests de ReportService pasaron\n')
}
