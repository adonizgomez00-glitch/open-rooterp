export class CustomerService {
  constructor(customerRepository) {
    this._repository = customerRepository
  }

  async getAll() {
    return this._repository.findAll()
  }

  async getById(id) {
    if (!id) throw new Error('El ID del cliente es requerido')
    const customer = await this._repository.findById(id)
    if (!customer) throw new Error(`Cliente con id ${id} no encontrado`)
    return customer
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
    if (!id) throw new Error('El ID del cliente es requerido')
    return this._repository.update(id, data)
  }

  async delete(id) {
    if (!id) throw new Error('El ID del cliente es requerido')
    return this._repository.delete(id)
  }
}
