import { AccountingController } from '../../src/controllers/AccountingController.js'

function createMockService() {
  const accounts = [
    { id: 1, code: '1101', name: 'Caja y Bancos', type: 'asset', active: true },
    { id: 6, code: '4101', name: 'Ventas', type: 'income', active: true }
  ]
  const entries = []
  let nextId = 3

  return {
    async getAllAccounts() { return [...accounts] },
    async getAccountById(id) {
      const a = accounts.find(x => x.id === id)
      if (!a) throw new Error(`Cuenta con id ${id} no encontrada`)
      return { ...a }
    },
    async createAccount(data) {
      const a = { id: nextId++, ...data }
      accounts.push(a)
      return { ...a }
    },
    async updateAccount(id, data) {
      const idx = accounts.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Cuenta con id ${id} no encontrada`)
      accounts[idx] = { ...accounts[idx], ...data }
      return { ...accounts[idx] }
    },
    async deleteAccount(id) {
      const idx = accounts.findIndex(x => x.id === id)
      if (idx === -1) throw new Error(`Cuenta con id ${id} no encontrada`)
      accounts.splice(idx, 1)
      return true
    },
    async getAllEntries() { return [...entries] },
    async getEntriesByDateRange() { return [...entries] },
    async createEntry(e) { entries.push({ id: nextId++, ...e }); return entries[entries.length - 1] },
    async getBalanceSheet() {
      return {
        assets: { total: 1000, accounts: [{ code: '1101', name: 'Caja', balance: 1000 }] },
        liabilities: { total: 0, accounts: [] },
        equity: { total: 1000, accounts: [{ code: '3101', name: 'Capital', balance: 1000 }] },
        totalAssets: 1000,
        totalLiabilitiesEquity: 1000
      }
    },
    async getIncomeStatement() {
      return {
        income: [{ code: '4101', name: 'Ventas', amount: 500 }],
        expenses: [{ code: '5101', name: 'Costo', amount: 300 }],
        totalIncome: 500,
        totalExpenses: 300,
        netIncome: 200
      }
    },
    async getSummary() { return { accounts: accounts.length, entries: entries.length } }
  }
}

function createMockView() {
  return {
    rendered: false,
    accountsData: null,
    errorMessage: null,
    successMessage: null,
    formOpened: false,
    formClosed: false,
    savingState: false,
    loadingState: false,
    activeTab: null,

    reset() {
      this.rendered = false
      this.accountsData = null
      this.errorMessage = null
      this.successMessage = null
      this.formOpened = false
      this.formClosed = false
      this.savingState = false
      this.loadingState = false
    },

    render(container) {
      this.rendered = true
      this._container = container
    },

    renderAccounts(accounts) {
      this.accountsData = accounts
    },

    renderJournal() {},
    renderBalanceSheet() {},
    renderIncomeStatement() {},

    showAccountForm(account, onSubmit, onCancel) {
      this.formOpened = true
      this._formAccount = account
      this._formSubmit = onSubmit
      this._formCancel = onCancel
    },

    closeAccountForm() { this.formClosed = true },
    updateSummary() {},
    updateActiveTab(tab) { this.activeTab = tab },
    showDateInputs() {},

    showLoading() { this.loadingState = true },
    hideLoading() { this.loadingState = false },
    showSaving() { this.savingState = true },
    hideSaving() { this.savingState = false },
    showSuccess(msg) { this.successMessage = msg },
    showError(msg) { this.errorMessage = msg },

    onTabChange(cb) { this._tabChangeCb = cb },
    onGenerateReport(cb) { this._genReportCb = cb },
    onCreateAccount(cb) { this._createAccountCb = cb },
    onEditAccount(cb) { this._editAccountCb = cb },
    onUpdateAccount(cb) { this._updateAccountCb = cb },
    onDeleteAccount(cb) { this._deleteAccountCb = cb },

    async confirmDelete() { return true },
    getDateRange() { return { startDate: '', endDate: '' } }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testInitLoadsJournal() {
  const service = createMockService()
  const view = createMockView()
  const controller = new AccountingController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.rendered, 'init debería llamar a view.render')
  assert(view.activeTab === 'journal', 'init debería cargar la pestaña Libro Diario')

  console.log('  ✓ testInitLoadsJournal')
}

async function testTabChangeToAccounts() {
  const service = createMockService()
  const view = createMockView()
  const controller = new AccountingController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleTabChange('accounts')
  assert(view.activeTab === 'accounts', 'handleTabChange debería cambiar a accounts')
  assert(view.accountsData !== null, 'handleTabChange debería cargar cuentas')

  console.log('  ✓ testTabChangeToAccounts')
}

async function testTabChangeToBalance() {
  const service = createMockService()
  const view = createMockView()
  const controller = new AccountingController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleTabChange('balance')
  assert(view.activeTab === 'balance', 'handleTabChange debería cambiar a balance')

  console.log('  ✓ testTabChangeToBalance')
}

async function testTabChangeToIncome() {
  const service = createMockService()
  const view = createMockView()
  const controller = new AccountingController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleTabChange('income')
  assert(view.activeTab === 'income', 'handleTabChange debería cambiar a income')

  console.log('  ✓ testTabChangeToIncome')
}

async function testHandleCreateAccount() {
  const service = createMockService()
  const view = createMockView()
  const controller = new AccountingController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleCreateAccount({ code: '6101', name: 'Sueldos', type: 'expense' })

  assert(view.successMessage !== null, 'handleCreateAccount debería mostrar éxito')
  assert(view.formClosed, 'handleCreateAccount debería cerrar formulario')

  console.log('  ✓ testHandleCreateAccount')
}

async function testHandleEditAndUpdateAccount() {
  const service = createMockService()
  const view = createMockView()
  const controller = new AccountingController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleEditAccount(1)
  assert(view.formOpened, 'handleEditAccount debería abrir formulario')
  assert(view._formAccount !== null, 'handleEditAccount debería pasar la cuenta')

  await view._formSubmit({ code: '1101', name: 'Caja Actualizada', type: 'asset' })
  assert(view.successMessage?.includes('actualizada'), 'handleUpdateAccount debería mostrar éxito')

  console.log('  ✓ testHandleEditAndUpdateAccount')
}

async function testHandleDeleteAccount() {
  const service = createMockService()
  const view = createMockView()
  const controller = new AccountingController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleDeleteAccount(6)
  assert(view.successMessage !== null, 'handleDeleteAccount debería mostrar éxito')

  console.log('  ✓ testHandleDeleteAccount')
}

async function testInitLoadError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new AccountingController(service, view)

  service.getSummary = async () => { throw new Error('Error al cargar contabilidad') }

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.errorMessage === 'Error al cargar contabilidad', 'init debería mostrar error si falla')

  console.log('  ✓ testInitLoadError')
}

async function testHandleCreateAccountError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new AccountingController(service, view)

  service.createAccount = async () => { throw new Error('Error al crear cuenta') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleCreateAccount({ code: '6101', name: 'Sueldos', type: 'expense' })

  assert(view.errorMessage === 'Error al crear cuenta', 'handleCreateAccount debería mostrar error')

  console.log('  ✓ testHandleCreateAccountError')
}

async function testHandleEditAccountError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new AccountingController(service, view)

  service.getAccountById = async () => { throw new Error('Error al obtener cuenta') }

  const container = document.createElement('div')
  await controller.init(container)

  view.reset()
  await controller.handleEditAccount(999)

  assert(view.errorMessage === 'Error al obtener cuenta', 'handleEditAccount debería mostrar error')

  console.log('  ✓ testHandleEditAccountError')
}

async function testHandleDeleteAccountError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new AccountingController(service, view)

  service.deleteAccount = async () => { throw new Error('Error al eliminar cuenta') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleDeleteAccount(1)

  assert(view.errorMessage === 'Error al eliminar cuenta', 'handleDeleteAccount debería mostrar error')

  console.log('  ✓ testHandleDeleteAccountError')
}

async function testHandleTabChangeError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new AccountingController(service, view)

  service.getSummary = async () => { throw new Error('Error al cargar contabilidad') }

  const container = document.createElement('div')
  await controller.init(container)

  view.reset()
  await controller.handleTabChange('accounts')

  assert(view.errorMessage === 'Error al cargar contabilidad', 'handleTabChange debería mostrar error')

  console.log('  ✓ testHandleTabChangeError')
}

export async function runAccountingControllerTests() {
  console.log('\n--- AccountingController Tests ---\n')

  await testInitLoadsJournal()
  await testTabChangeToAccounts()
  await testTabChangeToBalance()
  await testTabChangeToIncome()
  await testHandleCreateAccount()
  await testHandleEditAndUpdateAccount()
  await testHandleDeleteAccount()
  await testInitLoadError()
  await testHandleCreateAccountError()
  await testHandleEditAccountError()
  await testHandleDeleteAccountError()
  await testHandleTabChangeError()

  console.log('\n✓ Todos los tests de AccountingController pasaron\n')
}
