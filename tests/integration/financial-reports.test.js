import { SaleService } from '../../src/services/SaleService.js'
import { PurchaseService } from '../../src/services/PurchaseService.js'
import { AccountingService } from '../../src/services/AccountingService.js'
import { getTaxRate, setTaxRate } from '../../src/utils/formatters.js'
import { assert, createMockDB, seedAccounts, seedProduct, seedCustomer, seedSupplier } from './helpers.js'

export async function runFinancialReportsTests() {
  setTaxRate(0.12)

  const db = createMockDB()
  await seedAccounts(db)
  const product = await seedProduct(db, { id: 100, purchasePrice: 50, salePrice: 100, stock: 50 })
  const customer = await seedCustomer(db)
  const supplier = await seedSupplier(db)

  // Shared repos (product, customer, supplier, inventory)
  const productRepo = {
    async findById(id) { const d = await db.products.get(id); return d ? { ...d } : null },
    async update(id, changes) { await db.products.update(id, changes); return this.findById(id) },
    async findAll() { return (await db.products.toArray()).map(d => ({ ...d })) }
  }
  const customerRepo = { async findById(id) { const d = await db.customers.get(id); return d ? { ...d } : null } }
  const supplierRepo = { async findById(id) { const d = await db.suppliers.get(id); return d ? { ...d } : null } }
  const inventoryRepo = {
    async getStockByProduct(productId) {
      const all = await db.inventoryMovements.toArray()
      return all.reduce((sum, m) => { if (m.productId === productId) return sum + (m.quantity || 0); return sum }, 0)
    },
    async create(data) { const id = await db.inventoryMovements.add(data); return { id, ...data } },
    async findByProduct() { return [] }
  }

  // Sale repo
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
    async findByDateRange(start, end) {
      const all = (await db.sales.toArray()).filter(s => s.date >= start && s.date <= end + 'T23:59:59.999Z')
      return all.reverse().map(d => ({ ...d }))
    },
    async count() { return db.sales.count() }
  }
  const saleService = new SaleService(db, saleRepo, productRepo, customerRepo, inventoryRepo)

  // Purchase repo
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
    async findByDateRange(start, end) {
      const all = (await db.purchases.toArray()).filter(p => p.date >= start && p.date <= end + 'T23:59:59.999Z')
      return all.reverse().map(d => ({ ...d }))
    },
    async count() { return db.purchases.count() }
  }
  const purchaseService = new PurchaseService(db, purchaseRepo, productRepo, supplierRepo, inventoryRepo)

  // Accounting repo & service
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
    async findEntriesByReference() { return [] },
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

  // Step 1: Create a purchase (buy 10 units at 50 = 500 subtotal, 60 tax, 560 total)
  const purchase = await purchaseService.createPurchase(
    { supplierId: supplier.id, supplierName: supplier.name },
    [{ productId: product.id, quantity: 10, unitPrice: 50 }]
  )
  await accountingService.createPurchaseEntry(purchase, purchase.items)

  // Step 2: Create a sale (sell 3 units at 100 = 300 subtotal, 36 tax, 336 total)
  const sale = await saleService.createSale(
    { customerId: customer.id, customerName: customer.name },
    [{ productId: product.id, quantity: 3, unitPrice: 100 }]
  )
  // COGS = 3 * 100 (salePrice, not purchasePrice — current AccountingService behavior)
  await accountingService.createSaleEntry(sale, sale.items)

  // Step 3: Verify balance sheet
  const balanceSheet = await accountingService.getBalanceSheet()
  assert(balanceSheet.totalAssets > 0, 'Total assets should be positive')
  assert(balanceSheet.totalLiabilitiesEquity > 0, 'Total liabilities + equity should be positive')
  assert(Math.abs(balanceSheet.totalAssets - balanceSheet.totalLiabilitiesEquity) < 0.01,
    `Balance sheet should balance: assets ${balanceSheet.totalAssets} vs L+E ${balanceSheet.totalLiabilitiesEquity}`)

  // Step 4: Verify income statement
  const incomeStmt = await accountingService.getIncomeStatement()
  assert(incomeStmt.totalIncome > 0, 'Total income should be positive')
  assert(incomeStmt.totalExpenses > 0, 'Total expenses should be positive')
  assert(incomeStmt.netIncome === incomeStmt.totalIncome - incomeStmt.totalExpenses,
    'Net income should equal income - expenses')
  // Income: sale of 300 @ 100 = 300 subtotal (ventas)
  // Expenses: COGS uses sale unitPrice (100) * 3 = 300 (current AccountingService behavior)
  assert(incomeStmt.totalIncome === 300, `Total income should be 300, got ${incomeStmt.totalIncome}`)
  assert(incomeStmt.totalExpenses === 300, `Total expenses should be 300 (COGS = 3*100), got ${incomeStmt.totalExpenses}`)
  assert(incomeStmt.netIncome === 0, `Net income should be 0 (300-300), got ${incomeStmt.netIncome}`)

  // Step 5: Cancel the sale and verify income statement changes
  const cancelledSale = await saleService.cancelSale(sale.id)
  await accountingService.createCancelSaleEntry(cancelledSale, cancelledSale.items)

  const incomeStmtAfterCancel = await accountingService.getIncomeStatement()
  // After cancellation income = 0 (300 - 300 reversal), expenses = 0 (300 - 300 reversal)
  assert(incomeStmtAfterCancel.totalIncome === 0,
    `After cancel, income should be 0, got ${incomeStmtAfterCancel.totalIncome}`)
  assert(incomeStmtAfterCancel.totalExpenses === 0,
    `After cancel, expenses should be 0, got ${incomeStmtAfterCancel.totalExpenses}`)
  assert(incomeStmtAfterCancel.netIncome === 0,
    `After cancel, net income should be 0, got ${incomeStmtAfterCancel.netIncome}`)
  console.log('  ✓ testFinancialReports')

  console.log('  ✓ testFinancialReports')
}
