const CASH_ACCOUNT_CODE = '1101'
const INVENTORY_ACCOUNT_CODE = '1201'
const TAX_ACCOUNT_CODE = '2101'
const PAYABLE_ACCOUNT_CODE = '2102'
const SALES_ACCOUNT_CODE = '4101'
const COST_ACCOUNT_CODE = '5101'

export class AccountingService {
  constructor(accountingRepository) {
    this._repo = accountingRepository
    this._accountCache = null
  }

  async _getOrFindAccount(code) {
    if (this._accountCache) {
      const cached = this._accountCache.find(a => a.code === code)
      if (cached) return cached
    }
    const account = await this._repo.findAccountByCode(code)
    if (!account) {
      throw new Error(`Cuenta contable ${code} no encontrada`)
    }
    return account
  }

  async _loadAccounts() {
    if (!this._accountCache) {
      this._accountCache = await this._repo.findAllAccounts()
    }
    return this._accountCache
  }

  invalidateCache() {
    this._accountCache = null
  }

  async getAllAccounts() {
    return this._repo.findAllAccounts()
  }

  async getAccountById(id) {
    if (!id) throw new Error('El ID de la cuenta es requerido')
    const account = await this._repo.findAccountById(id)
    if (!account) throw new Error(`Cuenta con id ${id} no encontrada`)
    return account
  }

  async createAccount(data) {
    const account = await this._repo.createAccount(data)
    this.invalidateCache()
    return account
  }

  async updateAccount(id, data) {
    if (!id) throw new Error('El ID de la cuenta es requerido')
    const account = await this._repo.updateAccount(id, data)
    this.invalidateCache()
    return account
  }

  async deleteAccount(id) {
    if (!id) throw new Error('El ID de la cuenta es requerido')
    const result = await this._repo.deleteAccount(id)
    this.invalidateCache()
    return result
  }

  async getAllEntries() {
    return this._repo.findAllEntries()
  }

  async getEntriesByDateRange(startDate, endDate) {
    return this._repo.findEntriesByDateRange(startDate, endDate)
  }

  async createEntry(data) {
    return this._repo.createEntry(data)
  }

  async createSaleEntry(sale, items) {
    await this._loadAccounts()
    const cash = await this._getOrFindAccount(CASH_ACCOUNT_CODE)
    const inventory = await this._getOrFindAccount(INVENTORY_ACCOUNT_CODE)
    const tax = await this._getOrFindAccount(TAX_ACCOUNT_CODE)
    const sales = await this._getOrFindAccount(SALES_ACCOUNT_CODE)
    const cost = await this._getOrFindAccount(COST_ACCOUNT_CODE)

    const totalCost = items.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0)

    const entryItems = [
      { accountId: cash.id, accountCode: cash.code, accountName: cash.name, debit: sale.total, credit: 0 },
      { accountId: sales.id, accountCode: sales.code, accountName: sales.name, debit: 0, credit: sale.subtotal },
      { accountId: tax.id, accountCode: tax.code, accountName: tax.name, debit: 0, credit: sale.tax },
      { accountId: cost.id, accountCode: cost.code, accountName: cost.name, debit: totalCost, credit: 0 },
      { accountId: inventory.id, accountCode: inventory.code, accountName: inventory.name, debit: 0, credit: totalCost }
    ]

