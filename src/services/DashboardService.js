export class DashboardService {
  constructor(saleRepository, purchaseRepository, productRepository, customerRepository, supplierRepository, inventoryRepository) {
    this._saleRepo = saleRepository
    this._purchaseRepo = purchaseRepository
    this._productRepo = productRepository
    this._customerRepo = customerRepository
    this._supplierRepo = supplierRepository
    this._inventoryRepo = inventoryRepository
  }

  async getKPIs() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString()

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

    const [
      products,
      customers,
      suppliers,
      todaySales,
      monthPurchases,
      lowStockProducts
    ] = await Promise.all([
      this._productRepo.findAll(),
      this._customerRepo.count(),
      this._supplierRepo.count(),
      this._saleRepo.findByDateRange(todayStr, tomorrowStr),
      this._purchaseRepo.findByDateRange(monthStart, tomorrowStr),
      this._findLowStock(),
    ])

    const todaySalesCompleted = todaySales.filter(s => s.status === 'completed')
    const todayRevenue = todaySalesCompleted.reduce((sum, s) => sum + s.total, 0)
    const todaySalesCount = todaySalesCompleted.length

    const monthPurchasesCompleted = monthPurchases.filter(p => p.status === 'completed')
    const monthPurchasesTotal = monthPurchasesCompleted.reduce((sum, p) => sum + p.total, 0)
    const monthPurchasesCount = monthPurchasesCompleted.length

    const lowStockCount = lowStockProducts.length
    const totalProducts = products.length

    return { todaySales: todaySalesCount, todayRevenue, monthPurchases: monthPurchasesCount, monthPurchasesTotal, totalProducts, totalCustomers: customers, totalSuppliers: suppliers, lowStock: lowStockCount, criticalStock: this._countCriticalStock(products) }
  }

  async getMonthlySales(monthsBack = 12) {
    const months = []
    const now = new Date()
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = d.toISOString()
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString()
      const sales = await this._saleRepo.findByDateRange(start, end)
      const completedSales = sales.filter(s => s.status === 'completed')
      const total = completedSales.reduce((sum, s) => sum + s.total, 0)
      months.push({
        label: d.toLocaleDateString('es-GT', { month: 'short', year: '2-digit' }),
        total: Math.round(total * 100) / 100
      })
    }
    return months
  }

  async getCategoryDistribution() {
    const products = await this._productRepo.findAll()
    const cats = {}
    for (const p of products) {
      const cat = p.category || 'Sin categoría'
      cats[cat] = (cats[cat] || 0) + 1
    }
    return Object.entries(cats).map(([label, count]) => ({ label, count }))
  }

  _countCriticalStock(products) {
    return products.filter(p => {
      const min = p.stockMin || 0
      return min > 0 && p.stock <= 0
    }).length
  }

  async _findLowStock() {
    const products = await this._productRepo.findAll()
    const result = []
    for (const product of products) {
      const stock = await this._inventoryRepo.getStockByProduct(product.id)
      const min = product.stockMin || 0
      if (min > 0 && stock <= min) {
        result.push({ ...product, calculatedStock: stock })
      }
    }
    return result
  }
}