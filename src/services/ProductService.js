export class ProductService {
  constructor(productRepository) {
    this._repository = productRepository
  }

  async getAll() {
    return this._repository.findAll()
  }

  async getById(id) {
    if (!id) throw new Error('El ID del producto es requerido')
    const product = await this._repository.findById(id)
    if (!product) throw new Error(`Producto con id ${id} no encontrado`)
    return product
  }

  async search(query) {
    const trimmed = query?.trim() ?? ''
    if (!trimmed) return this.getAll()
    return this._repository.search(trimmed)
  }

  async create(data) {
    const product = await this._repository.create(data)
    return product
  }

  async update(id, data) {
    if (!id) throw new Error('El ID del producto es requerido')
    const product = await this._repository.update(id, data)
    return product
  }

  async delete(id) {
    if (!id) throw new Error('El ID del producto es requerido')
    return this._repository.delete(id)
  }

  async getLowStock(threshold = 10) {
    return this._repository.findLowStock(threshold)
  }

  async getByCategory(category) {
    if (!category) throw new Error('La categoría es requerida')
    return this._repository.findByCategory(category)
  }
}
