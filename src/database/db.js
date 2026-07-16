import Dexie from '../../assets/lib/dexie.js'

export const db = new Dexie('ERPLigero')

db.version(1).stores({
  products: '++id, &code, name, category, active, createdAt',
  customers: '++id, &documentId, name, email, active, createdAt',
  suppliers: '++id, &documentId, name, email, active, createdAt',
  sales: '++id, date, customerId, status, createdAt',
  saleItems: '++id, saleId, productId, [saleId+productId]',
  purchases: '++id, date, supplierId, status, createdAt',
  purchaseItems: '++id, purchaseId, productId, [purchaseId+productId]',
  inventoryMovements: '++id, productId, date, type, [productId+date]',
  settings: '++id, &key'
})

db.version(2).stores({
  products: '++id, &code, name, category, active, createdAt, updatedAt',
  customers: '++id, &documentId, name, email, phone, active, createdAt, updatedAt',
  suppliers: '++id, &documentId, name, email, phone, active, createdAt, updatedAt',
  sales: '++id, date, customerId, status, createdAt',
  saleItems: '++id, saleId, productId, [saleId+productId]',
  purchases: '++id, date, supplierId, status, createdAt',
  purchaseItems: '++id, purchaseId, productId, [purchaseId+productId]',
  inventoryMovements: '++id, productId, date, type, [productId+date]',
  settings: '++id, &key'
}).upgrade(async tx => {
  await tx.table('products').toCollection().modify(p => {
    p.updatedAt = p.updatedAt || p.createdAt
  })
  await tx.table('customers').toCollection().modify(c => {
    c.updatedAt = c.updatedAt || c.createdAt
    c.phone = c.phone || ''
  })
  await tx.table('suppliers').toCollection().modify(s => {
    s.updatedAt = s.updatedAt || s.createdAt
    s.phone = s.phone || ''
  })
})

db.version(3).stores({
  products: '++id, &code, name, category, active, createdAt, updatedAt',
  customers: '++id, &documentId, name, email, phone, active, createdAt, updatedAt',
  suppliers: '++id, &documentId, name, email, phone, active, createdAt, updatedAt',
  sales: '++id, date, customerId, status, createdAt, updatedAt',
  saleItems: '++id, saleId, productId, [saleId+productId]',
  purchases: '++id, date, supplierId, status, createdAt, updatedAt',
  purchaseItems: '++id, purchaseId, productId, [purchaseId+productId]',
  inventoryMovements: '++id, productId, date, type, reference, referenceId, [productId+date]',
  settings: '++id, &key'
}).upgrade(async tx => {
  await tx.table('sales').toCollection().modify(s => {
    s.updatedAt = s.updatedAt || s.createdAt
  })
  await tx.table('purchases').toCollection().modify(p => {
    p.updatedAt = p.updatedAt || p.createdAt
  })
  await tx.table('inventoryMovements').toCollection().modify(m => {
    m.reference = m.reference || ''
    m.referenceId = m.referenceId || 0
  })
})

db.version(4).stores({
  products: '++id, &code, name, category, active, createdAt, updatedAt',
  customers: '++id, &documentId, name, email, phone, active, createdAt, updatedAt',
  suppliers: '++id, &documentId, name, email, phone, active, createdAt, updatedAt',
  sales: '++id, date, customerId, status, createdAt, updatedAt',
  saleItems: '++id, saleId, productId, [saleId+productId]',
  purchases: '++id, date, supplierId, status, createdAt, updatedAt',
  purchaseItems: '++id, purchaseId, productId, [purchaseId+productId]',
  inventoryMovements: '++id, productId, date, type, reference, referenceId, [productId+date]',
  settings: '++id, &key',
  users: '++id, &username, roleId, active, createdAt, updatedAt',
  roles: '++id, &name, active, createdAt, updatedAt',
  permissions: '++id, &name, description, createdAt',
  rolePermissions: '++id, roleId, permissionId, [roleId+permissionId]',
  sessions: '++id, userId, &token, createdAt, expiresAt, lastAccess'
})

db.version(5).stores({
  products: '++id, &code, name, category, active, createdAt, updatedAt',
  customers: '++id, &documentId, name, email, phone, active, createdAt, updatedAt',
  suppliers: '++id, &documentId, name, email, phone, active, createdAt, updatedAt',
  sales: '++id, date, customerId, status, createdAt, updatedAt',
  saleItems: '++id, saleId, productId, [saleId+productId]',
  purchases: '++id, date, supplierId, status, createdAt, updatedAt',
  purchaseItems: '++id, purchaseId, productId, [purchaseId+productId]',
  inventoryMovements: '++id, productId, date, type, reference, referenceId, [productId+date]',
  settings: '++id, &key',
  users: '++id, &username, roleId, active, createdAt, updatedAt',
  roles: '++id, &name, active, createdAt, updatedAt',
  permissions: '++id, &name, description, createdAt',
  rolePermissions: '++id, roleId, permissionId, [roleId+permissionId]',
  sessions: '++id, userId, &token, createdAt, expiresAt, lastAccess',
  accounts: '++id, &code, name, type, active, createdAt, updatedAt',
  accountingEntries: '++id, date, description, referenceType, referenceId, createdAt'
})

