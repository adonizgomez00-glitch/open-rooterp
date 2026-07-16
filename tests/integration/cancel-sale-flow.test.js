import { SaleService } from '../../src/services/SaleService.js'
import { AccountingService } from '../../src/services/AccountingService.js'
import { getTaxRate, setTaxRate } from '../../src/utils/formatters.js'
import { assert, createMockDB, seedAccounts, seedProduct, seedCustomer } from './helpers.js'

export async function runCancelSaleFlowTests() {
  setTaxRate(0.12)

  const db = createMockDB()
  await seedAccounts(db)
  const product = await seedProduct(db, { id: 100, purchasePrice: 50, salePrice: 100, stock: 10 })
  const customer = await seedCustomer(db)

  const productRepo = {
    async findById(id) { const d = await db.products.get(id); return d ? { ...d } : null },
    async update(id, changes) { await db.products.update(id, changes); return this.findById(id) },
    async findAll() { return (await db.products.toArray()).map(d => ({ ...d })) }
  }
  const customerRepo = { async findById(id) { const d = await db.customers.get(id); return d ? { ...d } : null } }
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
      await db.sales.add({ ...saleData, id })
      for (const item of itemsData) await db.saleItems.add({ ...item, saleId: id })
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

  // Step 1: Create sale
  const sale = await saleService.createSale(
    { customerId: customer.id, customerName: customer.name },
    [{ productId: product.id, quantity: 3, unitPrice: 100 }]
  )
  assert(sale.status === 'completed', 'Sale should be completed')

  // Step 2: Create accounting entry for the sale
  await accountingService.createSaleEntry(sale, sale.items)

  // Step 3: Cancel the sale
  const cancelledSale = await saleService.cancelSale(sale.id)
  assert(cancelledSale.status === 'cancelled', 'Sale should be cancelled after cancelSale')

  // Step 4: Stock should be restored
  const productAfterCancel = await productRepo.findById(product.id)
  assert(productAfterCancel.stock === 10, `Stock should be restored to 10, got ${productAfterCancel.stock}`)

  // Step 5: Inventory movement for cancellation should exist
  const movements = await db.inventoryMovements.toArray()
  const cancelMovement = movements.find(m => m.reference === 'cancel_sale' && m.referenceId === sale.id)
  assert(cancelMovement, 'Cancellation inventory movement should exist')
  assert(cancelMovement.quantity === 3, `Cancel movement quantity should be +3, got ${cancelMovement.quantity}`)

  // Step 6: Create cancellation accounting entry (reversal)
  const cancelEntry = await accountingService.createCancelSaleEntry(cancelledSale, cancelledSale.items)
  assert(cancelEntry.referenceType === 'cancel_sale', 'Cancel entry referenceType should be cancel_sale')
  assert(cancelEntry.referenceId === sale.id, 'Cancel entry should reference the sale')

  const entries = await db.accountingEntries.toArray()
  assert(entries.length === 2, 'Should have original + cancellation entries')

  // Verify reversal: original and cancel entries should oppose each other
  const origEntry = entries.find(e => e.referenceType === 'sale')
  const revEntry = entries.find(e => e.referenceType === 'cancel_sale')
  assert(origEntry, 'Original sale entry exists')
  assert(revEntry, 'Cancellation entry exists')
  for (const origItem of origEntry.items) {
    const revItem = revEntry.items.find(i => i.accountId === origItem.accountId)
    assert(revItem, `Cancel entry should have reversal for accountId ${origItem.accountId}`)
    assert(origItem.debit === revItem.credit && origItem.credit === revItem.debit,
      `Cancel entry should reverse original for account ${origItem.accountId}`)
  }

  console.log('  ✓ testCancelSaleFlow')
}
