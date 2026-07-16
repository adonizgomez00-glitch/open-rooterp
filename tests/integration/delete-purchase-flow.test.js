import { PurchaseService } from '../../src/services/PurchaseService.js'
import { AccountingService } from '../../src/services/AccountingService.js'
import { getTaxRate, setTaxRate } from '../../src/utils/formatters.js'
import { assert, createMockDB, seedAccounts, seedProduct, seedSupplier } from './helpers.js'

export async function runDeletePurchaseFlowTests() {
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
  const supplierRepo = { async findById(id) { const d = await db.suppliers.get(id); return d ? { ...d } : null } }
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
      await db.purchases.add({ ...purchaseData, id })
      for (const item of itemsData) await db.purchaseItems.add({ ...item, purchaseId: id })
      return this.findById(id)
    },
    async delete(id) {
      const existing = await this.findById(id)
      if (!existing) throw new Error('Compra no encontrada')
      await db.purchaseItems.where('purchaseId').equals(id).delete()
      await db.purchases.delete(id)
      return true
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
    async deleteEntry(id) { await db.accountingEntries.delete(id); return true },
    async findAllEntries() { return (await db.accountingEntries.toArray()).map(d => ({ ...d })) },
    async findEntriesByReference(type, refId) { return (await db.accountingEntries.toArray()).filter(e => e.referenceType === type && e.referenceId === refId) },
    async getAccountBalances(ids) {
      const all = await db.accountingEntries.toArray()
      const balances = {}
      for (const id of ids) balances[id] = { debit: 0, credit: 0, net: 0 }
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

  // Step 1: Create purchase
  const purchase = await purchaseService.createPurchase(
    { supplierId: supplier.id, supplierName: supplier.name },
    [{ productId: product.id, quantity: 10, unitPrice: 50 }]
  )
  assert(purchase.status === 'completed', 'Purchase should be completed')
  assert((await productRepo.findById(product.id)).stock === 15, 'Stock should increase after purchase')

  // Step 2: Create accounting entry
  await accountingService.createPurchaseEntry(purchase, purchase.items)

  // Step 3: Delete the purchase
  const result = await purchaseService.deletePurchase(purchase.id)
  assert(result === true, 'deletePurchase should return true')

  // Step 4: Purchase should not exist
  const deleted = await purchaseRepo.findById(purchase.id)
  assert(deleted === null, 'Purchase should be deleted from DB')

  // Step 5: Purchase items should be deleted
  const purchaseItems = (await db.purchaseItems.toArray()).filter(i => i.purchaseId === purchase.id)
  assert(purchaseItems.length === 0, 'Purchase items should be deleted')

  // Step 6: Stock should be reduced (reverse of purchase)
  assert((await productRepo.findById(product.id)).stock === 5, 'Stock should return to 5 after delete')

  // Step 7: Delete accounting entry
  const deletedEntries = await accountingService.deleteEntryByReference('purchase', purchase.id)
  assert(deletedEntries === true, 'Accounting entry should be deleted')
  const entries = await db.accountingEntries.toArray()
  assert(entries.length === 0, 'All accounting entries should be deleted')

  console.log('  ✓ testDeletePurchaseFlow')
}
