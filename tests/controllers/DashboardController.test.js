import { DashboardController } from '../../src/controllers/DashboardController.js'

function createMockService() {
  return {
    async getKPIs() {
      return {
        todaySales: 3,
        todayRevenue: 450,
        monthPurchases: 5,
        monthPurchasesTotal: 1200,
        totalProducts: 10,
        totalCustomers: 8,
        totalSuppliers: 4,
        lowStock: 2,
        criticalStock: 1
      }
    },
    async getMonthlySales() {
      return [
        { label: 'ene 25', total: 100 },
        { label: 'feb 25', total: 200 }
      ]
    },
    async getCategoryDistribution() {
      return [
        { label: 'Electrónica', count: 5 },
        { label: 'Periféricos', count: 3 }
      ]
    }
  }
}

function createMockView() {
  return {
    rendered: false,
    kpisData: null,
    errorMessage: null,
    loadingState: false,
    refreshCb: null,

    render(container) {
      this.rendered = true
      this._container = container
    },

    renderKPIs(kpis) {
      this.kpisData = kpis
    },

    onRefresh(cb) {
      this.refreshCb = cb
    },

    showLoading() { this.loadingState = true },
    hideLoading() { this.loadingState = false },

    renderCharts() {},

    showError(msg) { this.errorMessage = msg }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testInitCallsRenderAndLoadsKPIs() {
  const service = createMockService()
  const view = createMockView()
  const controller = new DashboardController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.rendered, 'init debería llamar a view.render')
  assert(view.kpisData !== null, 'init debería cargar KPIs')
  assert(view.kpisData.todaySales === 3, 'init debería retornar todaySales correcto')
  assert(view.kpisData.totalProducts === 10, 'init debería retornar totalProducts correcto')

  console.log('  ✓ testInitCallsRenderAndLoadsKPIs')
}

async function testHandleRefreshReloadsKPIs() {
  const service = createMockService()
  const view = createMockView()
  const controller = new DashboardController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  view.kpisData = null
  await controller.handleRefresh()

  assert(view.kpisData !== null, 'refresh debería recargar KPIs')
  assert(view.kpisData.todayRevenue === 450, 'refresh debería retornar todayRevenue correcto')

  console.log('  ✓ testHandleRefreshReloadsKPIs')
}

async function testInitWithError() {
  const service = {
    async getKPIs() {
      throw new Error('Error al cargar KPIs')
    },
    async getMonthlySales() { return [] },
    async getCategoryDistribution() { return [] }
  }
  const view = createMockView()
  const controller = new DashboardController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.rendered, 'init debería llamar a view.render aunque falle')
  assert(view.errorMessage === 'Error al cargar KPIs', 'init debería mostrar error del servicio')

  console.log('  ✓ testInitWithError')
}

async function testInitRegistersOnRefresh() {
  const service = createMockService()
  const view = createMockView()
  const controller = new DashboardController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  assert(typeof view.refreshCb === 'function', 'init debería registrar callback onRefresh')

  console.log('  \u2713 testInitRegistersOnRefresh')
}

async function testHandleRefreshShowsAndHidesLoading() {
  const service = createMockService()
  const view = createMockView()
  const controller = new DashboardController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  view.loadingState = false
  await controller.handleRefresh()
  assert(view.loadingState === false, 'handleRefresh debería ocultar loading al finalizar')

  console.log('  \u2713 testHandleRefreshShowsAndHidesLoading')
}

async function testHandleRefreshRendersKPIs() {
  let kpisRendered = false
  const service = createMockService()
  const view = createMockView()
  view.renderKPIs = (kpis) => {
    kpisRendered = true
  }
  const controller = new DashboardController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleRefresh()
  assert(kpisRendered === true, 'handleRefresh debería renderizar KPIs')

  console.log('  \u2713 testHandleRefreshRendersKPIs')
}

async function testHandleRefreshWithError() {
  const service = {
    async getKPIs() {
      throw new Error('Error al refrescar')
    },
    async getMonthlySales() { return [] },
    async getCategoryDistribution() { return [] }
  }
  const view = createMockView()
  const controller = new DashboardController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  view.errorMessage = null
  await controller.handleRefresh()

  assert(view.errorMessage === 'Error al refrescar', 'handleRefresh con error debería mostrar error')
  assert(view.loadingState === false, 'handleRefresh debería ocultar loading incluso con error')

  console.log('  \u2713 testHandleRefreshWithError')
}

export async function runDashboardControllerTests() {
  console.log('\n--- DashboardController Tests ---\n')

  await testInitCallsRenderAndLoadsKPIs()
  await testInitRegistersOnRefresh()
  await testInitWithError()
  await testHandleRefreshReloadsKPIs()
  await testHandleRefreshShowsAndHidesLoading()
  await testHandleRefreshRendersKPIs()
  await testHandleRefreshWithError()

  console.log('\n\u2713 Todos los tests de DashboardController pasaron\n')
}