export class SupplierService {
  constructor(supplierRepository) {
    this._repository = supplierRepository
  }

  async getAll() {
    return this._repository.findAll()
  }

  async getById(id) {
    if (!id) throw new Error('El ID del proveedor es requerido')
    const supplier = await this._repository.findById(id)
    if (!supplier) throw new Error(`Proveedor con id ${id} no encontrado`)
    return supplier
  }

  async search(query) {
    const trimmed = query?.trim() ?? ''
    if (!trimmed) return this.getAll()
    return this._repository.search(trimmed)
  }

  async create(data) {
    return this._repository.create(data)
  }

  async update(id, data) {
    if (!id) throw new Error('El ID del proveedor es requerido')
    return this._repository.update(id, data)
  }

  async delete(id) {
    if (!id) throw new Error('El ID del proveedor es requerido')
    return this._repository.delete(id)
  }
}
