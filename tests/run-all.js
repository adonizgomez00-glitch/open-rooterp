// Minimal DOM shim for controller tests
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0)
globalThis.window = globalThis

function resetDOM() {
  globalThis.document = {
    createElement(tag) {
      const el = {
        tagName: tag.toUpperCase(),
        className: '',
        id: '',
        textContent: '',
        innerHTML: '',
        style: {},
        dataset: {},
        children: [],
        parentNode: null,
        childNodes: [],
        _listeners: {},
        setAttribute(name, value) { this[name] = value },
        getAttribute(name) { return this[name] },
        getAttributeNS() { return null },
        hasAttribute(name) { return name in this },
        removeAttribute(name) { delete this[name] },
        classList: {
          _classes: new Set(),
          add(...names) { for (const n of names) this._classes.add(n) },
          remove(...names) { for (const n of names) this._classes.delete(n) },
          contains(name) { return this._classes.has(name) },
          toggle(name) {
            if (this._classes.has(name)) { this._classes.delete(name); return false }
            this._classes.add(name); return true
          },
          get length() { return this._classes.size },
          [Symbol.iterator]() { return this._classes[Symbol.iterator]() }
        },
        appendChild(child) {
          if (child.parentNode) child.parentNode.removeChild(child)
          child.parentNode = this
          this.children.push(child)
          this.childNodes.push(child)
          return child
        },
        removeChild(child) {
          const idx = this.children.indexOf(child)
          if (idx > -1) this.children.splice(idx, 1)
          const idx2 = this.childNodes.indexOf(child)
          if (idx2 > -1) this.childNodes.splice(idx2, 1)
          child.parentNode = null
          return child
        },
        addEventListener(type, fn) {
          if (!this._listeners[type]) this._listeners[type] = []
          this._listeners[type].push(fn)
        },
        removeEventListener(type, fn) {
          if (!this._listeners[type]) return
          this._listeners[type] = this._listeners[type].filter(f => f !== fn)
        },
        dispatchEvent(event) {
          const handlers = this._listeners[event.type] || []
          for (const handler of handlers) handler(event)
          return true
        },
        querySelector(sel) { return null },
        querySelectorAll(sel) { return [] },
        closest() { return null },
        getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 } },
        focus() {},
        cloneNode() { return globalThis.document.createElement(this.tagName) }
      }
      if (tag === 'select') { el.options = []; el._optionEls = []; el.add = function(opt) { el.options.push({ value: opt.value, text: opt.textContent }); el._optionEls.push(opt) }; Object.defineProperty(el, 'value', { get() { return el._value || '' }, set(v) { el._value = v } }); Object.defineProperty(el, 'required', { get() { return el._required || false }, set(v) { el._required = v } }) }
      if (tag === 'input' || tag === 'textarea') { Object.defineProperty(el, 'value', { get() { return el._value || '' }, set(v) { el._value = v } }); Object.defineProperty(el, 'required', { get() { return el._required || false }, set(v) { el._required = v } }) }
      return el
    },
    body: { appendChild() {}, removeChild() {}, querySelector() { return null }, querySelectorAll() { return [] } },
    documentElement: { style: {} }
  }
}

const integrationModules = [
  { name: 'SaleAccountingFlow', path: './integration/sale-accounting-flow.test.js', fn: 'runSaleAccountingFlowTests' },
  { name: 'PurchaseAccountingFlow', path: './integration/purchase-accounting-flow.test.js', fn: 'runPurchaseAccountingFlowTests' },
  { name: 'CancelSaleFlow', path: './integration/cancel-sale-flow.test.js', fn: 'runCancelSaleFlowTests' },
  { name: 'CancelPurchaseFlow', path: './integration/cancel-purchase-flow.test.js', fn: 'runCancelPurchaseFlowTests' },
  { name: 'DeleteSaleFlow', path: './integration/delete-sale-flow.test.js', fn: 'runDeleteSaleFlowTests' },
  { name: 'DeletePurchaseFlow', path: './integration/delete-purchase-flow.test.js', fn: 'runDeletePurchaseFlowTests' },
  { name: 'InsufficientStock', path: './integration/insufficient-stock.test.js', fn: 'runInsufficientStockTests' },
  { name: 'FinancialReports', path: './integration/financial-reports.test.js', fn: 'runFinancialReportsTests' },
  { name: 'ImportExportFlow', path: './integration/import-export-flow.test.js', fn: 'runImportExportFlowTests' }
]

