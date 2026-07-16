import { SaleRepository } from './SaleRepository.js'
import { PurchaseRepository } from './PurchaseRepository.js'
import { ProductRepository } from './ProductRepository.js'
import { CustomerRepository } from './CustomerRepository.js'
import { SupplierRepository } from './SupplierRepository.js'
import { InventoryRepository } from './InventoryRepository.js'

export class ReportRepository {
  constructor(db) {
    this.db = db
    this._saleRepo = new SaleRepository(db)
    this._purchaseRepo = new PurchaseRepository(db)
    this._productRepo = new ProductRepository(db)
    this._customerRepo = new CustomerRepository(db)
    this._supplierRepo = new SupplierRepository(db)
    this._inventoryRepo = new InventoryRepository(db)
  }

  async generate(filter) {
    const { type, startDate, endDate } = filter

    switch (type) {
      case 'sales':
        return this._generateSalesReport(startDate, endDate)
      case 'purchases':
        return this._generatePurchasesReport(startDate, endDate)
      case 'stock':
        return this._generateStockReport()
      case 'summary':
        return this._generateSummary()
      default:
        throw new Error(`Tipo de reporte desconocido: ${type}`)
    }
  }

  async _generateSalesReport(startDate, endDate) {
    const sales = await this._saleRepo.findByDateRange(startDate, endDate)
    const completed = sales.filter(s => s.status === 'completed')
    const totalAmount = completed.reduce((sum, s) => sum + s.total, 0)
    const totalTax = completed.reduce((sum, s) => sum + s.tax, 0)

    return {
      items: sales,
      summary: {
        total: sales.length,
        completed: completed.length,
        cancelled: sales.filter(s => s.status === 'cancelled').length,
        totalAmount,
        totalTax
      }
    }
  }

  async _generatePurchasesReport(startDate, endDate) {
    const purchases = await this._purchaseRepo.findByDateRange(startDate, endDate)
    const completed = purchases.filter(p => p.status === 'completed')
    const totalAmount = completed.reduce((sum, p) => sum + p.total, 0)
    const totalTax = completed.reduce((sum, p) => sum + p.tax, 0)

    return {
      items: purchases,
      summary: {
        total: purchases.length,
        completed: completed.length,
        cancelled: purchases.filter(p => p.status === 'cancelled').length,
        totalAmount,
        totalTax
      }
    }
  }

  async _generateStockReport() {
    const products = await this._productRepo.findAll()
    const productIds = products.map(p => p.id)

    const stockMap = productIds.length > 0
      ? await this._inventoryRepo.getStocksByProduct(productIds)
      : {}

    const items = products.map(product => {
      const calculatedStock = stockMap[product.id] || 0
      return {
        id: product.id,
        code: product.code,
        name: product.name,
        category: product.category,
        stock: calculatedStock,
        stockMin: product.stockMin,
        status: this._getStockStatus(calculatedStock, product.stockMin)
      }
    })

    items.sort((a, b) => a.name.localeCompare(b.name))

    const critical = items.filter(i => i.status === 'critical').length
    const low = items.filter(i => i.status === 'low').length
    const ok = items.filter(i => i.status === 'ok').length

    return {
      items,
      summary: { total: items.length, ok, low, critical }
    }
  }

  async _generateSummary() {
    const [productCount, customerCount, supplierCount, saleCount, purchaseCount] = await Promise.all([
      this._productRepo.count(),
      this._customerRepo.count(),
      this._supplierRepo.count(),
      this._saleRepo.count(),
      this._purchaseRepo.count()
    ])

    return {
      products: productCount,
      customers: customerCount,
      suppliers: supplierCount,
      sales: saleCount,
      purchases: purchaseCount
    }
  }

  _getStockStatus(stock, stockMin) {
    if (stockMin <= 0) return 'ok'
    if (stock <= 0) return 'critical'
    if (stock <= stockMin) return 'low'
    return 'ok'
  }
}