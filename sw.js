const CACHE_NAME = 'erp-ligero-v7'
const STATIC_CACHE = 'erp-ligero-static-v7'

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/main.css',
  '/assets/css/variables.css',
  '/assets/css/reset.css',
  '/assets/css/layout.css',
  '/assets/css/components.css',
  '/assets/css/utilities.css',
  '/assets/lib/dexie.js',
  '/assets/lib/chart.umd.min.js',
  '/assets/icons/icon-192.svg',
  '/assets/icons/icon-512.svg',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/src/app.js',
  '/src/config/app.js',
  '/src/database/db.js',
  '/src/database/seed.js',
  '/src/store/AppState.js',
  '/src/utils/errors.js',
  '/src/utils/formatters.js',
  '/src/utils/helpers.js',
  '/src/utils/sanitizer.js',
  '/src/utils/validators.js',
  '/src/models/Product.js',
  '/src/models/Customer.js',
  '/src/models/Supplier.js',
  '/src/models/Sale.js',
  '/src/models/SaleItem.js',
  '/src/models/Purchase.js',
  '/src/models/PurchaseItem.js',
  '/src/models/InventoryMovement.js',
  '/src/models/Setting.js',
  '/src/models/User.js',
  '/src/models/Role.js',
  '/src/models/Permission.js',
  '/src/models/RolePermission.js',
  '/src/models/Session.js',
  '/src/repositories/ProductRepository.js',
  '/src/repositories/CustomerRepository.js',
  '/src/repositories/SupplierRepository.js',
  '/src/repositories/SaleRepository.js',
  '/src/repositories/PurchaseRepository.js',
  '/src/repositories/InventoryRepository.js',
  '/src/repositories/SettingRepository.js',
  '/src/repositories/ReportRepository.js',
  '/src/repositories/UserRepository.js',
  '/src/repositories/RoleRepository.js',
  '/src/repositories/PermissionRepository.js',
  '/src/repositories/SessionRepository.js',
  '/src/services/ProductService.js',
  '/src/services/CustomerService.js',
  '/src/services/SupplierService.js',
  '/src/services/SaleService.js',
  '/src/services/PurchaseService.js',
  '/src/services/InventoryService.js',
  '/src/services/ReportService.js',
  '/src/services/SettingService.js',
  '/src/services/ExportService.js',
  '/src/services/ImportService.js',
  '/src/services/DashboardService.js',
  '/src/services/PasswordService.js',
  '/src/services/SessionService.js',
  '/src/services/PermissionService.js',
  '/src/services/AuthenticationService.js',
  '/src/services/SystemService.js',
  '/src/controllers/ProductController.js',
  '/src/controllers/CustomerController.js',
  '/src/controllers/SupplierController.js',
  '/src/controllers/SaleController.js',
  '/src/controllers/PurchaseController.js',
  '/src/controllers/InventoryController.js',
  '/src/controllers/DashboardController.js',
  '/src/controllers/ReportController.js',
  '/src/controllers/SettingController.js',
  '/src/controllers/SettingsController.js',
  '/src/controllers/ExportController.js',
  '/src/controllers/ImportController.js',
  '/src/controllers/LoginController.js',
  '/src/controllers/SetupController.js',
  '/src/views/ProductView.js',
  '/src/views/CustomerView.js',
  '/src/views/SupplierView.js',
  '/src/views/SaleView.js',
  '/src/views/SaleFormView.js',
  '/src/views/PurchaseView.js',
  '/src/views/PurchaseFormView.js',
  '/src/views/InventoryView.js',
  '/src/views/DashboardView.js',
  '/src/views/ReportView.js',
  '/src/views/SettingsView.js',
  '/src/views/SettingView.js',
  '/src/views/ExportView.js',
  '/src/views/ImportView.js',
  '/src/views/LoginView.js',
  '/src/views/SetupView.js',
  '/src/components/Sidebar.js',
  '/src/components/Header.js',
  '/src/components/Table.js',
  '/src/components/Form.js',
  '/src/components/Modal.js',
  '/src/components/Toast.js',
  '/src/components/Loader.js',
  '/src/components/Pagination.js',
  '/src/components/SearchBar.js',
  '/src/components/ConfirmDialog.js',
  '/src/controllers/UserController.js',
  '/src/views/UserView.js',
  '/src/models/Account.js',
  '/src/models/AccountingEntry.js',
  '/src/repositories/AccountingRepository.js',
  '/src/services/AccountingService.js',
  '/src/controllers/AccountingController.js',
  '/src/views/AccountingView.js'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS)
    }).then(() => {
      return self.skipWaiting()
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    )
    return
  }

  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/src/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        }).catch(() => cached)
        return cached || fetchPromise
      })
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request)
    })
  )
})
