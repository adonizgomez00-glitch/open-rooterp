import { SaleService } from '../../src/services/SaleService.js'
import { AccountingService } from '../../src/services/AccountingService.js'
import { getTaxRate, setTaxRate } from '../../src/utils/formatters.js'
import { assert, createMockDB, seedAccounts, seedProduct, seedCustomer } from './helpers.js'

export async function runSaleAccountingFlowTests() {
  setTaxRate(0.12)

  const db = createMockDB()
  await seedAccounts(db)
  const product = await seedProduct(db, { id: 100, purchasePrice: 50, salePrice: 100 })
  const customer = await seedCustomer(db)

  const productRepo = {
    async findById(id) { const d = await db.products.get(id); return d ? { ...d } : null },
    async update(id, changes) { await db.products.update(id, changes); return this.findById(id) },
    async findAll() { return (await db.products.toArray()).map(d => ({ ...d })) }
  }
  const customerRepo = {
    async findById(id) { const d = await db.customers.get(id); return d ? { ...d } : null }
  }
  const inventoryRepo = {
    async getStockByProduct(productId) {
      const all = await db.inventoryMovements.toArray()
      return all.reduce((sum, m) => { if (m.productId === productId) return sum + (m.quantity || 0); return sum }, 0)
    },
    async create(data) { const id = await db.inventoryMovements.add(data); return { id, ...data } },
    async findByProduct() { return [] }
  }
  let saleIdCounter = 200
  const saleRepo = {
    async findAll() { return (await db.sales.toArray()).map(d => ({ ...d })) },
    async findById(id) {
      const d = await db.sales.get(id); if (!d) return null
      const items = (await db.saleItems.toArray()).filter(i => i.saleId === id)
      const obj = { ...d, items: items.map(i => ({ ...i })) }
      obj.toJSON = function () { return { ...this, items: this.items.map(i => ({ ...i })) } }
      return obj
    },
    async createWithItems(saleData, itemsData) {
      const id = ++saleIdCounter
      const saleToStore = { ...saleData, id }
      await db.sales.add(saleToStore)
      for (const item of itemsData) {
        await db.saleItems.add({ ...item, saleId: id })
      }
      return this.findById(id)
    },
    async findByDateRange() { return [] },
    async count() { return db.sales.count() }
  }

  const saleService = new SaleService(db, saleRepo, productRepo, customerRepo, inventoryRepo)
  const accountingRepo = {
    async findAllAccounts() { return (await db.accounts.toArray()).map(d => ({ ...d })) },
    async findAccountByCode(code) { const a = (await db.accounts.toArray()).find(x => x.code === code); return a ? { ...a } : null },
    async findAccountById(id) { const d = await db.accounts.get(id); return d ? { ...d } : null },
    async createEntry(data) { const id = await db.accountingEntries.add(data); return { id, ...data } },
    async createAccount(data) { const id = await db.accounts.add(data); return { id, ...data } },
    async updateAccount(id, data) { await db.accounts.update(id, data); return this.findAccountById(id) },
    async deleteAccount(id) { await db.accounts.delete(id); return true },
    async findAllEntries() { return (await db.accountingEntries.toArray()).map(d => ({ ...d })) },
    async findEntryById(id) { const d = await db.accountingEntries.get(id); return d ? { ...d } : null },
    async findEntriesByDateRange() { return [] },
    async findEntriesByReference(type, refId) { return (await db.accountingEntries.toArray()).filter(e => e.referenceType === type && e.referenceId === refId) },
    async deleteEntry(id) { await db.accountingEntries.delete(id); return true },
    async countAccounts() { return db.accounts.count() },
    async countEntries() { return db.accountingEntries.count() },
    async getAccountBalances(accountIds) {
      const all = await db.accountingEntries.toArray()
      const balances = {}
      for (const id of accountIds) balances[id] = { debit: 0, credit: 0, net: 0 }
      for (const entry of all) {
        for (const item of entry.items || []) {
          if (balances[item.accountId] !== undefined) {
            balances[item.accountId].debit += item.debit
            balances[item.accountId].credit += item.credit
            balances[item.accountId].net += item.debit - item.credit
          }
        }
      }
      return balances
    }
  }
  const accountingService = new AccountingService(accountingRepo)

  const sale = await saleService.createSale(
    { customerId: customer.id, customerName: customer.name },
    [{ productId: product.id, quantity: 3, unitPrice: 100 }]
  )
  assert(sale.id > 0, 'Sale should have an id')
  assert(sale.status === 'completed', 'Sale status should be completed')
  assert(sale.total === 336, 'Sale total should be 336 (300 subtotal + 36 tax)')
  assert(sale.subtotal === 300, 'Sale subtotal should be 300')
  assert(sale.tax === 36, `Sale tax should be 36, got ${sale.tax}`)

  const createdAccounting = await accountingService.createSaleEntry(sale, sale.items)
  assert(createdAccounting.id > 0, 'Accounting entry should be created')
  assert(createdAccounting.referenceType === 'sale', 'Reference type should be sale')
  assert(createdAccounting.referenceId === sale.id, 'Reference id should match sale id')

  const updatedProduct = await productRepo.findById(product.id)
  assert(updatedProduct.stock === 7, `Stock should be 7 after sale, got ${updatedProduct.stock}`)

  const movements = await db.inventoryMovements.toArray()
  const saleMovement = movements.find(m => m.reference === 'sale' && m.referenceId === sale.id)
  assert(saleMovement, 'Inventory movement for sale should exist')
  assert(saleMovement.quantity === -3, `Movement quantity should be -3, got ${saleMovement.quantity}`)

  const entries = await db.accountingEntries.toArray()
  assert(entries.length === 1, 'Should have one accounting entry')
  const entry = entries[0]
  assert(entry.items.length === 5, 'Sale entry should have 5 items (cash, sales, tax, cost, inventory)')
  const totalDebit = entry.items.reduce((s, i) => s + i.debit, 0)
  const totalCredit = entry.items.reduce((s, i) => s + i.credit, 0)
  assert(totalDebit === totalCredit, `Debit ${totalDebit} should equal credit ${totalCredit}`)

  console.log('  ✓ testSaleAccountingFlow')
}
