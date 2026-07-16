import { AccountingService } from '../../src/services/AccountingService.js'

function createMockRepository() {
  const accounts = [
    { id: 1, code: '1101', name: 'Caja y Bancos', type: 'asset', active: true },
    { id: 2, code: '1201', name: 'Inventario', type: 'asset', active: true },
    { id: 3, code: '2101', name: 'IVA por Pagar', type: 'liability', active: true },
    { id: 4, code: '2102', name: 'Proveedores', type: 'liability', active: true },
    { id: 5, code: '3101', name: 'Capital Social', type: 'equity', active: true },
    { id: 6, code: '4101', name: 'Ventas', type: 'income', active: true },
    { id: 7, code: '5101', name: 'Costo de Ventas', type: 'expense', active: true }
  ]
  const entries = []
  let nextEntryId = 1

  return {
    accounts, entries,

    async findAllAccounts() { return [...accounts] },
    async findAccountById(id) { const a = accounts.find(x => x.id === id); return a ? { ...a } : null },
    async findAccountByCode(code) { const a = accounts.find(x => x.code === code); return a ? { ...a } : null },
    async findAccountsByType(type) { return accounts.filter(a => a.type === type) },

    async createAccount(data) {
      const a = { id: accounts.length + 1, ...data, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      accounts.push(a); return { ...a }
    },

    async updateAccount(id, data) {
      const idx = accounts.findIndex(x => x.id === id)
      if (idx === -1) throw new Error('Cuenta no encontrada')
      accounts[idx] = { ...accounts[idx], ...data }
      return { ...accounts[idx] }
    },

    async deleteAccount(id) {
      const idx = accounts.findIndex(x => x.id === id)
      if (idx === -1) throw new Error('Cuenta no encontrada')
      accounts.splice(idx, 1); return true
    },

    async countAccounts() { return accounts.length },
    async countEntries() { return entries.length },

    async findAllEntries() { return [...entries] },
    async findEntryById(id) { const e = entries.find(x => x.id === id); return e ? JSON.parse(JSON.stringify(e)) : null },
    async findEntriesByDateRange(startDate, endDate) {
      return entries.filter(e => e.date >= startDate && e.date <= endDate + 'T23:59:59.999Z')
    },
    async findEntriesByReference(type, id) { return entries.filter(e => e.referenceType === type && e.referenceId === id) },

    async createEntry(data) {
      const entry = { id: nextEntryId++, ...data, items: data.items || [] }
      entries.push(entry)
      return JSON.parse(JSON.stringify(entry))
    },

    async deleteEntry(id) {
      const idx = entries.findIndex(x => x.id === id)
      if (idx === -1) throw new Error('Asiento no encontrado')
      entries.splice(idx, 1); return true
    },

    async getAccountBalances(accountIds) {
      const balances = {}
      for (const id of accountIds) {
        let debit = 0, credit = 0
        for (const entry of entries) {
          for (const item of entry.items || []) {
            if (item.accountId === id) {
              debit += item.debit
              credit += item.credit
            }
          }
        }
        balances[id] = { debit, credit, net: debit - credit }
      }
      return balances
    }
  }
}

function assert(condition, message = 'Assertion failed') {
  if (!condition) throw new Error(message)
}

async function testGetAllAccounts() {
  const repo = createMockRepository()
  const service = new AccountingService(repo)

  const result = await service.getAllAccounts()
  assert(result.length === 7, 'getAllAccounts debería retornar 7 cuentas')
  console.log('  ✓ testGetAllAccounts')
}

async function testCreateAccount() {
  const repo = createMockRepository()
  const service = new AccountingService(repo)

  const account = await service.createAccount({ code: '6101', name: 'Sueldos', type: 'expense' })
  assert(account.id !== undefined, 'createAccount debería asignar un ID')
  assert(account.code === '6101', 'createAccount debería retornar la cuenta creada')
  assert(repo.accounts.length === 8, 'createAccount debería agregar al repositorio')

  console.log('  ✓ testCreateAccount')
}

async function testUpdateAccount() {
  const repo = createMockRepository()
  const service = new AccountingService(repo)

  const updated = await service.updateAccount(1, { name: 'Caja Actualizada' })
  assert(updated.name === 'Caja Actualizada', 'updateAccount debería cambiar el nombre')

  try {
    await service.updateAccount(999, { name: 'No existe' })
    assert(false, 'updateAccount debería lanzar error para ID inexistente')
  } catch {
    // Expected
  }

  console.log('  ✓ testUpdateAccount')
}

async function testDeleteAccount() {
  const repo = createMockRepository()
  const service = new AccountingService(repo)

  await service.deleteAccount(1)
  assert(repo.accounts.length === 6, 'deleteAccount debería eliminar la cuenta')

  try {
    await service.deleteAccount(999)
    assert(false, 'deleteAccount debería lanzar error para ID inexistente')
  } catch {
    // Expected
  }

  console.log('  ✓ testDeleteAccount')
}

async function testCreateSaleEntry() {
  const repo = createMockRepository()
  const service = new AccountingService(repo)

  const sale = { id: 1, subtotal: 100, tax: 18, total: 118, date: new Date().toISOString() }
  const items = [
    { productId: 1, productName: 'Producto A', quantity: 2, unitPrice: 30, subtotal: 60 },
    { productId: 2, productName: 'Producto B', quantity: 1, unitPrice: 40, subtotal: 40 }
  ]

  const entry = await service.createSaleEntry(sale, items)
  assert(entry.id !== undefined, 'createSaleEntry debería crear un asiento')
  assert(entry.description === 'Venta #1', 'La descripción debería incluir Venta #1')
  assert(entry.items.length === 5, 'El asiento de venta debería tener 5 movimientos')

  const totalDebit = entry.items.reduce((s, i) => s + i.debit, 0)
  const totalCredit = entry.items.reduce((s, i) => s + i.credit, 0)
  assert(Math.abs(totalDebit - totalCredit) < 0.01, 'Los totales deben cuadrar')

  console.log('  ✓ testCreateSaleEntry')
}

async function testCreatePurchaseEntry() {
  const repo = createMockRepository()
  const service = new AccountingService(repo)

  const purchase = { id: 1, subtotal: 200, tax: 36, total: 236, date: new Date().toISOString() }
  const items = [
    { productId: 1, productName: 'Producto A', quantity: 5, unitPrice: 40, subtotal: 200 }
  ]

  const entry = await service.createPurchaseEntry(purchase, items)
  assert(entry.id !== undefined, 'createPurchaseEntry debería crear un asiento')
  assert(entry.description === 'Compra #1', 'La descripción debería incluir Compra #1')
  assert(entry.items.length === 3, 'El asiento de compra debería tener 3 movimientos')

  const totalDebit = entry.items.reduce((s, i) => s + i.debit, 0)
  const totalCredit = entry.items.reduce((s, i) => s + i.credit, 0)
  assert(Math.abs(totalDebit - totalCredit) < 0.01, 'Los totales deben cuadrar')

  console.log('  ✓ testCreatePurchaseEntry')
}

async function testCreateCancelSaleEntry() {
  const repo = createMockRepository()
  const service = new AccountingService(repo)

  const sale = { id: 1, subtotal: 100, tax: 18, total: 118, date: new Date().toISOString() }
  const items = [
    { productId: 1, productName: 'Producto A', quantity: 2, unitPrice: 30, subtotal: 60 }
  ]

  const entry = await service.createCancelSaleEntry(sale, items)
  assert(entry.id !== undefined, 'createCancelSaleEntry debería crear un asiento')
  assert(entry.description === 'Anulación venta #1', 'La descripción debería incluir Anulación')

  const totalDebit = entry.items.reduce((s, i) => s + i.debit, 0)
  const totalCredit = entry.items.reduce((s, i) => s + i.credit, 0)
  assert(Math.abs(totalDebit - totalCredit) < 0.01, 'Los totales deben cuadrar en anulación')

  console.log('  ✓ testCreateCancelSaleEntry')
}

async function testCreateCancelPurchaseEntry() {
  const repo = createMockRepository()
  const service = new AccountingService(repo)

  const purchase = { id: 1, subtotal: 200, tax: 36, total: 236, date: new Date().toISOString() }
  const items = [
    { productId: 1, productName: 'Producto A', quantity: 5, unitPrice: 40, subtotal: 200 }
  ]

  const entry = await service.createCancelPurchaseEntry(purchase, items)
  assert(entry.id !== undefined, 'createCancelPurchaseEntry debería crear un asiento')

  const totalDebit = entry.items.reduce((s, i) => s + i.debit, 0)
  const totalCredit = entry.items.reduce((s, i) => s + i.credit, 0)
  assert(Math.abs(totalDebit - totalCredit) < 0.01, 'Los totales deben cuadrar en anulación')

  console.log('  ✓ testCreateCancelPurchaseEntry')
}

async function testGetBalanceSheet() {
  const repo = createMockRepository()
  const service = new AccountingService(repo)

  const sale = { id: 1, subtotal: 100, tax: 18, total: 118, date: new Date().toISOString() }
  const items = [{ productId: 1, productName: 'Producto A', quantity: 2, unitPrice: 30, subtotal: 60 }]
  await service.createSaleEntry(sale, items)

  const balance = await service.getBalanceSheet()
  assert(balance.assets !== undefined, 'getBalanceSheet debería tener activos')
  assert(balance.liabilities !== undefined, 'getBalanceSheet debería tener pasivos')
  assert(balance.equity !== undefined, 'getBalanceSheet debería tener patrimonio')
  assert(balance.assets.accounts.length > 0, 'Debería haber cuentas de activo')

  console.log('  ✓ testGetBalanceSheet')
}

async function testGetIncomeStatement() {
  const repo = createMockRepository()
  const service = new AccountingService(repo)

  const sale = { id: 1, subtotal: 100, tax: 18, total: 118, date: new Date().toISOString() }
  const items = [{ productId: 1, productName: 'Producto A', quantity: 2, unitPrice: 30, subtotal: 60 }]
  await service.createSaleEntry(sale, items)

  const income = await service.getIncomeStatement()
  assert(income.income.length > 0, 'Debería haber ingresos')
  assert(income.expenses.length > 0, 'Debería haber gastos')
  assert(income.totalIncome > 0, 'Total ingresos debería ser positivo')

  console.log('  ✓ testGetIncomeStatement')
}

async function testCreateEntryWithInvalidData() {
  const repo = createMockRepository()
  const service = new AccountingService(repo)

  try {
    await service.createEntry({ description: '', items: [] })
    assert(false, 'createEntry debería lanzar error para datos inválidos')
  } catch (error) {
    assert(error.message.includes('inválidos'), 'El error debería mencionar datos inválidos')
  }

  console.log('  ✓ testCreateEntryWithInvalidData')
}

function createEmptyMockRepository() {
  return {
    accounts: [],
    entries: [],

    async findAllAccounts() { return [] },
    async findAccountById() { return null },
    async findAccountByCode() { return null },
    async findAccountsByType() { return [] },
    async createAccount() { return {} },
    async updateAccount() { return {} },
    async deleteAccount() { return true },
    async countAccounts() { return 0 },
    async countEntries() { return 0 },
    async findAllEntries() { return [] },
    async findEntryById() { return null },
    async findEntriesByDateRange() { return [] },
    async findEntriesByReference() { return [] },
    async createEntry() { return {} },
    async deleteEntry() { return true },
    async getAccountBalances() { return {} }
  }
}

async function testCreateSaleEntryWithMissingAccount() {
  const repo = createEmptyMockRepository()
  const service = new AccountingService(repo)

  try {
    const sale = { id: 1, subtotal: 100, tax: 18, total: 118, date: new Date().toISOString() }
    const items = [{ productId: 1, productName: 'Producto A', quantity: 2, unitPrice: 30, subtotal: 60 }]
    await service.createSaleEntry(sale, items)
    assert(false, 'createSaleEntry debería lanzar error si faltan cuentas')
  } catch (error) {
    assert(error.message.includes('no encontrada'), `El error debería indicar cuenta faltante: ${error.message}`)
  }

  console.log('  ✓ testCreateSaleEntryWithMissingAccount')
}

export async function runAccountingServiceTests() {
  console.log('\n--- AccountingService Tests ---\n')

  await testGetAllAccounts()
  await testCreateAccount()
  await testUpdateAccount()
  await testDeleteAccount()
  await testCreateSaleEntry()
  await testCreatePurchaseEntry()
  await testCreateCancelSaleEntry()
  await testCreateCancelPurchaseEntry()
  await testGetBalanceSheet()
  await testGetIncomeStatement()
  await testCreateEntryWithInvalidData()
  await testCreateSaleEntryWithMissingAccount()

  console.log('\n✓ Todos los tests de AccountingService pasaron\n')
}
