import { handleError } from '../utils/errors.js'

export class AccountingController {
  constructor(accountingService, accountingView) {
    this._service = accountingService
    this._view = accountingView
  }

  async init(container) {
    this._view.render(container)
    this._view.onTabChange((tab) => this.handleTabChange(tab))
    this._view.onCreateAccount((data) => this.handleCreateAccount(data))
    this._view.onEditAccount((id) => this.handleEditAccount(id))
    this._view.onUpdateAccount((id, data) => this.handleUpdateAccount(id, data))
    this._view.onDeleteAccount((id) => this.handleDeleteAccount(id))
    this._view.onGenerateReport((tab, params) => this.handleGenerateReport(tab, params))
    await this.handleTabChange('journal')
  }

  async handleTabChange(tab) {
    this._view.showLoading()
    try {
      this._view.updateActiveTab(tab)

      switch (tab) {
        case 'accounts':
          await this._loadAccounts()
          this._view.showDateInputs(false)
          break
        case 'journal':
          this._view.showDateInputs(true)
          const { startDate, endDate } = this._view.getDateRange()
          await this._loadJournal(startDate, endDate)
          break
        case 'balance':
          await this._loadBalanceSheet()
          this._view.showDateInputs(false)
          break
        case 'income':
          await this._loadIncomeStatement()
          this._view.showDateInputs(false)
          break
      }

      const summary = await this._service.getSummary()
      this._view.updateSummary(summary)
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
        case 'journal':
          await this._loadJournal(params.startDate, params.endDate)
          break
      }
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async _loadAccounts() {
    const accounts = await this._service.getAllAccounts()
    this._view.renderAccounts(accounts)
  }

  async _loadJournal(startDate, endDate) {
    let entries
    if (startDate && endDate) {
      entries = await this._service.getEntriesByDateRange(startDate, endDate)
    } else {
      entries = await this._service.getAllEntries()
    }
    this._view.renderJournal(entries)
  }

  async _loadBalanceSheet() {
    const report = await this._service.getBalanceSheet()
    this._view.renderBalanceSheet(report)
  }

  async _loadIncomeStatement() {
    const report = await this._service.getIncomeStatement()
    this._view.renderIncomeStatement(report)
  }

  async handleCreateAccount(data) {
    this._view.showSaving()
    try {
      await this._service.createAccount(data)
      this._view.showSuccess('Cuenta contable creada correctamente')
      this._view.closeAccountForm()
      await this._loadAccounts()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideSaving()
    }
  }

  async handleEditAccount(id) {
    this._view.showLoading()
    try {
      const account = await this._service.getAccountById(id)
      this._view.showAccountForm(account, async (data) => this.handleUpdateAccount(id, data), () => this._view.closeAccountForm())
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleUpdateAccount(id, data) {
    this._view.showSaving()
    try {
      await this._service.updateAccount(id, data)
      this._view.showSuccess('Cuenta contable actualizada correctamente')
      this._view.closeAccountForm()
      await this._loadAccounts()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideSaving()
    }
  }

  async handleDeleteAccount(id) {
    const confirmed = await this._view.confirmDelete()
    if (!confirmed) return

    this._view.showLoading()
    try {
      await this._service.deleteAccount(id)
      this._view.showSuccess('Cuenta contable eliminada correctamente')
      await this._loadAccounts()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }
}
