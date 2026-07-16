import { stripTags } from '../utils/sanitizer.js'

export class ImportService {
  constructor(productRepo, customerRepo, supplierRepo, settingRepo, saleRepo, purchaseRepo, inventoryRepo, reportRepo) {
    this._productRepo = productRepo
    this._customerRepo = customerRepo
    this._supplierRepo = supplierRepo
    this._settingRepo = settingRepo
    this._saleRepo = saleRepo
    this._purchaseRepo = purchaseRepo
    this._inventoryRepo = inventoryRepo
    this._reportRepo = reportRepo
  }

  static parseCSV(text) {
    if (!text || !text.trim()) return []
    const lines = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      if (ch === '"') {
        if (inQuotes && text[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
        current += ch
      } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
        if (current.trim()) {
          lines.push(current.trim())
        }
        current = ''
        if (ch === '\r' && text[i + 1] === '\n') i++
      } else {
        current += ch
      }
    }
    if (current.trim()) lines.push(current.trim())

    if (lines.length < 2) return []
    const headers = this._splitCSVLine(lines[0])
    const result = []
    for (let i = 1; i < lines.length; i++) {
      const values = this._splitCSVLine(lines[i])
      if (values.length === 0) continue
      if (values.length !== headers.length) continue
      const row = {}
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j] || ''
      }
      result.push(row)
    }
    return result
  }

  static _splitCSVLine(line) {
    const values = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    values.push(current.trim())
    return values.map(v => v.replace(/^"(.*)"$/, '$1'))
  }

  static parseJSON(text) {
    if (!text || !text.trim()) return []
    const data = JSON.parse(text)
    if (Array.isArray(data)) return data
    if (data && typeof data === 'object') {
      const keys = Object.keys(data)
      if (keys.length === 1 && Array.isArray(data[keys[0]])) {
        return data[keys[0]]
      }
      if (keys.length > 1 && keys.every(k => Array.isArray(data[k]))) {
        return data
      }
    }
    return []
  }

  static isFullExport(data) {
    return data && typeof data === 'object' && !Array.isArray(data)
  }

  async importFullExport(data) {
    const ENTITY_ORDER = ['settings', 'products', 'customers', 'suppliers', 'movements', 'sales', 'purchases']

    const results = {}
    let totalImported = 0

    for (const exportKey of ENTITY_ORDER) {
      const records = data[exportKey]
      if (records && records.length > 0) {
        const entityKey = exportKey === 'movements' ? 'inventory' : exportKey
        try {
          const result = await this.importData(entityKey, records)
          results[exportKey] = result
          totalImported += result.imported
        } catch (error) {
          results[exportKey] = { imported: 0, skipped: records.length, errors: [{ row: 0, message: error.message }] }
        }
      }
    }

    return { results, totalImported, entities: Object.keys(results) }
  }

  async importProducts(records) {
    const result = { imported: 0, skipped: 0, errors: [] }
    for (let i = 0; i < records.length; i++) {
      try {
        const record = this._sanitizeRecord(records[i])
        const name = record.name || record.nombre || record.productName || record['nombre producto'] || `Producto ${i + 1}`
        if (!name.trim()) {
          result.skipped++
          result.errors.push({ row: i + 1, message: 'El campo name es requerido' })
          continue
        }
        const code = record.code || record.codigo || record.sku || await this._productRepo.generateNextCode()
        const product = {
          code,
          name: name.trim(),
          description: record.description || record.descripcion || '',
          category: record.category || record.categoria || '',
          purchasePrice: Number(record.purchasePrice) || Number(record.precioCompra) || Number(record['precio compra']) || 0,
          salePrice: Number(record.salePrice) || Number(record.precioVenta) || Number(record['precio venta']) || 0,
          stock: Number(record.stock) || Number(record.existencia) || 0,
          stockMin: Number(record.stockMin) || Number(record.stockMinimo) || Number(record['stock minimo']) || 0
        }
        await this._productRepo.create(product)
        result.imported++
      } catch (error) {
        result.skipped++
        result.errors.push({ row: i + 1, message: error.message })
      }
    }
    return result
  }

  async importCustomers(records) {
    const result = { imported: 0, skipped: 0, errors: [] }
    for (let i = 0; i < records.length; i++) {
      try {
        const record = this._sanitizeRecord(records[i])
        const name = record.name || record.nombre || record.cliente || record.customer || record.razonSocial || ''
        if (!name.trim()) {
          result.skipped++
          result.errors.push({ row: i + 1, message: 'El campo name es requerido' })
          continue
        }
        const documentId = record.documentId || record.documento || record.nit || record.cui || record.dpi || record.ruc || record.dni || record.cedula || await this._customerRepo.generateNextDocumentId()
        const customer = {
          documentId,
          name: name.trim(),
          email: record.email || record.correo || record.mail || '',
          phone: record.phone || record.telefono || record.tel || '',
          address: record.address || record.direccion || ''
        }
        await this._customerRepo.create(customer)
        result.imported++
      } catch (error) {
        result.skipped++
        result.errors.push({ row: i + 1, message: error.message })
      }
    }
    return result
  }

  async importSuppliers(records) {
    const result = { imported: 0, skipped: 0, errors: [] }
    for (let i = 0; i < records.length; i++) {
      try {
        const record = this._sanitizeRecord(records[i])
        const name = record.name || record.nombre || record.proveedor || record.supplier || record.razonSocial || ''
        if (!name.trim()) {
          result.skipped++
          result.errors.push({ row: i + 1, message: 'El campo name es requerido' })
          continue
        }
        const documentId = record.documentId || record.documento || record.nit || record.cui || record.dpi || record.ruc || record.dni || record.cedula || await this._supplierRepo.generateNextDocumentId()
        const supplier = {
          documentId,
          name: name.trim(),
          email: record.email || record.correo || record.mail || '',
          phone: record.phone || record.telefono || record.tel || '',
          address: record.address || record.direccion || ''
        }
        await this._supplierRepo.create(supplier)
        result.imported++
      } catch (error) {
        result.skipped++
        result.errors.push({ row: i + 1, message: error.message })
      }
    }
    return result
  }

  async _resolveCustomer(customerId) {
    if (!customerId) return null
    const numId = Number(customerId)
    if (!isNaN(numId)) {
      const byId = await this._customerRepo.findById(numId)
      if (byId) return byId
    }
    return this._customerRepo.findByDocumentId(String(customerId).trim())
  }

  async _findOrCreateCustomerOcasional() {
    const customerName = 'Cliente ocasional'
    const existing = await this._customerRepo.findByDocumentId('C-OCASIONAL')
    if (existing) return existing
    return this._customerRepo.create({
      documentId: 'C-OCASIONAL',
      name: customerName,
      email: '',
      phone: '',
      address: ''
    })
  }

  async importSales(records) {
    const result = { imported: 0, skipped: 0, errors: [] }
    for (let i = 0; i < records.length; i++) {
      try {
        const record = this._sanitizeRecord(records[i])
        
        let customerRef = record.customerId || record.customer || record.cliente || record.documentoCliente
        let customer = null
        
        if (customerRef) {
          customer = await this._resolveCustomer(customerRef)
          if (!customer) {
            result.skipped++
            result.errors.push({ row: i + 1, message: `Cliente no encontrado: ${customerRef}` })
            continue
          }
        } else if (record.customerName) {
          customer = await this._findOrCreateCustomerOcasional()
        } else {
          throw new Error('El campo documentoCliente o customerId es requerido para ventas')
        }
        
        const date = record.date || record.fecha || new Date().toISOString()
        const existing = await this._saleRepo.findByCustomerAndDate(customer.id, date)
        if (existing) {
          result.skipped++
          result.errors.push({ row: i + 1, message: `Venta duplicada: ${customerRef || record.customerName} ${date}` })
          continue
        }
        
        const items = record.items || []
        await this._saleRepo.createWithItems({
          date,
          customerId: customer.id,
          status: record.status || 'completed',
          total: Number(record.total) || 0,
          tax: Number(record.tax) || 0
        }, items)
        
        result.imported++
      } catch (error) {
        result.skipped++
        result.errors.push({ row: i + 1, message: error.message })
      }
    }
    return result
  }

  async _resolveSupplier(supplierId) {
    if (!supplierId) return null
    const numId = Number(supplierId)
    if (!isNaN(numId)) {
      const byId = await this._supplierRepo.findById(numId)
      if (byId) return byId
    }
    return this._supplierRepo.findByDocumentId(String(supplierId).trim())
  }

  async importPurchases(records) {
    const result = { imported: 0, skipped: 0, errors: [] }
    for (let i = 0; i < records.length; i++) {
      try {
        const record = this._sanitizeRecord(records[i])
        
        if (!record.supplierId && !record.supplier && !record.proveedor && !record.documentoProveedor) {
          throw new Error('El campo documentoProveedor o supplierId es requerido para compras')
        }
        
        const supplierRef = record.supplierId || record.supplier || record.proveedor || record.documentoProveedor
        const supplier = await this._resolveSupplier(supplierRef)
        if (!supplier) {
          result.skipped++
          result.errors.push({ row: i + 1, message: `Proveedor no encontrado: ${supplierRef}` })
          continue
        }
        
        const date = record.date || record.fecha || new Date().toISOString()
        const existing = await this._purchaseRepo.findBySupplierAndDate(supplier.id, date)
        if (existing) {
          result.skipped++
          result.errors.push({ row: i + 1, message: `Compra duplicada: ${supplierRef} ${date}` })
          continue
        }
        
        const items = record.items || []
        await this._purchaseRepo.createWithItems({
          date,
          supplierId: supplier.id,
          status: record.status || 'completed',
          total: Number(record.total) || 0
        }, items)
        
        result.imported++
      } catch (error) {
        result.skipped++
        result.errors.push({ row: i + 1, message: error.message })
      }
    }
    return result
  }

  async _resolveProduct(productRef) {
    if (!productRef) return null
    const numId = Number(productRef)
    if (!isNaN(numId)) {
      const byId = await this._productRepo.findById(numId)
      if (byId) return byId
    }
    return this._productRepo.findByCode(String(productRef).trim())
  }

  async importInventory(records) {
    const result = { imported: 0, skipped: 0, errors: [] }
    for (let i = 0; i < records.length; i++) {
      try {
        const record = this._sanitizeRecord(records[i])
        
        if (!record.productId && !record.product && !record.articulo && !record.producto) {
          throw new Error('El campo producto, code o productId es requerido para inventario')
        }
        
        const productRef = record.productId || record.product || record.articulo || record.producto
        let product = await this._resolveProduct(productRef)
        if (!product && record.productName) {
          const allProducts = await this._productRepo.findAll()
          product = allProducts.find(p => p.name.toLowerCase() === String(record.productName).toLowerCase().trim()) || null
        }
        if (!product) {
          result.skipped++
          result.errors.push({ row: i + 1, message: `Producto no encontrado: ${productRef}` })
          continue
        }
        
        const type = record.type || record.tipo || 'entry'
        const quantity = Number(record.quantity) || Number(record.cantidad) || Number(record.amount) || 1
        const date = record.date || record.fecha || new Date().toISOString()
        
        await this._inventoryRepo.create({
          productId: product.id,
          productName: product.name,
          type,
          quantity,
          stockBefore: Number(record.stockBefore) || (product.stock || 0),
          stockAfter: Number(record.stockBefore || product.stock || 0) + (type === 'entry' || type === 'purchase' ? Math.abs(quantity) : -Math.abs(quantity)),
          date,
          reference: record.reference || '',
          notes: record.notes || ''
        })
        
        if (type === 'entry' || type === 'purchase') {
          await this._productRepo.updateStock(product.id, Math.abs(quantity))
        } else if (type === 'exit' || type === 'sale') {
          await this._productRepo.updateStock(product.id, -Math.abs(quantity))
        }
        
        result.imported++
      } catch (error) {
        result.skipped++
        result.errors.push({ row: i + 1, message: error.message })
      }
    }
    return result
  }

  async importSettings(records) {
    const result = { imported: 0, skipped: 0, errors: [] }
    for (let i = 0; i < records.length; i++) {
      try {
        const record = this._sanitizeRecord(records[i])
        
        if (!record.key || !record.key.trim()) {
          throw new Error('El campo key es requerido')
        }
        
        const key = record.key.trim()
        const value = record.value || ''
        
        await this._settingRepo.set(key, value)
        result.imported++
      } catch (error) {
        result.skipped++
        result.errors.push({ row: i + 1, message: error.message })
      }
    }
    return result
  }

  async importData(entity, records) {
    if (entity === 'auto') {
      if (records.length === 0) throw new Error('No data to auto-detect')
      const headers = Object.keys(records[0]).map(h => h.toLowerCase())

      const entityPatterns = {
        products: {
          patterns: ['name', 'code', 'producto', 'sku', 'descripcion', 'existencia', 'product', 'productname', 'nombreproducto', 'product_name'],
          strong: ['preciocompra', 'precioventa', 'purchaseprice', 'saleprice', 'stock', 'stockmin', 'stockminimo', 'category', 'categoria']
        },
        customers: {
          patterns: ['name', 'cliente', 'customer', 'razonsocial', 'nombrecliente', 'client'],
          strong: ['documentocliente', 'documento', 'nit', 'cui', 'dpi', 'ruc', 'dni', 'cedula', 'phone', 'telefono', 'address', 'direccion', 'email', 'correo', 'mail']
        },
        suppliers: {
          patterns: ['name', 'proveedor', 'supplier', 'razonsocial', 'nombreproveedor', 'nombproveedor'],
          strong: ['documentoproveedor', 'documento', 'nit', 'cui', 'dpi', 'ruc', 'dni', 'cedula', 'phone', 'telefono', 'address', 'direccion', 'email', 'correo', 'mail']
        },
        sales: {
          patterns: ['cliente', 'venta', 'customer', 'sale', 'customerid', 'fecha', 'customername'],
          strong: ['documentocliente', 'subtotal', 'total', 'tax', 'items', 'impuesto']
        },
        purchases: {
          patterns: ['proveedor', 'compra', 'supplier', 'purchase', 'supplierid', 'fecha', 'suppliername'],
          strong: ['documentoproveedor', 'subtotal', 'total', 'items', 'impuesto']
        },
        inventory: {
          patterns: ['tipo', 'type', 'articulo', 'cantidad', 'quantity', 'amount', 'movimiento', 'movement', 'productname', 'productid'],
          strong: ['stockbefore', 'stockafter', 'tipomovimiento', 'referencia', 'movementtype']
        },
        settings: {
          patterns: ['key', 'config', 'parametro', 'setting', 'clave'],
          strong: ['valor', 'value']
        }
      }

      const scores = {}
      let maxScore = 0
      let maxEntity = null

      for (const [entityType, config] of Object.entries(entityPatterns)) {
        let score = 0
        for (const pattern of config.patterns) {
          if (headers.some(h => h.includes(pattern))) {
            score += 1
          }
        }
        for (const pattern of config.strong) {
          if (headers.some(h => h.includes(pattern))) {
            score += 3
          }
        }
        scores[entityType] = score
        if (score > maxScore) {
          maxScore = score
          maxEntity = entityType
        }
      }

      if (maxEntity && maxScore > 0) {
        if (scores.customers === scores.suppliers && scores.customers === maxScore && maxScore > 0) {
          const hasCliente = headers.some(h => h.includes('cliente') || h === 'customer')
          const hasProveedor = headers.some(h => h.includes('proveedor') || h === 'supplier')
          if (hasProveedor && !hasCliente) {
            entity = 'suppliers'
          } else if (hasCliente && !hasProveedor) {
            entity = 'customers'
          } else {
            const firstRecord = records[0] || {}
            const docVal = (firstRecord.documentId || firstRecord.documento || '').toString().toUpperCase()
            if (docVal.startsWith('PROV-')) {
              entity = 'suppliers'
            } else if (docVal.startsWith('C') && !docVal.startsWith('CO')) {
              entity = 'customers'
            } else {
              throw new Error('No se pudo distinguir entre Clientes y Proveedores. Los encabezados coinciden con ambas entidades. Por favor seleccione la entidad manualmente.')
            }
          }
        } else if (scores.sales === scores.purchases && scores.sales === maxScore && maxScore > 0) {
          const hasVenta = headers.some(h => h.includes('venta') || h === 'sale' || h === 'customerid')
          const hasCompra = headers.some(h => h.includes('compra') || h === 'purchase' || h === 'supplierid')
          if (hasCompra && !hasVenta) {
            entity = 'purchases'
          } else if (hasVenta && !hasCompra) {
            entity = 'sales'
          } else {
            throw new Error('No se pudo distinguir entre Ventas y Compras. Los encabezados coinciden con ambas entidades. Por favor seleccione la entidad manualmente.')
          }
        } else if (maxScore === 1 && scores.customers === 1 && scores.suppliers === 1 && scores.products === 1) {
          entity = 'products'
        } else {
          entity = maxEntity
        }
      } else {
        throw new Error('No se pudo auto-detectar la entidad. Por favor seleccione una entidad manualmente.')
      }
    }
    
    switch (entity) {
      case 'products': return this.importProducts(records)
      case 'customers': return this.importCustomers(records)
      case 'suppliers': return this.importSuppliers(records)
      case 'settings':
      case 'config': return this.importSettings(records)
      case 'sales': return this.importSales(records)
      case 'purchases': return this.importPurchases(records)
      case 'inventory':
      case 'movements': return this.importInventory(records)
      default: throw new Error(`Entidad desconocida: ${entity}`)
    }
  }

  _sanitizeRecord(record) {
    if (!record || typeof record !== 'object') return {}
    const sanitized = {}
    for (const [key, value] of Object.entries(record)) {
      if (typeof value === 'string') {
        sanitized[key] = stripTags(value.trim())
      } else {
        sanitized[key] = value
      }
    }
    return sanitized
  }
}