    return this._repo.createEntry({
      date: sale.date || new Date().toISOString(),
      description: `Venta #${sale.id}`,
      referenceType: 'sale',
      referenceId: sale.id,
      items: entryItems
    })
  }

  async createPurchaseEntry(purchase, items) {
    await this._loadAccounts()
    const inventory = await this._getOrFindAccount(INVENTORY_ACCOUNT_CODE)
    const tax = await this._getOrFindAccount(TAX_ACCOUNT_CODE)
    const payable = await this._getOrFindAccount(PAYABLE_ACCOUNT_CODE)

    const entryItems = [
      { accountId: inventory.id, accountCode: inventory.code, accountName: inventory.name, debit: purchase.subtotal, credit: 0 },
      { accountId: tax.id, accountCode: tax.code, accountName: tax.name, debit: purchase.tax, credit: 0 },
      { accountId: payable.id, accountCode: payable.code, accountName: payable.name, debit: 0, credit: purchase.total }
    ]

    return this._repo.createEntry({
      date: purchase.date || new Date().toISOString(),
      description: `Compra #${purchase.id}`,
      referenceType: 'purchase',
      referenceId: purchase.id,
      items: entryItems
    })
  }

  async createCancelSaleEntry(sale, items) {
    await this._loadAccounts()
    const cash = await this._getOrFindAccount(CASH_ACCOUNT_CODE)
    const inventory = await this._getOrFindAccount(INVENTORY_ACCOUNT_CODE)
    const tax = await this._getOrFindAccount(TAX_ACCOUNT_CODE)
    const sales = await this._getOrFindAccount(SALES_ACCOUNT_CODE)
    const cost = await this._getOrFindAccount(COST_ACCOUNT_CODE)

    const totalCost = items.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0)

    const entryItems = [
      { accountId: cash.id, accountCode: cash.code, accountName: cash.name, debit: 0, credit: sale.total },
      { accountId: sales.id, accountCode: sales.code, accountName: sales.name, debit: sale.subtotal, credit: 0 },
      { accountId: tax.id, accountCode: tax.code, accountName: tax.name, debit: sale.tax, credit: 0 },
      { accountId: cost.id, accountCode: cost.code, accountName: cost.name, debit: 0, credit: totalCost },
      { accountId: inventory.id, accountCode: inventory.code, accountName: inventory.name, debit: totalCost, credit: 0 }
    ]

    return this._repo.createEntry({
      date: new Date().toISOString(),
      description: `Anulación venta #${sale.id}`,
      referenceType: 'cancel_sale',
      referenceId: sale.id,
      items: entryItems
    })
  }

  async createCancelPurchaseEntry(purchase, items) {
    await this._loadAccounts()
    const inventory = await this._getOrFindAccount(INVENTORY_ACCOUNT_CODE)
    const tax = await this._getOrFindAccount(TAX_ACCOUNT_CODE)
    const payable = await this._getOrFindAccount(PAYABLE_ACCOUNT_CODE)

    const entryItems = [
      { accountId: inventory.id, accountCode: inventory.code, accountName: inventory.name, debit: 0, credit: purchase.subtotal },
      { accountId: tax.id, accountCode: tax.code, accountName: tax.name, debit: 0, credit: purchase.tax },
      { accountId: payable.id, accountCode: payable.code, accountName: payable.name, debit: purchase.total, credit: 0 }
    ]

    return this._repo.createEntry({
      date: new Date().toISOString(),
      description: `Anulación compra #${purchase.id}`,
      referenceType: 'cancel_purchase',
      referenceId: purchase.id,
      items: entryItems
    })
  }

  async getBalanceSheet() {
    const accounts = await this._repo.findAllAccounts()
    const activeAccounts = accounts.filter(a => a.active)
    const balanceData = await this._repo.getAccountBalances(activeAccounts.map(a => a.id))

    const assetBalance = { total: 0, accounts: [] }
    const liabilityBalance = { total: 0, accounts: [] }
    const equityBalance = { total: 0, accounts: [] }

    for (const account of activeAccounts) {
      const balance = balanceData[account.id] || { debit: 0, credit: 0, net: 0 }
      let netBalance = balance.net

      if (account.type === 'asset' || account.type === 'expense') {
        netBalance = balance.debit - balance.credit
      } else {
        netBalance = balance.credit - balance.debit
      }

      const entry = {
        code: account.code,
        name: account.name,
        balance: Math.abs(netBalance),
        type: netBalance >= 0 ? 'deudor' : 'acreedor'
      }

      if (account.type === 'asset') {
        assetBalance.accounts.push(entry)
        assetBalance.total += netBalance
      } else if (account.type === 'liability') {
        liabilityBalance.accounts.push(entry)
        liabilityBalance.total += netBalance
      } else if (account.type === 'equity') {
        equityBalance.accounts.push(entry)
        equityBalance.total += netBalance
      }
    }

    const netIncome = await this._getNetIncome(balanceData, activeAccounts)
    if (netIncome !== 0) {
      equityBalance.accounts.push({
        code: '---',
        name: 'Resultado del Ejercicio',
        balance: Math.abs(netIncome),
        type: netIncome >= 0 ? 'acreedor' : 'deudor'
      })
      equityBalance.total += netIncome
    }

    return {
      assets: assetBalance,
      liabilities: liabilityBalance,
      equity: equityBalance,
      totalAssets: assetBalance.total,
      totalLiabilitiesEquity: liabilityBalance.total + equityBalance.total
    }
  }

  async getIncomeStatement() {
    const accounts = await this._repo.findAllAccounts()
    const activeAccounts = accounts.filter(a => a.active)
    const balanceData = await this._repo.getAccountBalances(activeAccounts.map(a => a.id))

    let totalIncome = 0
    let totalExpenses = 0
    const incomeAccounts = []
    const expenseAccounts = []

    for (const account of activeAccounts) {
      const balance = balanceData[account.id] || { debit: 0, credit: 0, net: 0 }
      const netBalance = balance.credit - balance.debit

      if (account.type === 'income') {
        incomeAccounts.push({ code: account.code, name: account.name, amount: netBalance })
        totalIncome += netBalance
      } else if (account.type === 'expense') {
        const expenseAmount = balance.debit - balance.credit
        expenseAccounts.push({ code: account.code, name: account.name, amount: expenseAmount })
        totalExpenses += expenseAmount
      }
    }

    return {
      income: incomeAccounts,
      expenses: expenseAccounts,
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses
    }
  }

  async _getNetIncome(balanceData, accounts) {
    let income = 0
    let expenses = 0

    for (const account of accounts) {
      const balance = balanceData[account.id] || { debit: 0, credit: 0, net: 0 }
      if (account.type === 'income') {
        income += balance.credit - balance.debit
      } else if (account.type === 'expense') {
        expenses += balance.debit - balance.credit
      }
    }

    return income - expenses
  }

  async deleteEntryByReference(referenceType, referenceId) {
    const entries = await this._repo.findEntriesByReference(referenceType, referenceId)
    for (const entry of entries) {
      await this._repo.deleteEntry(entry.id)
    }
    return entries.length > 0
  }

  async getSummary() {
    const [accountCount, entryCount] = await Promise.all([
      this._repo.countAccounts(),
      this._repo.countEntries()
    ])
    return { accounts: accountCount, entries: entryCount }
  }
}
