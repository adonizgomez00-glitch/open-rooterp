import { handleError } from '../utils/errors.js'
import { setCurrencySymbol, setTaxRate } from '../utils/formatters.js'

export class SettingsController {
  constructor(settingService, settingsView, settingRepo) {
    this._service = settingService
    this._view = settingsView
    this._settingRepo = settingRepo
  }

  async init(container) {
    this._view.render(container)
    this._view.onSave((entries) => this.handleSave(entries))
    await this._loadSettings()
  }

  async handleSave(entries) {
    this._view.showSaving()
    try {
      await this._service.updateMany(entries)
      const currencySymbol = await this._settingRepo.get('currency_symbol')
      if (currencySymbol) setCurrencySymbol(currencySymbol)
      const taxRate = await this._settingRepo.get('tax_rate')
      if (taxRate) setTaxRate(taxRate)
      this._view.showSuccess('Configuración guardada correctamente')
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideSaving()
    }
  }

  async _loadSettings() {
    this._view.showLoading()
    try {
      const settings = await this._service.getAll()
      this._view.renderForm(settings)
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }
}
