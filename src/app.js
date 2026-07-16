/*
 * Open RootERP — ERP 100% offline, open source, libre y gratuito
 * Copyright (C) 2024 Adónis Adonai Gómez Martínez <adonizgomez00@gmail.com>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

import { db } from './database/db.js'
import { seedData } from './database/seed.js'
import { ProductRepository } from './repositories/ProductRepository.js'
import { ProductService } from './services/ProductService.js'
import { ProductController } from './controllers/ProductController.js'
import { ProductView } from './views/ProductView.js'
import { CustomerRepository } from './repositories/CustomerRepository.js'
import { CustomerService } from './services/CustomerService.js'
import { CustomerController } from './controllers/CustomerController.js'
import { CustomerView } from './views/CustomerView.js'
import { InventoryRepository } from './repositories/InventoryRepository.js'
import { InventoryService } from './services/InventoryService.js'
import { InventoryController } from './controllers/InventoryController.js'
import { InventoryView } from './views/InventoryView.js'
import { SaleRepository } from './repositories/SaleRepository.js'
import { SaleService } from './services/SaleService.js'
import { SaleController } from './controllers/SaleController.js'
import { SaleView } from './views/SaleView.js'
import { SupplierRepository } from './repositories/SupplierRepository.js'
import { SupplierService } from './services/SupplierService.js'
import { SupplierController } from './controllers/SupplierController.js'
import { SupplierView } from './views/SupplierView.js'
import { PurchaseRepository } from './repositories/PurchaseRepository.js'
import { PurchaseService } from './services/PurchaseService.js'
import { PurchaseController } from './controllers/PurchaseController.js'
import { PurchaseView } from './views/PurchaseView.js'
import { ReportService } from './services/ReportService.js'
import { ReportController } from './controllers/ReportController.js'
import { ReportView } from './views/ReportView.js'
import { ReportRepository } from './repositories/ReportRepository.js'
import { DashboardService } from './services/DashboardService.js'
import { DashboardController } from './controllers/DashboardController.js'
import { DashboardView } from './views/DashboardView.js'
import { SettingRepository } from './repositories/SettingRepository.js'
import { SettingService } from './services/SettingService.js'
import { SettingsController } from './controllers/SettingsController.js'
import { SettingsView } from './views/SettingsView.js'
import { ExportService } from './services/ExportService.js'
import { ExportController } from './controllers/ExportController.js'
import { ExportView } from './views/ExportView.js'
import { ImportService } from './services/ImportService.js'
import { ImportController } from './controllers/ImportController.js'
import { ImportView } from './views/ImportView.js'
import { Sidebar } from './components/Sidebar.js'
import { setCurrencySymbol, setTaxRate } from './utils/formatters.js'
import { clearElement } from './utils/helpers.js'
import { Header } from './components/Header.js'
import { ThemeManager } from './utils/ThemeManager.js'
import { UserRepository } from './repositories/UserRepository.js'
import { RoleRepository } from './repositories/RoleRepository.js'
import { PermissionRepository } from './repositories/PermissionRepository.js'
import { SessionRepository } from './repositories/SessionRepository.js'
import { PasswordService } from './services/PasswordService.js'
import { SessionService } from './services/SessionService.js'
import { PermissionService } from './services/PermissionService.js'
import { AuthenticationService } from './services/AuthenticationService.js'
import { SystemService } from './services/SystemService.js'
import { LoginView } from './views/LoginView.js'
import { SetupView } from './views/SetupView.js'
import { LoginController } from './controllers/LoginController.js'
import { SetupController } from './controllers/SetupController.js'
import { UserController } from './controllers/UserController.js'
import { UserView } from './views/UserView.js'
import { AccountingRepository } from './repositories/AccountingRepository.js'
import { AccountingService } from './services/AccountingService.js'
import { AccountingController } from './controllers/AccountingController.js'
import { AccountingView } from './views/AccountingView.js'

async function main() {
  await db.open()
  await seedData(db)
  const app = document.getElementById('app')

  const themeManager = ThemeManager.getInstance()
  themeManager.init()

  const settingRepo = new SettingRepository(db)
  const userRepo = new UserRepository(db)
  const roleRepo = new RoleRepository(db)
  const permRepo = new PermissionRepository(db)
  const sessionRepo = new SessionRepository(db)
  const passwordService = new PasswordService()
  const sessionService = new SessionService(sessionRepo)
  const permissionService = new PermissionService(permRepo, roleRepo)
  const authService = new AuthenticationService(userRepo, sessionService, passwordService)
  const systemService = new SystemService(userRepo, roleRepo, permRepo, settingRepo)
  await systemService.ensureDefaultPermissions()
  const currencySymbol = await settingRepo.get('currency_symbol')
  if (currencySymbol) setCurrencySymbol(currencySymbol)
  const taxRate = await settingRepo.get('tax_rate')
  if (taxRate) setTaxRate(taxRate)
  const main = document.createElement('main')
  main.className = 'main-content'
  main.id = 'main-content'

  let header = null
  let _userPermissions = {}
  let _currentUser = null

  async function buildPermissions() {
    const session = await authService.getCurrentUser()
    _currentUser = session
    if (!session) {
      _userPermissions = {}
      return
    }
    const roleId = session.roleId
    const [canCancelSales, canCancelPurchases, canDeleteSales, canDeletePurchases, canImport, canCreateUsers, canEditUsers, canDeleteUsers, canViewUsers, isAdmin] = await Promise.all([
      permissionService.hasPermission(roleId, 'sales.cancel'),
      permissionService.hasPermission(roleId, 'purchases.cancel'),
      permissionService.hasPermission(roleId, 'sales.delete'),
      permissionService.hasPermission(roleId, 'purchases.delete'),
      permissionService.hasPermission(roleId, 'imports.create'),
      permissionService.hasPermission(roleId, 'users.create'),
      permissionService.hasPermission(roleId, 'users.edit'),
      permissionService.hasPermission(roleId, 'users.delete'),
      permissionService.hasPermission(roleId, 'users.view'),
      permissionService.isAdmin(roleId)
    ])
    _userPermissions = { canCancelSales, canCancelPurchases, canDeleteSales, canDeletePurchases, canImport, canCreateUsers, canEditUsers, canDeleteUsers, canViewUsers, isAdmin, roleId }
  }

  async function startApp() {
    await buildPermissions()
    clearElement(app)
    const sidebarItems = [
      { id: 'dashboard', label: 'Dashboard', icon: '\u25a0' },
      { id: 'products', label: 'Productos', icon: '\u2616' },
      { id: 'customers', label: 'Clientes', icon: '\u263a' },
      { id: 'suppliers', label: 'Proveedores', icon: '\u2191' },
      { id: 'sales', label: 'Ventas', icon: '\u2714' },
      { id: 'purchases', label: 'Compras', icon: '\u2190' },
      { id: 'inventory', label: 'Inventario', icon: '\u25a3' },
      { id: 'reports', label: 'Reportes', icon: '\u2261' },
      { id: 'accounting', label: 'Contabilidad', icon: '\u2630' },
      { id: 'settings', label: 'Configuración', icon: '\u2699' },
      { id: 'exports', label: 'Exportar', icon: '\u2197' },
      { id: 'imports', label: 'Importar', icon: '\u2193' }
    ]
    if (_userPermissions.canViewUsers) {
      sidebarItems.push({ id: 'users', label: 'Usuarios', icon: '\u263c' })
    }
    const sidebar = new Sidebar({
      brandName: 'Open RootERP',
      brandIcon: '\u2699',
      items: sidebarItems,
      onNavigate: (id) => navigate(id)
    })
    const logoutBtn = document.createElement('button')
    logoutBtn.className = 'btn btn--sm btn--ghost'
    logoutBtn.textContent = 'Cerrar Sesión'
    logoutBtn.addEventListener('click', async () => {
      await authService.logout()
      showLogin()
    })
    const themeToggle = themeManager.renderToggle()
    header = new Header({
      title: 'Dashboard',
      onMenuToggle: () => sidebar.toggleMobile(),
      actions: [themeToggle, logoutBtn]
    })
    app.appendChild(sidebar.render())
    app.appendChild(header.render())
    app.appendChild(main)
    navigate('dashboard')
  }

  function navigate(moduleId) {
    clearElement(main)
    switch (moduleId) {
      case 'dashboard': header.setTitle('Dashboard'); loadDashboard(main); break
      case 'products': header.setTitle('Productos'); loadProducts(main); break
      case 'customers': header.setTitle('Clientes'); loadCustomers(main); break
      case 'reports': header.setTitle('Reportes'); loadReports(main); break
      case 'inventory': header.setTitle('Inventario'); loadInventory(main); break
      case 'suppliers': header.setTitle('Proveedores'); loadSuppliers(main); break
      case 'purchases': header.setTitle('Compras'); loadPurchases(main); break
      case 'sales': header.setTitle('Ventas'); loadSales(main); break
      case 'settings': header.setTitle('Configuración'); loadSettings(main); break
      case 'exports': header.setTitle('Exportar Datos'); loadExports(main); break
      case 'imports': header.setTitle('Importar Datos'); loadImports(main); break
      case 'accounting': header.setTitle('Contabilidad'); loadAccounting(main); break
      case 'users': header.setTitle('Usuarios'); loadUsers(main); break
      default: {
        const div = document.createElement('div')
        div.className = 'placeholder'
        const p = document.createElement('p')
        p.textContent = `Módulo "${moduleId}" en construcción`
        div.appendChild(p)
        main.appendChild(div)
        break
      }
    }
  }

  function loadSettings(container) {
    const settingService = new SettingService(settingRepo)
    const settingsView = new SettingsView()
    const settingsController = new SettingsController(settingService, settingsView, settingRepo)
    settingsController.init(container)
  }

  function loadExports(container) {
    const productRepo = new ProductRepository(db)
    const customerRepo = new CustomerRepository(db)
    const supplierRepo = new SupplierRepository(db)
    const saleRepo = new SaleRepository(db)
    const purchaseRepo = new PurchaseRepository(db)
    const inventoryRepo = new InventoryRepository(db)
    const exportService = new ExportService(productRepo, customerRepo, supplierRepo, saleRepo, purchaseRepo, inventoryRepo, settingRepo)
    const exportView = new ExportView()
    const exportController = new ExportController(exportService, exportView)
    exportController.init(container)
  }

  function loadImports(container) {
    const productRepo = new ProductRepository(db)
    const customerRepo = new CustomerRepository(db)
    const supplierRepo = new SupplierRepository(db)
    const settingRepo = new SettingRepository(db)
    const saleRepo = new SaleRepository(db)
    const purchaseRepo = new PurchaseRepository(db)
    const inventoryRepo = new InventoryRepository(db)
    const reportRepo = new ReportRepository(db)
    const importService = new ImportService(productRepo, customerRepo, supplierRepo, settingRepo, saleRepo, purchaseRepo, inventoryRepo, reportRepo)
    const importView = new ImportView()
    const importController = new ImportController(importService, importView, _userPermissions)
    importController.init(container)
  }

  function loadUsers(container) {
    const userView = new UserView()
    const userController = new UserController(userRepo, roleRepo, passwordService, userView, _userPermissions)
    userController.init(container)
  }

  function loadDashboard(container) {
    const productRepo = new ProductRepository(db)
    const customerRepo = new CustomerRepository(db)
    const supplierRepo = new SupplierRepository(db)
    const saleRepo = new SaleRepository(db)
    const purchaseRepo = new PurchaseRepository(db)
    const inventoryRepo = new InventoryRepository(db)
    const dashboardService = new DashboardService(saleRepo, purchaseRepo, productRepo, customerRepo, supplierRepo, inventoryRepo)
    const dashboardView = new DashboardView()
    const dashboardController = new DashboardController(dashboardService, dashboardView)
    dashboardController.init(container)
  }

  function loadProducts(container) {
    const productRepo = new ProductRepository(db)
    const productService = new ProductService(productRepo)
    const productView = new ProductView()
    const productController = new ProductController(productService, productView, productRepo)
    productController.init(container)
  }

  function loadCustomers(container) {
    const customerRepo = new CustomerRepository(db)
    const customerService = new CustomerService(customerRepo)
    const customerView = new CustomerView()
    const customerController = new CustomerController(customerService, customerView, customerRepo)
    customerController.init(container)
  }

  function loadInventory(container) {
    const productRepo = new ProductRepository(db)
    const inventoryRepo = new InventoryRepository(db)
    const inventoryService = new InventoryService(db, productRepo, inventoryRepo)
    const inventoryView = new InventoryView()
    const inventoryController = new InventoryController(inventoryService, inventoryView)
    inventoryController.init(container)
  }

  function loadSuppliers(container) {
    const supplierRepo = new SupplierRepository(db)
    const supplierService = new SupplierService(supplierRepo)
    const supplierView = new SupplierView()
    const supplierController = new SupplierController(supplierService, supplierView, supplierRepo)
    supplierController.init(container)
  }

  function loadReports(container) {
    const saleRepo = new SaleRepository(db)
    const purchaseRepo = new PurchaseRepository(db)
    const productRepo = new ProductRepository(db)
    const customerRepo = new CustomerRepository(db)
    const supplierRepo = new SupplierRepository(db)
    const inventoryRepo = new InventoryRepository(db)
    const reportService = new ReportService(saleRepo, purchaseRepo, productRepo, customerRepo, supplierRepo, inventoryRepo)
    const reportView = new ReportView()
    const reportController = new ReportController(reportService, reportView)
    reportController.init(container)
  }

  let _accountingService = null

  function getAccountingService() {
    if (!_accountingService) {
      const acctRepo = new AccountingRepository(db)
      _accountingService = new AccountingService(acctRepo)
    }
    return _accountingService
  }

  function loadPurchases(container) {
    const productRepo = new ProductRepository(db)
    const supplierRepo = new SupplierRepository(db)
    const purchaseRepo = new PurchaseRepository(db)
    const inventoryRepo = new InventoryRepository(db)
    const purchaseService = new PurchaseService(db, purchaseRepo, productRepo, supplierRepo, inventoryRepo)
    const productService = new ProductService(productRepo)
    const supplierService = new SupplierService(supplierRepo)
    const purchaseView = new PurchaseView()
    const purchaseController = new PurchaseController(purchaseService, purchaseView, productService, supplierService, _userPermissions, getAccountingService())
    purchaseController.init(container)
  }

  function loadSales(container) {
    const productRepo = new ProductRepository(db)
    const customerRepo = new CustomerRepository(db)
    const saleRepo = new SaleRepository(db)
    const inventoryRepo = new InventoryRepository(db)
    const saleService = new SaleService(db, saleRepo, productRepo, customerRepo, inventoryRepo)
    const productService = new ProductService(productRepo)
    const customerService = new CustomerService(customerRepo)
    const saleView = new SaleView()
    const saleController = new SaleController(saleService, saleView, productService, customerService, _userPermissions, getAccountingService())
    saleController.init(container)
  }

  function loadAccounting(container) {
    const acctRepo = new AccountingRepository(db)
    const acctService = new AccountingService(acctRepo)
    const acctView = new AccountingView()
    const acctController = new AccountingController(acctService, acctView)
    acctController.init(container)
  }

  function showSetup() {
    clearElement(app)
    app.appendChild(main)
    const setupView = new SetupView()
    const setupController = new SetupController(
      systemService, passwordService, authService, setupView,
      () => showLogin()
    )
    setupController.init(main)
  }

  function showLogin() {
    clearElement(app)
    app.appendChild(main)
    const loginView = new LoginView()
    const loginController = new LoginController(
      authService, loginView,
      () => startApp()
    )
    loginController.init(main)
  }

  if (await systemService.isFirstRun()) { showSetup(); return }
  if (await authService.getCurrentUser()) { await startApp(); return }
  showLogin()
}

document.addEventListener('DOMContentLoaded', () => {
  main().catch(err => {
    console.error('Error al iniciar la aplicación:', err)
    const app = document.getElementById('app')
    if (app) {
      const container = document.createElement('div')
      container.style.cssText = 'padding:2rem;text-align:center;font-family:sans-serif'

      const heading = document.createElement('h2')
      heading.style.cssText = 'color:#dc2626'
      heading.textContent = 'Error al cargar la aplicación'
      container.appendChild(heading)

      const msg = document.createElement('p')
      msg.textContent = 'Parece que la base de datos local está corrupta.'
      container.appendChild(msg)

      const detail = document.createElement('p')
      detail.style.cssText = 'font-size:0.9rem;color:#6b7280'
      detail.textContent = err.message || err
      container.appendChild(detail)

      const resetBtn = document.createElement('button')
      resetBtn.style.cssText = 'margin-top:1rem;padding:0.75rem 1.5rem;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer'
      resetBtn.textContent = 'Restablecer base de datos y recargar'
      resetBtn.addEventListener('click', () => {
        indexedDB.deleteDatabase('ERPLigero')
        location.reload()
      })
      container.appendChild(resetBtn)

      app.appendChild(container)
    }
  })
})
