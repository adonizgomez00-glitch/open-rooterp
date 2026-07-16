import { handleError } from '../utils/errors.js'

export class PurchaseController {
  constructor(purchaseService, purchaseView, productService, supplierService, permissions = {}, accountingService = null) {
    this._service = purchaseService
    this._view = purchaseView
    this._productService = productService
    this._supplierService = supplierService
    this._permissions = permissions
    this._accountingService = accountingService
  }

  async init(container) {
    this._view.render(container, this._permissions)
    this._view.onNewPurchase(() => this.showNewPurchase())
    this._view.onViewDetail((id) => this.showDetail(id))
    this._view.onCancelPurchase((id) => this.handleCancel(id))
    this._view.onDeletePurchase((id) => this.handleDelete(id))
    await this.loadPurchases()
  }

  async loadPurchases() {
    this._view.showLoading()
    try {
      const purchases = await this._service.getAll()
      this._view.renderPurchases(purchases)
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async showNewPurchase() {
    this._view.showLoading()
    try {
      const [suppliers, products] = await Promise.all([
        this._supplierService.getAll(),
        this._productService.getAll()
      ])
      this._view.showNewPurchaseForm(suppliers, products, {
        onSubmit: (data) => this.handleCreate(data),
        onCancel: () => this._view.closeForm()
      })
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleCreate({ purchaseData, items }) {
    this._view.showSaving()
    try {
      const purchase = await this._service.createPurchase(purchaseData, items)
      if (this._accountingService) {
        try {
          await this._accountingService.createPurchaseEntry(purchase, items)
        } catch (acctError) {
          console.warn('No se pudo generar asiento contable:', acctError.message)
        }
      }
      this._view.showSuccess('Compra registrada correctamente')
      this._view.closeForm()
      await this.loadPurchases()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideSaving()
    }
  }

  async showDetail(id) {
    this._view.showLoading()
    try {
      const purchase = await this._service.getById(id)
      this._view.showDetailModal(purchase, () => this._view.closeDetailModal())
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleCancel(id) {
    if (this._permissions.canCancelPurchases === false) {
      this._view.showError('No tienes permiso para anular compras')
      return
    }
    const confirmed = await this._view.confirmCancel()
    if (!confirmed) return

    this._view.showLoading()
    try {
      const purchase = await this._service.getById(id)
      const items = purchase.items || []
      await this._service.cancelPurchase(id)
      if (this._accountingService) {
        try {
          await this._accountingService.createCancelPurchaseEntry(purchase, items)
        } catch (acctError) {
          console.warn('No se pudo generar asiento contable de anulación:', acctError.message)
        }
      }
      this._view.showSuccess('Compra anulada correctamente')
      await this.loadPurchases()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleDelete(id) {
    if (this._permissions.canDeletePurchases === false) {
      this._view.showError('No tienes permiso para eliminar compras')
      return
    }
    const confirmed = await this._view.confirmDelete()
    if (!confirmed) return

    this._view.showLoading()
    try {
      const purchase = await this._service.getById(id)
      const items = purchase.items || []
      await this._service.deletePurchase(id)
      if (this._accountingService) {
        try {
          await this._accountingService.deleteEntryByReference('purchase', id)
        } catch (acctError) {
          console.warn('No se pudo eliminar asiento contable:', acctError.message)
        }
      }
      this._view.showSuccess('Compra eliminada correctamente')
      await this.loadPurchases()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }
}
