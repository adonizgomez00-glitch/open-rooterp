export class ReportService {
  constructor(saleRepository, purchaseRepository, productRepository, customerRepository, supplierRepository, inventoryRepository) {
    this._saleRepo = saleRepository
    this._purchaseRepo = purchaseRepository
    this._productRepo = productRepository
    this._customerRepo = customerRepository
    this._supplierRepo = supplierRepository
    this._inventoryRepo = inventoryRepository
  }

  async getSalesReport(startDate, endDate) {
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

  async getPurchasesReport(startDate, endDate) {
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

  async getStockReport() {
    const products = await this._productRepo.findAll()
    const items = []

    for (const product of products) {
      const calculatedStock = await this._inventoryRepo.getStockByProduct(product.id)
      items.push({
        id: product.id,
        code: product.code,
        name: product.name,
        category: product.category,
        stock: calculatedStock,
        stockMin: product.stockMin,
        status: this._getStockStatus(calculatedStock, product.stockMin)
      })
    }

    items.sort((a, b) => a.name.localeCompare(b.name))

    const critical = items.filter(i => i.status === 'critical').length
    const low = items.filter(i => i.status === 'low').length
    const ok = items.filter(i => i.status === 'ok').length

    return {
      items,
      summary: { total: items.length, ok, low, critical }
    }
  }

  async getSummary() {
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
