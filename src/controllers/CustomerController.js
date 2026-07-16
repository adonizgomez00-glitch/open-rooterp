import { handleError } from '../utils/errors.js'

export class CustomerController {
  constructor(customerService, customerView, customerRepo) {
    this._service = customerService
    this._view = customerView
    this._repo = customerRepo
    this._editingId = null
  }

  async init(container) {
    this._view.render(container)
    this._view.onSearch((query) => this.handleSearch(query))
    this._view.onCreate(() => this.showCreateForm())
    this._view.onEdit((id) => this.showEditForm(id))
    this._view.onDelete((id) => this.handleDelete(id))
    await this.loadCustomers()
  }

  async loadCustomers() {
    this._view.showLoading()
    try {
      const customers = await this._service.getAll()
      this._view.renderCustomers(customers)
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleSearch(query) {
    this._view.showLoading()
    try {
      const customers = await this._service.search(query)
      this._view.renderCustomers(customers)
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async showCreateForm() {
    this._editingId = null
    this._view.nextDocId = await this._repo.generateNextDocumentId()
    this._view.showForm(null, async (data) => this.handleSave(data), () => this._view.closeForm())
  }

  async showEditForm(id) {
    this._view.showLoading()
    try {
      const customer = await this._service.getById(id)
      this._editingId = id
      this._view.showForm(customer, async (data) => this.handleSave(data), () => this._view.closeForm())
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleSave(data) {
    this._view.showSaving()
    try {
      if (this._editingId) {
        const { documentId, ...rest } = data
        await this._service.update(this._editingId, rest)
        this._view.showSuccess('Cliente actualizado correctamente')
      } else {
        const documentId = await this._repo.generateNextDocumentId()
        await this._service.create({ ...data, documentId })
        this._view.showSuccess('Cliente creado correctamente')
      }
      this._view.closeForm()
      await this.loadCustomers()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideSaving()
    }
  }

  async handleDelete(id) {
    const confirmed = await this._view.confirmDelete()
    if (!confirmed) return

    this._view.showLoading()
    try {
      await this._service.delete(id)
      this._view.showSuccess('Cliente eliminado correctamente')
      await this.loadCustomers()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }
}
