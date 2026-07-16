import { Loader } from '../components/Loader.js'
import { Toast } from '../components/Toast.js'
import { AccountingAccountsView } from './AccountingAccountsView.js'
import { AccountingJournalView } from './AccountingJournalView.js'
import { AccountingBalanceView } from './AccountingBalanceView.js'
import { AccountingIncomeView } from './AccountingIncomeView.js'

export class AccountingView {
  constructor() {
    this._loader = new Loader({ message: 'Cargando...' })
    this._onTabChangeCb = null
    this._onCreateAccountCb = null
    this._onEditAccountCb = null
    this._onUpdateAccountCb = null
    this._onDeleteAccountCb = null
    this._onGenerateReportCb = null
    this._activeTab = 'journal'
    this._accountsView = new AccountingAccountsView()
    this._journalView = new AccountingJournalView()
    this._balanceView = new AccountingBalanceView()
    this._incomeView = new AccountingIncomeView()
  }

  render(container) {
    this._container = container
    this._resultsContainer = null
    container.innerHTML = ''

    const toolbar = document.createElement('div')
    toolbar.className = 'toolbar'

    const title = document.createElement('h2')
    title.className = 'toolbar__title'
    title.textContent = 'Contabilidad'

    toolbar.appendChild(title)
    container.appendChild(toolbar)

    const summaryCard = document.createElement('div')
    summaryCard.className = 'report-summary'
    summaryCard.id = 'acct-summary'
    container.appendChild(summaryCard)

    const tabs = document.createElement('div')
    tabs.className = 'report-tabs'
    tabs.id = 'acct-tabs'

    const tabLabels = [
      { id: 'journal', label: 'Libro Diario' },
      { id: 'accounts', label: 'Plan de Cuentas' },
      { id: 'balance', label: 'Balance General' },
      { id: 'income', label: 'Estado Resultados' }
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
    filters.id = 'acct-filters'

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
    generateBtn.textContent = 'Generar'
    generateBtn.addEventListener('click', () => this._generate())

    filters.append(dateLabel, this._startDate, dateLabel2, this._endDate, generateBtn)
    container.appendChild(filters)

    const results = document.createElement('div')
    results.className = 'report-results'
    results.id = 'acct-results'
    container.appendChild(results)

    this._resultsContainer = results
  }

  _getResultsContainer() {
    return this._resultsContainer || document.getElementById('acct-results')
  }

  updateSummary(summary) {
    const el = document.getElementById('acct-summary')
    if (!el) return
    el.innerHTML = ''

    const cards = [
      { label: 'Cuentas', value: String(summary.accounts) },
      { label: 'Asientos', value: String(summary.entries) }
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
    const filters = document.getElementById('acct-filters')
    if (filters) {
      filters.style.display = show ? '' : 'none'
    }
  }

  clearResults() {
    const el = this._getResultsContainer()
    if (el) el.innerHTML = ''
  }

  renderAccounts(accounts) {
    const container = this._getResultsContainer()
    this._accountsView.render(container, accounts, {
      onCreate: () => {
        this.showAccountForm(null,
          (data) => { if (this._onCreateAccountCb) this._onCreateAccountCb(data) },
          () => this.closeAccountForm())
      },
      onEdit: (id) => { if (this._onEditAccountCb) this._onEditAccountCb(id) },
      onDelete: (id) => { if (this._onDeleteAccountCb) this._onDeleteAccountCb(id) }
    })
  }

  showAccountForm(account, onSubmit, onCancel) {
    const container = this._getResultsContainer()
    this._accountsView.showForm(container, account, onSubmit, onCancel)
  }

  closeAccountForm() {
    this._accountsView.closeForm()
  }

  renderJournal(entries) {
    const container = this._getResultsContainer()
    this._journalView.render(container, entries)
  }

  renderBalanceSheet(report) {
    const container = this._getResultsContainer()
    this._balanceView.render(container, report)
  }

  renderIncomeStatement(report) {
    const container = this._getResultsContainer()
    this._incomeView.render(container, report)
  }

  getDateRange() {
    return {
      startDate: this._startDate.value,
      endDate: this._endDate.value
    }
  }

  onTabChange(cb) { this._onTabChangeCb = cb }
  onGenerateReport(cb) { this._onGenerateReportCb = cb }
  onCreateAccount(cb) { this._onCreateAccountCb = cb }
  onEditAccount(cb) { this._onEditAccountCb = cb }
  onUpdateAccount(cb) { this._onUpdateAccountCb = cb }
  onDeleteAccount(cb) { this._onDeleteAccountCb = cb }

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
  showSaving() { }
  hideSaving() { }

  showSuccess(message) { Toast.success(message) }
  showError(message) { Toast.error(message) }

  async confirmDelete() {
    return this._accountsView.confirmDelete()
  }
}
