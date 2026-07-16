import { handleError } from '../utils/errors.js'

export class InventoryController {
  constructor(inventoryService, inventoryView) {
    this._service = inventoryService
    this._view = inventoryView
  }

  async init(container) {
    this._view.render(container)
    this._view.onSearch((query) => this.handleSearch(query))
    this._view.onAdjust(() => this.showAdjustForm())
    this._view.onViewMovements((productId) => this.showMovements(productId))
    await this.loadStock()
  }

  async loadStock() {
    this._view.showLoading()
    try {
      const overview = await this._service.getStockOverview()
      this._view.renderStock(overview)
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleSearch(query) {
    this._view.showLoading()
    try {
      const overview = await this._service.getStockOverview()
      const filtered = overview.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.code.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
      )
      this._view.renderStock(filtered)
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  showAdjustForm() {
    this._view.showAdjustForm(async (data) => this.handleAdjust(data), () => this._view.closeForm())
  }

  async handleAdjust(data) {
    this._view.showSaving()
    try {
      await this._service.createAdjustment(data)
      this._view.showSuccess('Ajuste de stock registrado correctamente')
      this._view.closeForm()
      await this.loadStock()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideSaving()
    }
  }

  async showMovements(productId) {
    this._view.showLoading()
    try {
      const movements = await this._service.getMovementsByProduct(productId)
      const product = await this._service.getProductById(productId)
      this._view.showMovementsModal(product, movements, () => this._view.closeMovementsModal())
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }
}
