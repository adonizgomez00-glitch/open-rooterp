import { Supplier } from '../models/Supplier.js'

export class SupplierRepository {
  constructor(db) {
    this.db = db
    this.table = db.suppliers
  }

  async findAll() {
    const data = await this.table.orderBy('name').toArray()
    return data.map(Supplier.fromDB)
  }

  async findById(id) {
    const data = await this.table.get(id)
    return data ? Supplier.fromDB(data) : null
  }

  async findByDocumentId(documentId) {
    const data = await this.table.where('documentId').equals(documentId).first()
    return data ? Supplier.fromDB(data) : null
  }

  async search(query) {
    const lower = query.toLowerCase()
    const all = await this.table.toArray()
    return all
      .filter(s =>
        s.name.toLowerCase().includes(lower) ||
        s.documentId.toLowerCase().includes(lower) ||
        s.email.toLowerCase().includes(lower)
      )
      .map(Supplier.fromDB)
  }

  async create(supplierData) {
    const supplier = new Supplier(supplierData)
    const validation = supplier.validate()
    if (!validation.valid) {
      throw new Error(`Datos de proveedor inválidos: ${validation.errors.join(', ')}`)
    }
    const existing = await this.findByDocumentId(supplier.documentId)
    if (existing) {
      throw new Error(`Ya existe un proveedor con el documento ${supplier.documentId}`)
    }
    const { id, ...data } = supplier.toJSON()
    delete data.id
    const newId = await this.table.add(data)
    return this.findById(newId)
  }

  async update(id, supplierData) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Proveedor con id ${id} no encontrado`)
    }
    const updated = { ...existing.toJSON(), ...supplierData, id, updatedAt: new Date().toISOString() }
    const supplier = new Supplier(updated)
    const validation = supplier.validate()
    if (!validation.valid) {
      throw new Error(`Datos de proveedor inválidos: ${validation.errors.join(', ')}`)
    }
    if (supplierData.documentId && supplierData.documentId !== existing.documentId) {
      const duplicate = await this.findByDocumentId(supplierData.documentId)
      if (duplicate && duplicate.id !== id) {
        throw new Error(`Ya existe otro proveedor con el documento ${supplierData.documentId}`)
      }
    }
    await this.table.put(supplier.toJSON())
    return this.findById(id)
  }

  async delete(id) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Proveedor con id ${id} no encontrado`)
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
    for (const s of all) {
      const match = s.documentId?.match(/^PROV-(\d+)$/)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNum) maxNum = num
      }
    }
    return `PROV-${String(maxNum + 1).padStart(3, '0')}`
  }
}
