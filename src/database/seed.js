const SEED_PRODUCTS = [
  { code: 'PROD-001', name: 'Laptop HP ProBook', category: 'Electrónica', purchasePrice: 450, salePrice: 650, stock: 15, stockMin: 5 },
  { code: 'PROD-002', name: 'Monitor Samsung 24"', category: 'Electrónica', purchasePrice: 120, salePrice: 180, stock: 25, stockMin: 10 },
  { code: 'PROD-003', name: 'Teclado Mecánico RGB', category: 'Periféricos', purchasePrice: 35, salePrice: 55, stock: 50, stockMin: 15 },
  { code: 'PROD-004', name: 'Mouse Inalámbrico Logitech', category: 'Periféricos', purchasePrice: 20, salePrice: 35, stock: 40, stockMin: 10 },
  { code: 'PROD-005', name: 'Webcam HD 1080p', category: 'Periféricos', purchasePrice: 25, salePrice: 45, stock: 30, stockMin: 10 },
  { code: 'PROD-006', name: 'Audífonos Bluetooth Sony', category: 'Audio', purchasePrice: 50, salePrice: 85, stock: 20, stockMin: 5 },
  { code: 'PROD-007', name: 'Cable HDMI 2m', category: 'Accesorios', purchasePrice: 5, salePrice: 12, stock: 100, stockMin: 30 },
  { code: 'PROD-008', name: 'Hub USB 4 Puertos', category: 'Accesorios', purchasePrice: 10, salePrice: 18, stock: 60, stockMin: 20 },
  { code: 'PROD-009', name: 'Silla Ergonómica', category: 'Muebles', purchasePrice: 150, salePrice: 250, stock: 8, stockMin: 3 },
  { code: 'PROD-010', name: 'Escritorio Eléctrico', category: 'Muebles', purchasePrice: 200, salePrice: 350, stock: 5, stockMin: 2 }
]

const SEED_CUSTOMERS = [
  { documentId: 'C001', name: 'Juan Pérez', email: 'juan@email.com', phone: '5555-0101', address: 'Av. Principal 123' },
  { documentId: 'C002', name: 'María García', email: 'maria@email.com', phone: '5555-0102', address: 'Calle Secundaria 456' },
  { documentId: 'C003', name: 'Carlos López', email: 'carlos@email.com', phone: '5555-0103', address: 'Blvd. Central 789' },
  { documentId: 'C004', name: 'Ana Martínez', email: 'ana@email.com', phone: '5555-0104', address: 'Plaza Mayor 321' },
  { documentId: 'C005', name: 'Pedro Ramírez', email: 'pedro@email.com', phone: '5555-0105', address: 'Calle Los Olivos 654' }
]

const SEED_SUPPLIERS = [
  { documentId: 'PROV-001', name: 'Distribuidora Tech S.A.', email: 'ventas@distitech.com', phone: '5555-1001', address: '8a. Calle 10-20, Zona 12' },
  { documentId: 'PROV-002', name: 'Importaciones Globales, S.A.', email: 'info@importglobal.com', phone: '5555-1002', address: '1a. Avenida 5-30, Zona 10' },
  { documentId: 'PROV-003', name: 'Suministros Office S.A.', email: 'pedidos@suministros.com', phone: '5555-1003', address: '7a. Avenida 15-45, Zona 13' }
]

const SEED_ACCOUNTS = [
  { code: '1101', name: 'Caja y Bancos', type: 'asset', description: 'Efectivo y cuentas bancarias' },
  { code: '1201', name: 'Inventario', type: 'asset', description: 'Inventario de productos para la venta' },
  { code: '2101', name: 'IVA por Pagar', type: 'liability', description: 'Impuesto al Valor Agregado por pagar' },
  { code: '2102', name: 'Proveedores', type: 'liability', description: 'Obligaciones con proveedores' },
  { code: '3101', name: 'Capital Social', type: 'equity', description: 'Aportes de capital de los accionistas' },
  { code: '4101', name: 'Ventas', type: 'income', description: 'Ingresos por ventas de productos' },
  { code: '5101', name: 'Costo de Ventas', type: 'expense', description: 'Costo directo de productos vendidos' }
]

const SEED_SETTINGS = [
  { key: 'business_name', value: 'Mi Empresa S.A.' },
  { key: 'business_document', value: '12345678-9' },
  { key: 'business_address', value: '6a. Avenida 1-23, Zona 4' },
  { key: 'business_phone', value: '5555-0000' },
  { key: 'business_email', value: 'info@miempresa.com' },
  { key: 'tax_rate', value: '0.12' },
  { key: 'currency_symbol', value: 'Q ' }
]

