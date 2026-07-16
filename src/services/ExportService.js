export class ExportService {
  constructor(productRepo, customerRepo, supplierRepo, saleRepo, purchaseRepo, inventoryRepo, settingRepo) {
    this._productRepo = productRepo
    this._customerRepo = customerRepo
    this._supplierRepo = supplierRepo
    this._saleRepo = saleRepo
    this._purchaseRepo = purchaseRepo
    this._inventoryRepo = inventoryRepo
    this._settingRepo = settingRepo
  }

  async getAllData() {
    const [products, customers, suppliers, sales, purchases, movements, settings] = await Promise.all([
      this._productRepo.findAll(),
      this._customerRepo.findAll(),
      this._supplierRepo.findAll(),
      this._saleRepo.findAll(),
      this._purchaseRepo.findAll(),
      this._inventoryRepo.findAll(),
      this._settingRepo.findAll(),
    ])

    return { products, customers, suppliers, sales, purchases, movements, settings }
  }

  async getEntityData(entity) {
    switch (entity) {
      case 'products': return this._productRepo.findAll()
      case 'customers': return this._customerRepo.findAll()
      case 'suppliers': return this._supplierRepo.findAll()
      case 'sales': return this._saleRepo.findAll()
      case 'purchases': return this._purchaseRepo.findAll()
      case 'movements': return this._inventoryRepo.findAll()
      case 'settings': return this._settingRepo.findAll()
      default: throw new Error(`Entidad desconocida: ${entity}`)
    }
  }

  static toCSV(data) {
    if (!data || data.length === 0) return ''
    const headers = Object.keys(data[0])
    const lines = [headers.join(',')]
    for (const item of data) {
      const values = headers.map(h => {
        const val = item[h]
        if (val === null || val === undefined) return ''
        const str = String(val)
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return '"' + str.replace(/"/g, '""') + '"'
        }
        return str
      })
      lines.push(values.join(','))
    }
    return lines.join('\n')
  }

  static toJSON(data) {
    return JSON.stringify(data, null, 2)
  }

  static download(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}
