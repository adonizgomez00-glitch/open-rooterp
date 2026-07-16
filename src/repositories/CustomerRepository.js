import { Customer } from '../models/Customer.js'

export class CustomerRepository {
  constructor(db) {
    this.db = db
    this.table = db.customers
  }

  async findAll() {
    const data = await this.table.orderBy('name').toArray()
    return data.map(Customer.fromDB)
  }

  async findById(id) {
    const data = await this.table.get(id)
    return data ? Customer.fromDB(data) : null
  }

  async findByDocumentId(documentId) {
    const data = await this.table.where('documentId').equals(documentId).first()
    return data ? Customer.fromDB(data) : null
  }

  async search(query) {
    const lower = query.toLowerCase()
    const all = await this.table.toArray()
    return all
      .filter(c =>
        c.name.toLowerCase().includes(lower) ||
        c.documentId.toLowerCase().includes(lower) ||
        c.email.toLowerCase().includes(lower) ||
        c.phone.toLowerCase().includes(lower)
      )
      .map(Customer.fromDB)
  }

  async create(customerData) {
    const customer = new Customer(customerData)
    const validation = customer.validate()
    if (!validation.valid) {
      throw new Error(`Datos de cliente inválidos: ${validation.errors.join(', ')}`)
    }
    const existing = await this.findByDocumentId(customer.documentId)
    if (existing) {
      throw new Error(`Ya existe un cliente con el documento ${customer.documentId}`)
    }
    const { id, ...data } = customer.toJSON()
    delete data.id
    const newId = await this.table.add(data)
    return this.findById(newId)
  }

  async update(id, customerData) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Cliente con id ${id} no encontrado`)
    }
    const updated = { ...existing.toJSON(), ...customerData, id, updatedAt: new Date().toISOString() }
    const customer = new Customer(updated)
    const validation = customer.validate()
    if (!validation.valid) {
      throw new Error(`Datos de cliente inválidos: ${validation.errors.join(', ')}`)
    }
    if (customerData.documentId && customerData.documentId !== existing.documentId) {
      const duplicate = await this.findByDocumentId(customerData.documentId)
      if (duplicate && duplicate.id !== id) {
        throw new Error(`Ya existe otro cliente con el documento ${customerData.documentId}`)
      }
    }
    await this.table.put(customer.toJSON())
    return this.findById(id)
  }

  async delete(id) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Cliente con id ${id} no encontrado`)
    }
    await this.table.delete(id)
    return true
  }

  async count() {
    return this.table.count()
  }

  async generateNextDocumentId() {
    const all = await this.table.toArray()
    let maxNum = 0
    for (const c of all) {
      const match = c.documentId?.match(/^C(\d+)$/)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNum) maxNum = num
      }
    }
    return `C${String(maxNum + 1).padStart(3, '0')}`
  }
}