const TAX_RATE = 0.12

function makeDate(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

export async function seedData(db) {
  const productCount = await db.products.count()
  if (productCount > 0) {
    const saleCount = await db.sales.count()
    if (saleCount === 0) {
      const allProducts = await db.products.toArray()
      const allCustomers = await db.customers.toArray()
      const allSuppliers = await db.suppliers.toArray()
      const pIds = allProducts.map(p => p.id)
      const cIds = allCustomers.map(c => c.id)
      const sIds = allSuppliers.map(s => s.id)
      await seedTransactions(db, pIds, cIds, sIds)
    }
    return
  }

  await db.transaction('rw', db.products, db.customers, db.suppliers, db.settings,
    db.inventoryMovements, db.accounts, db.sales, db.saleItems, db.purchases,
    db.purchaseItems, db.accountingEntries, async () => {

    const stockTracker = {}
    const productIds = []
    for (const product of SEED_PRODUCTS) {
      const id = await db.products.add({ ...product, active: true })
      productIds.push(id)
      stockTracker[id] = 0
      const stockBefore = 0
      const stockAfter = product.stock
      stockTracker[id] = stockAfter
      await db.inventoryMovements.add({
        productId: id,
        productName: product.name,
        type: 'entry',
        quantity: product.stock,
        stockBefore,
        stockAfter,
        reference: 'initial',
        notes: 'Stock inicial',
        date: makeDate(10)
      })
    }

    const customerIds = []
    for (const customer of SEED_CUSTOMERS) {
      const id = await db.customers.add({ ...customer, active: true })
      customerIds.push(id)
    }

    const supplierIds = []
    for (const supplier of SEED_SUPPLIERS) {
      const id = await db.suppliers.add(supplier)
      supplierIds.push(id)
    }

    for (const setting of SEED_SETTINGS) {
      await db.settings.add(setting)
    }

    for (const account of SEED_ACCOUNTS) {
      await db.accounts.add({ ...account, active: true })
    }

    const accounts = {}
    for (const a of SEED_ACCOUNTS) {
      const acc = await db.accounts.where('code').equals(a.code).first()
      accounts[a.code] = acc
    }

    await seedTransactions(db, productIds, customerIds, supplierIds, accounts, stockTracker)
  })
}

async function seedTransactions(db, productIds, customerIds, supplierIds, accounts, stockTracker) {
  if (!stockTracker) {
    stockTracker = {}
    const allProducts = await db.products.toArray()
    for (const p of allProducts) {
      stockTracker[p.id] = p.stock || 0
    }
  }

  if (!accounts) {
    accounts = {}
    const allAccounts = await db.accounts.toArray()
    for (const a of allAccounts) {
      accounts[a.code] = a
    }
  }

  await db.transaction('rw', db.sales, db.saleItems, db.purchases, db.purchaseItems,
    db.inventoryMovements, db.accountingEntries, async () => {

    const PRODUCT_COST = {
      [productIds[0]]: 450,
      [productIds[1]]: 120,
      [productIds[2]]: 35,
      [productIds[3]]: 20,
      [productIds[4]]: 25,
      [productIds[5]]: 50,
      [productIds[6]]: 5,
      [productIds[7]]: 10,
      [productIds[8]]: 150,
      [productIds[9]]: 200
    }

    const saleData = [
      {
        date: makeDate(1),
        customerId: customerIds[0],
        customerName: 'Juan Pérez',
        items: [
          { productId: productIds[0], productCode: 'PROD-001', productName: 'Laptop HP ProBook', quantity: 2, unitPrice: 650 },
          { productId: productIds[2], productCode: 'PROD-003', productName: 'Teclado Mecánico RGB', quantity: 3, unitPrice: 55 }
        ]
      },
      {
        date: makeDate(3),
        customerId: customerIds[1],
        customerName: 'María García',
        items: [
          { productId: productIds[1], productCode: 'PROD-002', productName: 'Monitor Samsung 24"', quantity: 1, unitPrice: 180 },
          { productId: productIds[3], productCode: 'PROD-004', productName: 'Mouse Inalámbrico Logitech', quantity: 1, unitPrice: 35 }
        ]
      }
    ]

    for (const s of saleData) {
      const subtotal = s.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
      const tax = Math.round(subtotal * TAX_RATE * 100) / 100
      const total = subtotal + tax
      const totalCost = s.items.reduce((sum, i) => sum + (PRODUCT_COST[i.productId] || 0) * i.quantity, 0)

      const saleId = await db.sales.add({
        customerId: s.customerId,
        customerName: s.customerName,
        date: s.date,
        subtotal,
        tax,
        total,
        status: 'completed',
        notes: '',
        createdAt: s.date,
        updatedAt: s.date
      })

      for (let i = 0; i < s.items.length; i++) {
        const item = s.items[i]
        const qty = -item.quantity
        await db.saleItems.add({ ...item, saleId, subtotal: item.quantity * item.unitPrice })
        const stockBefore = stockTracker[item.productId]
        const stockAfter = Math.max(0, stockBefore + qty)
        stockTracker[item.productId] = stockAfter
        await db.inventoryMovements.add({
          productId: item.productId,
          productName: item.productName,
          type: 'sale',
          quantity: qty,
          stockBefore,
          stockAfter,
          reference: 'sale',
          referenceId: saleId,
          notes: `Venta #${saleId}`,
          date: s.date
        })
        await db.products.update(item.productId, { stock: stockAfter })
      }

      await db.accountingEntries.add({
        date: s.date,
        description: `Venta #${saleId}`,
        referenceType: 'sale',
        referenceId: saleId,
        items: [
          { accountId: accounts['1101'].id, accountCode: '1101', accountName: 'Caja y Bancos', debit: total, credit: 0 },
          { accountId: accounts['4101'].id, accountCode: '4101', accountName: 'Ventas', debit: 0, credit: subtotal },
          { accountId: accounts['2101'].id, accountCode: '2101', accountName: 'IVA por Pagar', debit: 0, credit: tax },
          { accountId: accounts['5101'].id, accountCode: '5101', accountName: 'Costo de Ventas', debit: totalCost, credit: 0 },
          { accountId: accounts['1201'].id, accountCode: '1201', accountName: 'Inventario', debit: 0, credit: totalCost }
        ]
      })
    }

    const purchaseData = [
      {
        date: makeDate(5),
        supplierId: supplierIds[0],
        supplierName: 'Distribuidora Tech S.A.',
        items: [
          { productId: productIds[0], productCode: 'PROD-001', productName: 'Laptop HP ProBook', quantity: 5, unitPrice: 450 },
          { productId: productIds[1], productCode: 'PROD-002', productName: 'Monitor Samsung 24"', quantity: 10, unitPrice: 120 }
        ]
      },
      {
        date: makeDate(7),
        supplierId: supplierIds[1],
        supplierName: 'Importaciones Globales, S.A.',
        items: [
          { productId: productIds[2], productCode: 'PROD-003', productName: 'Teclado Mecánico RGB', quantity: 20, unitPrice: 35 },
          { productId: productIds[3], productCode: 'PROD-004', productName: 'Mouse Inalámbrico Logitech', quantity: 30, unitPrice: 20 }
        ]
      }
    ]

    for (const p of purchaseData) {
      const subtotal = p.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
      const tax = Math.round(subtotal * TAX_RATE * 100) / 100
      const total = subtotal + tax

      const purchaseId = await db.purchases.add({
        supplierId: p.supplierId,
        supplierName: p.supplierName,
        date: p.date,
        subtotal,
        tax,
        total,
        status: 'completed',
        notes: '',
        createdAt: p.date,
        updatedAt: p.date
      })

      for (const item of p.items) {
        await db.purchaseItems.add({ ...item, purchaseId, subtotal: item.quantity * item.unitPrice })
        const stockBefore = stockTracker[item.productId]
        const stockAfter = stockBefore + item.quantity
        stockTracker[item.productId] = stockAfter
        await db.inventoryMovements.add({
          productId: item.productId,
          productName: item.productName,
          type: 'purchase',
          quantity: item.quantity,
          stockBefore,
          stockAfter,
          reference: 'purchase',
          referenceId: purchaseId,
          notes: `Compra #${purchaseId}`,
          date: p.date
        })
        await db.products.update(item.productId, { stock: stockAfter })
      }

      await db.accountingEntries.add({
        date: p.date,
        description: `Compra #${purchaseId}`,
        referenceType: 'purchase',
        referenceId: purchaseId,
        items: [
          { accountId: accounts['1201'].id, accountCode: '1201', accountName: 'Inventario', debit: subtotal, credit: 0 },
          { accountId: accounts['2101'].id, accountCode: '2101', accountName: 'IVA por Pagar', debit: tax, credit: 0 },
          { accountId: accounts['2102'].id, accountCode: '2102', accountName: 'Proveedores', debit: 0, credit: total }
        ]
      })
    }
  })
}
