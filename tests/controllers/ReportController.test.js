import { ReportController } from '../../src/controllers/ReportController.js'

function createMockService() {
  return {
    async getSummary() {
      return { products: 10, customers: 5, suppliers: 3, sales: 20, purchases: 8 }
    },

    async getSalesReport(start, end) {
      return {
        items: [{ id: 1, date: '2026-07-01', customerName: 'Test', total: 118, status: 'completed' }],
        summary: { total: 1, completed: 1, cancelled: 0, totalAmount: 118, totalTax: 18 }
      }
    },

    async getPurchasesReport(start, end) {
      return {
        items: [{ id: 1, date: '2026-07-02', supplierName: 'Prov', total: 354, status: 'completed' }],
        summary: { total: 1, completed: 1, cancelled: 0, totalAmount: 354, totalTax: 54 }
      }
    },

    async getStockReport() {
      return {
        items: [
          { id: 1, code: 'P001', name: 'Producto 1', category: 'A', stock: 10, stockMin: 5, status: 'ok' }
        ],
        summary: { total: 1, ok: 1, low: 0, critical: 0 }
      }
    }
  }
}

function createMockView() {
  return {
    summaryData: null,
    activeTab: null,
    dateInputsVisible: true,
    resultsCleared: false,
    lastRendered: null,
    loadingState: false,
    errorMessage: null,

    reset() {
      this.summaryData = null
      this.activeTab = null
      this.dateInputsVisible = true
      this.resultsCleared = false
      this.lastRendered = null
      this.loadingState = false
      this.errorMessage = null
    },

    render(container) { this._container = container },

    updateSummary(summary) { this.summaryData = summary },

    updateActiveTab(tab) { this.activeTab = tab },

    showDateInputs(show) { this.dateInputsVisible = show },

    clearResults() { this.resultsCleared = true },

    getDateRange() { return { startDate: '2026-07-01', endDate: '2026-07-31' } },

    renderSalesReport(report) { this.lastRendered = 'sales' },
    renderPurchasesReport(report) { this.lastRendered = 'purchases' },
    renderStockReport(report) { this.lastRendered = 'stock' },

    showLoading() { this.loadingState = true },
    hideLoading() { this.loadingState = false },

    showError(msg) { this.errorMessage = msg },

    onTabChange(cb) { this._tabCb = cb },
    onGenerateReport(cb) { this._generateCb = cb }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testInitLoadsSalesTab() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ReportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.summaryData !== null, 'init debería cargar summary')
  assert(view.summaryData.products === 10, 'summary debería tener products')
  assert(view.activeTab === 'sales', 'init debería activar tab de ventas')

  console.log('  ✓ testInitLoadsSalesTab')
}

async function testTabChangeToStock() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ReportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  view.reset()
  await controller.handleTabChange('stock')

  assert(view.activeTab === 'stock', 'handleTabChange debería activar tab stock')
  assert(view.dateInputsVisible === false, 'stock tab debería ocultar date inputs')
  assert(view.lastRendered === 'stock', 'stock tab debería cargar reporte de stock')

  console.log('  ✓ testTabChangeToStock')
}

async function testGenerateSalesReport() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ReportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  view.reset()
  await controller.handleGenerateReport('sales', { startDate: '2026-07-01', endDate: '2026-07-31' })

  assert(view.lastRendered === 'sales', 'generate sales debería renderizar reporte de ventas')

  console.log('  ✓ testGenerateSalesReport')
}

async function testGeneratePurchasesReport() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ReportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  view.reset()
  await controller.handleGenerateReport('purchases', { startDate: '2026-07-01', endDate: '2026-07-31' })

  assert(view.lastRendered === 'purchases', 'generate purchases debería renderizar reporte de compras')

  console.log('  ✓ testGeneratePurchasesReport')
}

async function testGenerateStockReport() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ReportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  view.reset()
  await controller.handleGenerateReport('stock', {})

  assert(view.lastRendered === 'stock', 'generate stock debería renderizar reporte de stock')

  console.log('  ✓ testGenerateStockReport')
}

async function testHandleTabChangeError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ReportController(service, view)

  service.getSummary = async () => { throw new Error('Error al cargar resumen') }

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.errorMessage === 'Error al cargar resumen', 'handleTabChange debería mostrar error')

  console.log('  ✓ testHandleTabChangeError')
}

async function testHandleGenerateReportError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ReportController(service, view)

  service.getSalesReport = async () => { throw new Error('Error al generar reporte') }

  const container = document.createElement('div')
  await controller.init(container)

  view.reset()
  await controller.handleGenerateReport('sales', { startDate: '2026-07-01', endDate: '2026-07-31' })

  assert(view.errorMessage === 'Error al generar reporte', 'handleGenerateReport debería mostrar error')

  console.log('  ✓ testHandleGenerateReportError')
}

export async function runReportControllerTests() {
  console.log('\n--- ReportController Tests ---\n')

  await testInitLoadsSalesTab()
  await testTabChangeToStock()
  await testGenerateSalesReport()
  await testGeneratePurchasesReport()
  await testGenerateStockReport()
  await testHandleTabChangeError()
  await testHandleGenerateReportError()

  console.log('\n✓ Todos los tests de ReportController pasaron\n')
}
