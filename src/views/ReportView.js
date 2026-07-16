import { Toast } from '../components/Toast.js'
import { Loader } from '../components/Loader.js'
import { ReportSalesView } from './ReportSalesView.js'
import { ReportPurchasesView } from './ReportPurchasesView.js'
import { ReportStockView } from './ReportStockView.js'

export class ReportView {
  constructor() {
    this._container = null
    this._loader = new Loader({ message: 'Generando reporte...' })
    this._onTabChangeCb = null
    this._onGenerateReportCb = null
    this._activeTab = 'sales'
    this._salesView = new ReportSalesView()
    this._purchasesView = new ReportPurchasesView()
    this._stockView = new ReportStockView()
  }

  render(container) {
    this._container = container
    this._resultsContainer = null
    container.innerHTML = ''

    const toolbar = document.createElement('div')
    toolbar.className = 'toolbar'

    const title = document.createElement('h2')
    title.className = 'toolbar__title'
    title.textContent = 'Reportes'

    toolbar.appendChild(title)
    container.appendChild(toolbar)

    const summaryCard = document.createElement('div')
    summaryCard.className = 'report-summary'
    summaryCard.id = 'report-summary'
    container.appendChild(summaryCard)

    const tabs = document.createElement('div')
    tabs.className = 'report-tabs'
    tabs.id = 'report-tabs'

    const tabLabels = [
      { id: 'sales', label: 'Ventas' },
      { id: 'purchases', label: 'Compras' },
      { id: 'stock', label: 'Stock' }
    ]

    for (const tab of tabLabels) {
      const btn = document.createElement('button')
      btn.className = 'report-tab'
      btn.dataset.tab = tab.id
      btn.textContent = tab.label
      btn.addEventListener('click', () => {
        if (this._onTabChangeCb) this._onTabChangeCb(tab.id)
      })
      tabs.appendChild(btn)
    }

    container.appendChild(tabs)

    const filters = document.createElement('div')
    filters.className = 'report-filters'
    filters.id = 'report-filters'

    const dateLabel = document.createElement('label')
    dateLabel.className = 'report-filters__label'
    dateLabel.textContent = 'Desde:'

    this._startDate = document.createElement('input')
    this._startDate.type = 'date'
    this._startDate.className = 'report-filters__input'
    this._startDate.value = this._getDefaultStartDate()

    const dateLabel2 = document.createElement('label')
    dateLabel2.className = 'report-filters__label'
    dateLabel2.textContent = 'Hasta:'

    this._endDate = document.createElement('input')
    this._endDate.type = 'date'
    this._endDate.className = 'report-filters__input'
    this._endDate.value = this._getDefaultEndDate()

    const generateBtn = document.createElement('button')
    generateBtn.className = 'btn btn--primary'
    generateBtn.textContent = 'Generar Reporte'
    generateBtn.addEventListener('click', () => this._generate())

    filters.append(dateLabel, this._startDate, dateLabel2, this._endDate, generateBtn)
    container.appendChild(filters)

    const results = document.createElement('div')
    results.className = 'report-results'
    results.id = 'report-results'
    container.appendChild(results)

    this._resultsContainer = results
  }

  _getResultsContainer() {
    return this._resultsContainer || document.getElementById('report-results')
  }

  updateSummary(summary) {
    const el = document.getElementById('report-summary')
    if (!el) return

    el.innerHTML = ''

    const cards = [
      { label: 'Productos', value: String(summary.products) },
      { label: 'Clientes', value: String(summary.customers) },
      { label: 'Proveedores', value: String(summary.suppliers) },
      { label: 'Ventas', value: String(summary.sales) },
      { label: 'Compras', value: String(summary.purchases) }
    ]

    for (const card of cards) {
      const div = document.createElement('div')
      div.className = 'report-summary__card'
      const val = document.createElement('span')
      val.className = 'report-summary__value'
      val.textContent = card.value
      const lbl = document.createElement('span')
      lbl.className = 'report-summary__label'
      lbl.textContent = card.label
      div.append(val, lbl)
      el.appendChild(div)
    }
  }

  updateActiveTab(tabId) {
    this._activeTab = tabId
    const tabs = document.querySelectorAll('.report-tab')
    for (const tab of tabs) {
      tab.classList.toggle('report-tab--active', tab.dataset.tab === tabId)
    }
  }

  showDateInputs(show) {
    const filters = document.getElementById('report-filters')
    if (filters) {
      filters.style.display = show ? '' : 'none'
    }
  }

  clearResults() {
    const el = this._getResultsContainer()
    if (el) el.innerHTML = ''
  }

  renderSalesReport(report) {
    const container = this._getResultsContainer()
    this._salesView.render(container, report)
  }

  renderPurchasesReport(report) {
    const container = this._getResultsContainer()
    this._purchasesView.render(container, report)
  }

  renderStockReport(report) {
    const container = this._getResultsContainer()
    this._stockView.render(container, report)
  }

  getDateRange() {
    return {
      startDate: this._startDate.value,
      endDate: this._endDate.value
    }
  }

  onTabChange(cb) {
    this._onTabChangeCb = cb
  }

  onGenerateReport(cb) {
    this._onGenerateReportCb = cb
  }

  _generate() {
    if (this._onGenerateReportCb) {
      this._onGenerateReportCb(this._activeTab, {
        startDate: this._startDate.value,
        endDate: this._endDate.value
      })
    }
  }

  _getDefaultStartDate() {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 1)
    return d.toISOString().split('T')[0]
  }

  _getDefaultEndDate() {
    return new Date().toISOString().split('T')[0]
  }

  showLoading() { this._loader.show() }
  hideLoading() { this._loader.hide() }

  showError(m) { Toast.error(m) }
}
