import { PurchaseService } from '../../src/services/PurchaseService.js'
import { AccountingService } from '../../src/services/AccountingService.js'
import { getTaxRate, setTaxRate } from '../../src/utils/formatters.js'
import { assert, createMockDB, seedAccounts, seedProduct, seedSupplier } from './helpers.js'

export async function runPurchaseAccountingFlowTests() {
  setTaxRate(0.12)

  const db = createMockDB()
  await seedAccounts(db)
  const product = await seedProduct(db, { id: 100, purchasePrice: 50, salePrice: 100, stock: 5 })
  const supplier = await seedSupplier(db)

  const productRepo = {
    async findById(id) { const d = await db.products.get(id); return d ? { ...d } : null },
    async update(id, changes) { await db.products.update(id, changes); return this.findById(id) },
    async findAll() { return (await db.products.toArray()).map(d => ({ ...d })) }
  }
  const supplierRepo = {
    async findById(id) { const d = await db.suppliers.get(id); return d ? { ...d } : null }
  }
  const inventoryRepo = {
    async getStockByProduct(productId) {
      const all = await db.inventoryMovements.toArray()
      return all.reduce((sum, m) => { if (m.productId === productId) return sum + (m.quantity || 0); return sum }, 0)
    },
    async create(data) { const id = await db.inventoryMovements.add(data); return { id, ...data } },
    async findByProduct() { return [] }
  }
  let purchaseIdCounter = 300
  const purchaseRepo = {
    async findAll() { return (await db.purchases.toArray()).map(d => ({ ...d })) },
    async findById(id) {
      const d = await db.purchases.get(id); if (!d) return null
      const items = (await db.purchaseItems.toArray()).filter(i => i.purchaseId === id)
      const obj = { ...d, items: items.map(i => ({ ...i })) }
      obj.toJSON = function () { return { ...this, items: this.items.map(i => ({ ...i })) } }
      return obj
    },
    async createWithItems(purchaseData, itemsData) {
      const id = ++purchaseIdCounter
      const purchaseToStore = { ...purchaseData, id }
      await db.purchases.add(purchaseToStore)
      for (const item of itemsData) {
        await db.purchaseItems.add({ ...item, purchaseId: id })
      }
      return this.findById(id)
    },
    async findByDateRange() { return [] },
    async count() { return db.purchases.count() }
  }

  const purchaseService = new PurchaseService(db, purchaseRepo, productRepo, supplierRepo, inventoryRepo)
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

  const purchase = await purchaseService.createPurchase(
    { supplierId: supplier.id, supplierName: supplier.name },
    [{ productId: product.id, quantity: 10, unitPrice: 50 }]
  )
  assert(purchase.id > 0, 'Purchase should have an id')
  assert(purchase.status === 'completed', 'Purchase status should be completed')
  assert(purchase.total === 560, `Purchase total should be 560 (500 subtotal + 60 tax), got ${purchase.total}`)
  assert(purchase.subtotal === 500, `Purchase subtotal should be 500, got ${purchase.subtotal}`)
  assert(purchase.tax === 60, `Purchase tax should be 60, got ${purchase.tax}`)

  const createdAccounting = await accountingService.createPurchaseEntry(purchase, purchase.items)
  assert(createdAccounting.id > 0, 'Accounting entry should be created')
  assert(createdAccounting.referenceType === 'purchase', 'Reference type should be purchase')
  assert(createdAccounting.referenceId === purchase.id, 'Reference id should match purchase id')

  const updatedProduct = await productRepo.findById(product.id)
  assert(updatedProduct.stock === 15, `Stock should be 15 after purchase, got ${updatedProduct.stock}`)

  const movements = await db.inventoryMovements.toArray()
  const purchaseMovement = movements.find(m => m.reference === 'purchase' && m.referenceId === purchase.id)
  assert(purchaseMovement, 'Inventory movement for purchase should exist')
  assert(purchaseMovement.quantity === 10, `Movement quantity should be 10, got ${purchaseMovement.quantity}`)

  const entries = await db.accountingEntries.toArray()
  assert(entries.length === 1, 'Should have one accounting entry')
  const entry = entries[0]
  assert(entry.items.length === 3, 'Purchase entry should have 3 items (inventory, tax, payable)')
  const totalDebit = entry.items.reduce((s, i) => s + i.debit, 0)
  const totalCredit = entry.items.reduce((s, i) => s + i.credit, 0)
  assert(Math.abs(totalDebit - totalCredit) < 0.01, `Debit ${totalDebit} should equal credit ${totalCredit}`)

  console.log('  ✓ testPurchaseAccountingFlow')
}