db.version(6).stores({
  products: '++id, &code, name, category, active, createdAt, updatedAt',
  customers: '++id, &documentId, name, email, phone, active, createdAt, updatedAt',
  suppliers: '++id, &documentId, name, email, phone, active, createdAt, updatedAt',
  sales: '++id, date, customerId, status, createdAt, updatedAt',
  saleItems: '++id, saleId, productId, [saleId+productId]',
  purchases: '++id, date, supplierId, status, createdAt, updatedAt',
  purchaseItems: '++id, purchaseId, productId, [purchaseId+productId]',
  inventoryMovements: '++id, productId, date, type, reference, referenceId, [productId+date]',
  settings: '++id, &key',
  users: '++id, &username, roleId, active, createdAt, updatedAt',
  roles: '++id, &name, active, createdAt, updatedAt',
  permissions: '++id, &name, description, createdAt',
  rolePermissions: '++id, roleId, permissionId, [roleId+permissionId]',
  sessions: '++id, userId, &token, createdAt, expiresAt, lastAccess',
  accounts: '++id, &code, name, type, active, createdAt, updatedAt',
  accountingEntries: '++id, date, description, referenceType, referenceId, createdAt'
})

db.version(7).stores({
  products: '++id, &code, name, category, active, createdAt, updatedAt',
  customers: '++id, &documentId, name, email, phone, active, createdAt, updatedAt',
  suppliers: '++id, &documentId, name, email, phone, active, createdAt, updatedAt',
  sales: '++id, date, customerId, status, createdAt, updatedAt',
  saleItems: '++id, saleId, productId, [saleId+productId]',
  purchases: '++id, date, supplierId, status, createdAt, updatedAt',
  purchaseItems: '++id, purchaseId, productId, [purchaseId+productId]',
  inventoryMovements: '++id, productId, date, type, reference, referenceId, [productId+date]',
  settings: '++id, &key',
  users: '++id, &username, roleId, active, createdAt, updatedAt',
  roles: '++id, &name, active, createdAt, updatedAt',
  permissions: '++id, &name, description, createdAt',
  rolePermissions: '++id, roleId, permissionId, [roleId+permissionId]',
  sessions: '++id, userId, &token, createdAt, expiresAt, lastAccess',
  accounts: '++id, &code, name, type, active, createdAt, updatedAt',
  accountingEntries: '++id, date, description, referenceType, referenceId, createdAt'
}).upgrade(async tx => {
  const renames = {
    'Mercaderías': 'Inventario',
    'IGV por Pagar': 'IVA por Pagar',
    'Cuentas por Pagar': 'Proveedores',
    'Capital': 'Capital Social'
  }
  const mappedEntries = {
    'Mercaderías': 'Inventario',
    'IGV por Pagar': 'IVA por Pagar',
    'Cuentas por Pagar': 'Proveedores'
  }
  for (const [oldName, newName] of Object.entries(renames)) {
    const account = await tx.table('accounts').where('name').equals(oldName).first()
    if (account) {
      await tx.table('accounts').update(account.id, { name: newName })
    }
  }
  const entries = await tx.table('accountingEntries').toArray()
  for (const entry of entries) {
    if (entry.items) {
      let changed = false
      const newItems = entry.items.map(item => {
        const mapped = mappedEntries[item.accountName]
        if (mapped && mapped !== item.accountName) {
          changed = true
          return { ...item, accountName: mapped }
        }
        return item
      })
      if (changed) {
        await tx.table('accountingEntries').update(entry.id, { items: newItems })
      }
    }
  }
})

db.version(8).stores({
  products: '++id, &code, name, category, active, stock, createdAt, updatedAt',
  customers: '++id, &documentId, name, email, phone, active, createdAt, updatedAt',
  suppliers: '++id, &documentId, name, email, phone, active, createdAt, updatedAt',
  sales: '++id, date, customerId, status, createdAt, updatedAt, [customerId+date]',
  saleItems: '++id, saleId, productId, [saleId+productId]',
  purchases: '++id, date, supplierId, status, createdAt, updatedAt, [supplierId+date]',
  purchaseItems: '++id, purchaseId, productId, [purchaseId+productId]',
  inventoryMovements: '++id, productId, date, type, reference, referenceId, [productId+date]',
  settings: '++id, &key',
  users: '++id, &username, roleId, active, createdAt, updatedAt',
  roles: '++id, &name, active, createdAt, updatedAt',
  permissions: '++id, &name, description, createdAt',
  rolePermissions: '++id, roleId, permissionId, [roleId+permissionId]',
  sessions: '++id, userId, &token, createdAt, expiresAt, lastAccess',
  accounts: '++id, &code, name, type, active, createdAt, updatedAt',
  accountingEntries: '++id, date, description, referenceType, referenceId, createdAt, [referenceType+referenceId]'
})
