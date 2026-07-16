import { Product } from '../models/Product.js'

export class ProductRepository {
  constructor(db) {
    this.db = db
    this.table = db.products
  }

  async findAll() {
    const data = await this.table.orderBy('name').toArray()
    return data.map(Product.fromDB)
  }

  async findById(id) {
    const data = await this.table.get(id)
    return data ? Product.fromDB(data) : null
  }

  async findByCode(code) {
    const data = await this.table.where('code').equals(code).first()
    return data ? Product.fromDB(data) : null
  }

  async search(query) {
    const lower = query.toLowerCase()
    const all = await this.table.toArray()
    return all
      .filter(p =>
        p.name.toLowerCase().includes(lower) ||
        p.code.toLowerCase().includes(lower) ||
        p.category.toLowerCase().includes(lower)
      )
      .map(Product.fromDB)
  }

  async findByCategory(category) {
    const data = await this.table.where('category').equals(category).toArray()
    return data.map(Product.fromDB)
  }

  async findLowStock(threshold) {
    const data = await this.table.where('stock').belowOrEqual(threshold).toArray()
    return data.map(Product.fromDB)
  }

  async create(productData) {
    const product = new Product(productData)
    const validation = product.validate()
    if (!validation.valid) {
      throw new Error(`Datos de producto inválidos: ${validation.errors.join(', ')}`)
    }
    const existing = await this.findByCode(product.code)
    if (existing) {
      throw new Error(`Ya existe un producto con el código ${product.code}`)
    }
    const { id, ...data } = product.toJSON()
    delete data.id
    const newId = await this.table.add(data)
    return this.findById(newId)
  }

  async update(id, productData) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Producto con id ${id} no encontrado`)
    }
    const updated = { ...existing.toJSON(), ...productData, id, updatedAt: new Date().toISOString() }
    const product = new Product(updated)
    const validation = product.validate()
    if (!validation.valid) {
      throw new Error(`Datos de producto inválidos: ${validation.errors.join(', ')}`)
    }
    if (productData.code && productData.code !== existing.code) {
      const duplicate = await this.findByCode(productData.code)
      if (duplicate && duplicate.id !== id) {
        throw new Error(`Ya existe otro producto con el código ${productData.code}`)
      }
    }
    await this.table.put(product.toJSON())
    return this.findById(id)
  }

  async delete(id) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Producto con id ${id} no encontrado`)
    }
    await this.table.delete(id)
    return true
  }

  async count() {
    return this.table.count()
  }

  async generateNextCode() {
    const all = await this.table.toArray()
    let maxNum = 0
    for (const p of all) {
      const match = p.code?.match(/^PROD-(\d+)$/)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNum) maxNum = num
      }
    }
    return `PROD-${String(maxNum + 1).padStart(3, '0')}`
  }

  async updateStock(productId, quantity) {
    const product = await this.findById(productId)
    if (!product) throw new Error(`Producto con id ${productId} no encontrado`)
    const newStock = Math.max(0, product.stock + quantity)
    await this.table.put({ ...product.toJSON(), stock: newStock, updatedAt: new Date().toISOString() })
    return this.findById(productId)
  }
}
