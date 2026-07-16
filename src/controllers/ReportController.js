import { handleError } from '../utils/errors.js'

export class ReportController {
  constructor(reportService, reportView) {
    this._service = reportService
    this._view = reportView
  }

  async init(container) {
    this._view.render(container)
    this._view.onTabChange((tab) => this.handleTabChange(tab))
    this._view.onGenerateReport((tab, params) => this.handleGenerateReport(tab, params))
    await this.handleTabChange('sales')
  }

  async handleTabChange(tab) {
    this._view.showLoading()
    try {
      const summary = await this._service.getSummary()
      this._view.updateSummary(summary)
      this._view.updateActiveTab(tab)

      if (tab === 'stock') {
        await this._loadStockReport()
      } else {
        this._view.showDateInputs(true)
        const { startDate, endDate } = this._view.getDateRange()
        await this._loadTabReport(tab, startDate, endDate)
      }
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleGenerateReport(tab, params) {
    this._view.showLoading()
    try {
      switch (tab) {
        case 'sales': {
          const salesReport = await this._service.getSalesReport(params.startDate, params.endDate)
          this._view.renderSalesReport(salesReport)
          break
        }
        case 'purchases': {
          const purchasesReport = await this._service.getPurchasesReport(params.startDate, params.endDate)
          this._view.renderPurchasesReport(purchasesReport)
          break
        }
        case 'stock': {
          await this._loadStockReport()
          break
        }
      }
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async _loadStockReport() {
    const stockReport = await this._service.getStockReport()
    this._view.renderStockReport(stockReport)
    this._view.showDateInputs(false)
  }

  async _loadTabReport(tab, startDate, endDate) {
    if (tab === 'sales') {
      const report = await this._service.getSalesReport(startDate, endDate)
      this._view.renderSalesReport(report)
    } else if (tab === 'purchases') {
      const report = await this._service.getPurchasesReport(startDate, endDate)
      this._view.renderPurchasesReport(report)
    }
  }
}
