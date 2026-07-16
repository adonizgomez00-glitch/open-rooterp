import { Sale } from '../models/Sale.js'
import { SaleItem } from '../models/SaleItem.js'

export class SaleRepository {
  constructor(db) {
    this.db = db
    this.table = db.sales
    this.itemsTable = db.saleItems
  }

  async findAll() {
    const data = await this.table.orderBy('date').reverse().toArray()
    return data.map(Sale.fromDB)
  }

  async findById(id) {
    const data = await this.table.get(id)
    if (!data) return null
    const sale = Sale.fromDB(data)
    const items = await this.itemsTable.where('saleId').equals(id).toArray()
    sale.items = items.map(SaleItem.fromDB)
    return sale
  }

  async findByCustomerAndDate(customerId, date) {
    const endDate = date + '\uffff'
    const data = await this.table
      .where('[customerId+date]')
      .between([customerId, date], [customerId, endDate], true, true)
      .first()
    return data ? Sale.fromDB(data) : null
  }

  async createWithItems(saleData, itemsData) {
    const sale = new Sale(saleData)
    const saleValidation = sale.validate()
    if (!saleValidation.valid) {
      throw new Error(`Datos de venta inválidos: ${saleValidation.errors.join(', ')}`)
    }
    for (const itemData of itemsData) {
      const item = new SaleItem(itemData)
      const itemValidation = item.validate()
      if (!itemValidation.valid) {
        throw new Error(`Ítem inválido: ${itemValidation.errors.join(', ')}`)
      }
    }

    const { id, ...data } = sale.toJSON()
    delete data.id

    const newId = await this.db.transaction('rw', this.table, this.itemsTable, async () => {
      const saleId = await this.table.add(data)
      for (const itemData of itemsData) {
        await this.itemsTable.add({ ...itemData, saleId })
      }
      return saleId
    })

    return this.findById(newId)
  }

  async findByDateRange(startDate, endDate) {
    const data = await this.table
      .where('date')
      .between(startDate, endDate + 'T23:59:59.999Z', true, true)
      .reverse()
      .toArray()
    return data.map(Sale.fromDB)
  }

  async findByCustomer(customerId) {
    const data = await this.table
      .where('customerId')
      .equals(customerId)
      .reverse()
      .toArray()
    return data.map(Sale.fromDB)
  }

  async delete(id) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Venta con id ${id} no encontrada`)
    }
    await this.db.transaction('rw', this.table, this.itemsTable, async () => {
      await this.itemsTable.where('saleId').equals(id).delete()
      await this.table.delete(id)
    })
    return true
  }

  async count() {
    return this.table.count()
  }
}
