export function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

export function createMockDB() {
  const stores = {}
  function makeStore() {
    const data = new Map()
    let nextId = 1
    const api = {
      async add(obj) { const autoId = nextId++; const stored = { id: autoId, ...obj }; data.set(stored.id, stored); return stored.id },
      async get(id) { const r = data.get(id); return r ? { ...r } : null },
      async put(obj) { if (obj.id) { data.set(obj.id, { id: obj.id, ...obj }); return obj.id } else { const autoId = nextId++; data.set(autoId, { id: autoId, ...obj }); return autoId } },
      async delete(id) { data.delete(id) },
      async update(id, changes) { const existing = data.get(id); if (existing) data.set(id, { ...existing, ...changes }) },
      async count() { return data.size },
      async toArray() { return [...data.values()].map(r => ({ ...r })) },
      orderBy() { return { reverse: () => ({ toArray: async () => [...data.values()].map(r => ({ ...r })) }) } },
      clear() { data.clear() },
      toCollection() { return { filter() { return { toArray: async () => [] } } } }
    }
    api.where = function where(field) {
      return {
        equals(val) {
          return {
            first: async () => { const match = [...data.values()].find(d => !field || d[field] === val); return match ? { ...match } : null },
            toArray: async () => [...data.values()].filter(d => !field || d[field] === val).map(r => ({ ...r })),
            delete: async () => { for (const [id, obj] of data) { if (!field || obj[field] === val) data.delete(id) } }
          }
        },
        between(lower, upper, incL, incU) {
          return { reverse: () => ({ toArray: async () => [...data.values()].filter(d => (incL ? d.date >= lower : d.date > lower) && (incU ? d.date <= upper : d.date < upper)).map(r => ({ ...r })) }) } }
      }
    }
    return api
  }
  const tableNames = ['products', 'customers', 'suppliers', 'sales', 'saleItems', 'purchases', 'purchaseItems', 'inventoryMovements', 'accounts', 'accountingEntries', 'settings']
  for (const name of tableNames) stores[name] = makeStore()
  stores.transaction = async (...args) => {
    const cb = typeof args[args.length - 1] === 'function' ? args.pop() : null
    if (typeof args[0] === 'function') return await args[0]()
    if (cb) return await cb()
  }
  return stores
}

export const SEED_ACCOUNTS = [
  { id: 1, code: '1101', name: 'Caja y Bancos', type: 'asset', active: true, description: '' },
  { id: 2, code: '1201', name: 'Inventario', type: 'asset', active: true, description: '' },
  { id: 3, code: '2101', name: 'IVA por Pagar', type: 'liability', active: true, description: '' },
  { id: 4, code: '2102', name: 'Proveedores', type: 'liability', active: true, description: '' },
  { id: 5, code: '3101', name: 'Capital Social', type: 'equity', active: true, description: '' },
  { id: 6, code: '4101', name: 'Ventas', type: 'income', active: true, description: '' },
  { id: 7, code: '5101', name: 'Costo de Ventas', type: 'expense', active: true, description: '' }
]

export async function seedAccounts(db) {
  for (const a of SEED_ACCOUNTS) {
    await db.accounts.add(a)
  }
}

export async function seedProduct(db, overrides = {}) {
  const id = await db.products.add({
    code: 'PROD-TEST-001', name: 'Producto Test 001', category: 'Test',
    purchasePrice: 50, salePrice: 100, stock: 10, stockMin: 2, active: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    ...overrides
  })
  const product = await db.products.get(id)
  const initialStock = product.stock || 0
  if (initialStock > 0) {
    await db.inventoryMovements.add({
      productId: product.id, productName: product.name,
      type: 'entry', quantity: initialStock,
      stockBefore: 0, stockAfter: initialStock,
      reference: 'initial', referenceId: 0,
      notes: 'Stock inicial', date: new Date().toISOString()
    })
  }
  return product
}

export async function seedCustomer(db) {
  const id = await db.customers.add({
    documentId: 'C001-TEST', name: 'Cliente Test', email: 'test@test.com',
    phone: '5555-0000', address: '', active: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  })
  return await db.customers.get(id)
}

export async function seedSupplier(db) {
  const id = await db.suppliers.add({
    documentId: 'PROV-TEST-001', name: 'Proveedor Test', email: 'prov@test.com',
    phone: '5555-0000', address: '', active: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  })
  return await db.suppliers.get(id)
}
