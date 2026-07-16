import { handleError } from '../utils/errors.js'

export class ProductController {
  constructor(productService, productView, productRepo) {
    this._service = productService
    this._view = productView
    this._repo = productRepo
    this._editingId = null
  }

  async init(container) {
    this._view.render(container)
    this._view.onSearch((query) => this.handleSearch(query))
    this._view.onCreate(() => this.showCreateForm())
    this._view.onEdit((id) => this.showEditForm(id))
    this._view.onDelete((id) => this.handleDelete(id))
    await this.loadProducts()
  }

  async loadProducts() {
    this._view.showLoading()
    try {
      const products = await this._service.getAll()
      this._view.renderProducts(products)
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleSearch(query) {
    this._view.showLoading()
    try {
      const products = await this._service.search(query)
      this._view.renderProducts(products)
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async showCreateForm() {
    this._editingId = null
    this._view.nextCode = await this._repo.generateNextCode()
    this._view.showForm(null, async (data) => this.handleSave(data), () => this._view.closeForm())
  }

  async showEditForm(id) {
    this._view.showLoading()
    try {
      const product = await this._service.getById(id)
      this._editingId = id
      this._view.showForm(product, async (data) => this.handleSave(data), () => this._view.closeForm())
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
        const { code, ...rest } = data
        await this._service.update(this._editingId, rest)
        this._view.showSuccess('Producto actualizado correctamente')
      } else {
        const code = await this._repo.generateNextCode()
        await this._service.create({ ...data, code })
        this._view.showSuccess('Producto creado correctamente')
      }
      this._view.closeForm()
      await this.loadProducts()
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
      this._view.showSuccess('Producto eliminado correctamente')
      await this.loadProducts()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }
}
