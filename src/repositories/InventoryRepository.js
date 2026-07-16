import { InventoryMovement } from '../models/InventoryMovement.js'

export class InventoryRepository {
  constructor(db) {
    this.db = db
    this.table = db.inventoryMovements
  }

  async findAll() {
    const data = await this.table.orderBy('date').reverse().toArray()
    return data.map(InventoryMovement.fromDB)
  }

  async findById(id) {
    const data = await this.table.get(id)
    return data ? InventoryMovement.fromDB(data) : null
  }

  async findByProduct(productId) {
    const data = await this.table
      .where('productId')
      .equals(productId)
      .reverse()
      .toArray()
    return data.map(InventoryMovement.fromDB)
  }

  async create(movementData) {
    const movement = new InventoryMovement(movementData)
    const validation = movement.validate()
    if (!validation.valid) {
      throw new Error(`Datos de movimiento inválidos: ${validation.errors.join(', ')}`)
    }
    const { id, ...data } = movement.toJSON()
    delete data.id
    const newId = await this.table.add(data)
    return this.findById(newId)
  }

  async getStockByProduct(productId) {
    const movements = await this.table
      .where('productId')
      .equals(productId)
      .toArray()

    return movements.reduce((stock, m) => {
      const qty = m.quantity ?? 0
      if (m.type === 'entry' || m.type === 'purchase') return stock + Math.abs(qty)
      if (m.type === 'exit' || m.type === 'sale') return stock - Math.abs(qty)
      return stock + qty
    }, 0)
  }

  async getMovementsByDateRange(startDate, endDate) {
    const data = await this.table
      .where('date')
      .between(startDate, endDate, true, true)
      .reverse()
      .toArray()
    return data.map(InventoryMovement.fromDB)
  }

  async getStocksByProduct(productIds) {
    if (!productIds || productIds.length === 0) return {}
    const movements = await this.table
      .where('productId')
      .anyOf(productIds)
      .toArray()
    const stockMap = {}
    for (const productId of productIds) {
      stockMap[productId] = 0
    }
    for (const m of movements) {
      const qty = m.quantity ?? 0
      if (m.type === 'entry' || m.type === 'purchase') stockMap[m.productId] = (stockMap[m.productId] || 0) + Math.abs(qty)
      else if (m.type === 'exit' || m.type === 'sale') stockMap[m.productId] = (stockMap[m.productId] || 0) - Math.abs(qty)
      else stockMap[m.productId] = (stockMap[m.productId] || 0) + qty
    }
    return stockMap
  }

  async delete(id) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Movimiento con id ${id} no encontrado`)
    }
    await this.table.delete(id)
    return true
  }
}
