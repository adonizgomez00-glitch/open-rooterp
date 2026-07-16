import { handleError } from '../utils/errors.js'

export class SaleController {
  constructor(saleService, saleView, productService, customerService, permissions = {}, accountingService = null) {
    this._service = saleService
    this._view = saleView
    this._productService = productService
    this._customerService = customerService
    this._permissions = permissions
    this._accountingService = accountingService
  }

  async init(container) {
    this._view.render(container, this._permissions)
    this._view.onNewSale(() => this.showNewSale())
    this._view.onViewDetail((id) => this.showDetail(id))
    this._view.onCancelSale((id) => this.handleCancel(id))
    this._view.onDeleteSale((id) => this.handleDelete(id))
    await this.loadSales()
  }

  async loadSales() {
    this._view.showLoading()
    try {
      const sales = await this._service.getAll()
      this._view.renderSales(sales)
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async showNewSale() {
    this._view.showLoading()
    try {
      const [customers, products] = await Promise.all([
        this._customerService.getAll(),
        this._productService.getAll()
      ])
      this._view.showNewSaleForm(customers, products, {
        onSubmit: (data) => this.handleCreate(data),
        onCancel: () => this._view.closeForm()
      })
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleCreate({ saleData, items }) {
    this._view.showSaving()
    try {
      const sale = await this._service.createSale(saleData, items)
      if (this._accountingService) {
        try {
          await this._accountingService.createSaleEntry(sale, items)
        } catch (acctError) {
          console.warn('No se pudo generar asiento contable:', acctError.message)
        }
      }
      this._view.showSuccess('Venta registrada correctamente')
      this._view.closeForm()
      await this.loadSales()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideSaving()
    }
  }

  async showDetail(id) {
    this._view.showLoading()
    try {
      const sale = await this._service.getById(id)
      this._view.showDetailModal(sale, () => this._view.closeDetailModal())
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleCancel(id) {
    if (this._permissions.canCancelSales === false) {
      this._view.showError('No tienes permiso para anular ventas')
      return
    }
    const confirmed = await this._view.confirmCancel()
    if (!confirmed) return

    this._view.showLoading()
    try {
      const sale = await this._service.getById(id)
      const items = sale.items || []
      await this._service.cancelSale(id)
      if (this._accountingService) {
        try {
          await this._accountingService.createCancelSaleEntry(sale, items)
        } catch (acctError) {
          console.warn('No se pudo generar asiento contable de anulación:', acctError.message)
        }
      }
      this._view.showSuccess('Venta anulada correctamente')
      await this.loadSales()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleDelete(id) {
    if (this._permissions.canDeleteSales === false) {
      this._view.showError('No tienes permiso para eliminar ventas')
      return
    }
    const confirmed = await this._view.confirmDelete()
    if (!confirmed) return

    this._view.showLoading()
    try {
      const sale = await this._service.getById(id)
      const items = sale.items || []
      await this._service.deleteSale(id)
      if (this._accountingService) {
        try {
          await this._accountingService.deleteEntryByReference('sale', id)
        } catch (acctError) {
          console.warn('No se pudo eliminar asiento contable:', acctError.message)
        }
      }
      this._view.showSuccess('Venta eliminada correctamente')
      await this.loadSales()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }
}
