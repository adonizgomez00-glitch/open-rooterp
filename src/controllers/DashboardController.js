import { handleError } from '../utils/errors.js'

export class DashboardController {
  constructor(dashboardService, dashboardView) {
    this._service = dashboardService
    this._view = dashboardView
  }

  async init(container) {
    this._view.render(container)
    this._view.onRefresh(() => this.handleRefresh())
    await this._loadKPIs()
  }

  async handleRefresh() {
    this._view.showLoading()
    await this._loadKPIs()
    this._view.hideLoading()
  }

  async _loadKPIs() {
    try {
      const [kpis, monthlySales, categoryDist] = await Promise.all([
        this._service.getKPIs(),
        this._service.getMonthlySales(),
        this._service.getCategoryDistribution()
      ])
      this._view.renderKPIs(kpis)
      this._view.renderCharts(monthlySales, categoryDist)
    } catch (error) {
      handleError(error, this._view)
    }
  }
}