const testModules = [
  { name: 'ProductService', path: './services/ProductService.test.js', fn: 'runProductServiceTests' },
  { name: 'ProductController', path: './controllers/ProductController.test.js', fn: 'runProductControllerTests' },
  { name: 'CustomerService', path: './services/CustomerService.test.js', fn: 'runCustomerServiceTests' },
  { name: 'CustomerController', path: './controllers/CustomerController.test.js', fn: 'runCustomerControllerTests' },
  { name: 'InventoryService', path: './services/InventoryService.test.js', fn: 'runInventoryServiceTests' },
  { name: 'InventoryController', path: './controllers/InventoryController.test.js', fn: 'runInventoryControllerTests' },
  { name: 'SaleService', path: './services/SaleService.test.js', fn: 'runSaleServiceTests' },
  { name: 'SaleController', path: './controllers/SaleController.test.js', fn: 'runSaleControllerTests' },
  { name: 'SupplierService', path: './services/SupplierService.test.js', fn: 'runSupplierServiceTests' },
  { name: 'SupplierController', path: './controllers/SupplierController.test.js', fn: 'runSupplierControllerTests' },
  { name: 'PurchaseService', path: './services/PurchaseService.test.js', fn: 'runPurchaseServiceTests' },
  { name: 'PurchaseController', path: './controllers/PurchaseController.test.js', fn: 'runPurchaseControllerTests' },
  { name: 'ReportService', path: './services/ReportService.test.js', fn: 'runReportServiceTests' },
  { name: 'ReportController', path: './controllers/ReportController.test.js', fn: 'runReportControllerTests' },
  { name: 'DashboardService', path: './services/DashboardService.test.js', fn: 'runDashboardServiceTests' },
  { name: 'DashboardController', path: './controllers/DashboardController.test.js', fn: 'runDashboardControllerTests' },
  { name: 'SettingService', path: './services/SettingService.test.js', fn: 'runSettingServiceTests' },
  { name: 'SettingsController', path: './controllers/SettingsController.test.js', fn: 'runSettingsControllerTests' },
  { name: 'ExportService', path: './services/ExportService.test.js', fn: 'runExportServiceTests' },
  { name: 'ExportController', path: './controllers/ExportController.test.js', fn: 'runExportControllerTests' },
  { name: 'ImportService', path: './services/ImportService.test.js', fn: 'runImportServiceTests' },
  { name: 'ImportController', path: './controllers/ImportController.test.js', fn: 'runImportControllerTests' },
  { name: 'Form', path: './components/Form.test.js', fn: 'runFormTests' },
  { name: 'Sanitizer', path: './utils/sanitizer.test.js', fn: 'runSanitizerTests' },
  { name: 'Validators', path: './utils/validators.test.js', fn: 'runValidatorsTests' },
  { name: 'Helpers', path: './utils/helpers.test.js', fn: 'runHelpersTests' },
  { name: 'PasswordService', path: './services/PasswordService.test.js', fn: 'runPasswordServiceTests' },
  { name: 'SessionService', path: './services/SessionService.test.js', fn: 'runSessionServiceTests' },
  { name: 'PermissionService', path: './services/PermissionService.test.js', fn: 'runPermissionServiceTests' },
  { name: 'AuthenticationService', path: './services/AuthenticationService.test.js', fn: 'runAuthenticationServiceTests' },
  { name: 'SystemService', path: './services/SystemService.test.js', fn: 'runSystemServiceTests' },
  { name: 'PluginService', path: './services/PluginService.test.js', fn: 'runPluginServiceTests' },
  { name: 'LoginController', path: './controllers/LoginController.test.js', fn: 'runLoginControllerTests' },
  { name: 'SetupController', path: './controllers/SetupController.test.js', fn: 'runSetupControllerTests' },
  { name: 'UserController', path: './controllers/UserController.test.js', fn: 'runUserControllerTests' },
  { name: 'AccountingService', path: './services/AccountingService.test.js', fn: 'runAccountingServiceTests' },
  { name: 'AccountingController', path: './controllers/AccountingController.test.js', fn: 'runAccountingControllerTests' }
]

async function main() {
  let passed = 0
  let failed = 0

  for (const mod of testModules) {
    try {
      const testMod = await import(mod.path)
      if (testMod[mod.fn]) {
        await testMod[mod.fn]()
        passed++
      }
    } catch (error) {
      failed++
      console.error(`\n✗ ${mod.name} falló: ${error.message}`)
      console.error(error.stack)
    } finally {
      resetDOM()
    }
  }

  if (integrationModules.length > 0) {
    console.log(`\n--- Integration Tests (${integrationModules.length}) ---`)
  }

  for (const mod of integrationModules) {
    try {
      const testMod = await import(mod.path)
      if (testMod[mod.fn]) {
        await testMod[mod.fn]()
        passed++
      }
    } catch (error) {
      failed++
      console.error(`\n✗ ${mod.name} falló: ${error.message}`)
      console.error(error.stack)
    } finally {
      resetDOM()
    }
  }

  const total = testModules.length + integrationModules.length
  console.log(`\n${'='.repeat(40)}`)
  console.log(`Total: ${total} | Pasaron: ${passed} | Fallaron: ${failed}`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
