# TODO — Open RootERP

**Versión:** 1.0.0  
**Estado:** Primer lanzamiento público. 45 suites unit/integration, 76 escenarios E2E adversariales

---

## Fase 1 — Fundación (MVP) ✅

### 1.1 Scaffolding
- [x] Crear estructura completa de directorios
- [x] Crear `index.html` con layout base SPA
- [x] Crear `manifest.json` para PWA
- [x] Crear `sw.js` con Service Worker básico
- [x] Crear `src/app.js` con inicialización y router
- [x] Crear `src/config/app.js` con constantes del sistema
- [x] Crear `assets/css/variables.css` con Custom Properties
- [x] Crear `assets/css/reset.css` con normalize básico
- [x] Crear `assets/css/layout.css` con grid y sidebar
- [x] Crear `assets/css/components.css` con estilos de componentes
- [x] Crear `assets/css/utilities.css` con clases auxiliares
- [x] Crear `assets/css/main.css` que importe todos los CSS

### 1.2 Database
- [x] Crear `src/database/db.js` con schema Dexie completo
- [x] Crear `src/database/seed.js` con datos de ejemplo
- [x] Definir modelos en `src/models/`:
  - [x] `Product.js`
  - [x] `Customer.js`
  - [x] `Supplier.js`
  - [x] `Sale.js`
  - [x] `SaleItem.js`
  - [x] `Purchase.js`
  - [x] `PurchaseItem.js`
  - [x] `InventoryMovement.js`
  - [x] `Setting.js`
  - [x] `User.js`
  - [x] `Role.js`
  - [x] `Permission.js`
  - [x] `RolePermission.js`
  - [x] `Session.js`
  - [x] `Account.js`
  - [x] `AccountingEntry.js`

### 1.3 Core UI
- [x] Crear `src/components/Sidebar.js` — navegación entre módulos
- [x] Crear `src/components/Header.js` — barra superior con título y búsqueda global
- [x] Crear `src/components/Modal.js` — ventana modal reutilizable
- [x] Crear `src/components/Toast.js` — notificaciones temporales
- [x] Crear `src/components/ConfirmDialog.js` — confirmación de acciones
- [x] Crear `src/components/SearchBar.js` — input de búsqueda
- [x] Crear `src/components/Table.js` — tabla genérica con soporte de acciones
- [x] Crear `src/components/Pagination.js` — paginación reutilizable
- [x] Crear `src/components/Form.js` — generador de formularios por configuración
- [x] Crear `src/components/Loader.js` — indicador de carga
- [x] Crear `src/store/AppState.js` — estado global de la app

### 1.4 Productos
- [x] Crear `src/repositories/ProductRepository.js`
- [x] Crear `src/services/ProductService.js`
- [x] Crear `src/controllers/ProductController.js`
- [x] Crear `src/views/ProductView.js`
- [x] Implementar listar productos con búsqueda y paginación
- [x] Implementar crear producto
- [x] Implementar editar producto
- [x] Implementar eliminar producto (con confirmación)
- [x] Implementar ver detalle de producto

### 1.5 Clientes
- [x] Crear `src/repositories/CustomerRepository.js`
- [x] Crear `src/services/CustomerService.js`
- [x] Crear `src/controllers/CustomerController.js`
- [x] Crear `src/views/CustomerView.js`
- [x] Implementar CRUD completo de clientes

### 1.6 Proveedores
- [x] Crear `src/repositories/SupplierRepository.js`
- [x] Crear `src/services/SupplierService.js`
- [x] Crear `src/controllers/SupplierController.js`
- [x] Crear `src/views/SupplierView.js`
- [x] Implementar CRUD completo de proveedores

### 1.7 Ventas
- [x] Crear `src/repositories/SaleRepository.js`
- [x] Crear `src/services/SaleService.js`
- [x] Crear `src/controllers/SaleController.js`
- [x] Crear `src/views/SaleView.js`
- [x] Crear `src/views/SaleFormView.js`
- [x] Implementar registro de venta (selección de cliente, productos, cantidades)
- [x] Implementar cálculo automático de totales
- [x] Implementar listado de ventas con filtros
- [x] Implementar detalle de venta
- [x] Implementar anulación de venta

### 1.8 Compras
- [x] Crear `src/repositories/PurchaseRepository.js`
- [x] Crear `src/services/PurchaseService.js`
- [x] Crear `src/controllers/PurchaseController.js`
- [x] Crear `src/views/PurchaseView.js`
- [x] Crear `src/views/PurchaseFormView.js`
- [x] Implementar registro de compra
- [x] Implementar listado de compras
- [x] Implementar detalle de compra

### 1.9 Dashboard
- [x] Crear `src/controllers/DashboardController.js`
- [x] Crear `src/views/DashboardView.js`
- [x] Mostrar resumen: total productos, clientes, ventas del día
- [x] Mostrar últimas ventas
- [x] Mostrar productos con stock bajo

### 1.10 Service Worker
- [x] Implementar `sw.js` con caché de assets
- [x] Configurar estrategia Cache First para archivos estáticos
- [x] Probar funcionamiento offline

---

## Fase 2 — Inventario y Movimientos ✅

### 2.1 Control de Stock
- [x] Crear `src/repositories/InventoryRepository.js`
- [x] Crear `src/services/InventoryService.js`
- [x] Implementar cálculo de stock actual por producto
- [x] Implementar costo promedio ponderado

### 2.2 Movimientos
- [x] Crear `src/controllers/InventoryController.js`
- [x] Crear `src/views/InventoryView.js`
- [x] Implementar registro de ajuste de inventario
- [x] Implementar historial de movimientos por producto

### 2.3 Alertas
- [x] Implementar alerta de stock mínimo en dashboard
- [x] Implementar alerta de stock crítico

---

## Fase 3 — Contabilidad Básica ✅

### 3.1 Libro Diario
- [x] Crear modelo `AccountingEntry`
- [x] Crear repositorio `AccountingRepository.js`
- [x] Crear servicio `AccountingService.js`
- [x] Generar asientos automáticos desde ventas y compras (incluye anulaciones)

### 3.2 Plan de Cuentas
- [x] Crear modelo `Account`
- [x] Implementar catálogo de cuentas configurable (7 cuentas predefinidas en seed)

### 3.3 Reportes Contables
- [x] Implementar Balance General
- [x] Implementar Estado de Resultados

---

## Fase 4 — Reportes y Exportación ✅

### 4.1 Reportes
- [x] Crear `src/services/ReportService.js`
- [x] Reporte de ventas por período
- [x] Reporte de productos más vendidos
- [x] Reporte de compras por proveedor
- [x] Reporte de stock con estados

### 4.2 Exportación
- [x] Implementar exportación a CSV
- [x] Implementar exportación a JSON
- [x] Exportación completa multi-entidad

### 4.3 Gráficos ✅
- [x] Integrar Chart.js 4.x (`assets/lib/chart.umd.min.js`)
- [x] Gráfico de ventas mensuales en dashboard (barras)
- [x] Gráfico de productos por categoría en dashboard (dona)

---

## Fase 5 — Calidad y Pruebas ✅ Completa

### 5.1 Tests Unitarios
- [x] Tests para `src/utils/validators.js`
- [x] Tests para `src/utils/formatters.js`
- [x] Tests para `src/utils/sanitizer.js`
- [x] Tests para `src/utils/helpers.js`
- [x] Tests para `src/utils/errors.js`
- [x] Tests para cada Service (13 archivos)
- [x] Tests para cada Controller (10 archivos)
- [x] Tests para cada Repository (con mock de Dexie)

### 5.2 Tests de Integración
- [x] Test de flujo completo: crear producto → vender → ver stock
- [x] Test de flujo completo: crear compra → actualizar inventario
- [x] Test de flujo contable: venta → asiento → balance
- [x] Test de flujo contable: compra → asiento → balance
- [x] Test de anulación de venta con reversión contable
- [x] Test de anulación de compra con reversión contable
- [x] Test de stock insuficiente
- [x] Test de reportes financieros
- [x] Tests de integración adicionales para import/export (10 tests: full export/import, CSV round-trip, stock updates, ocasional customer, auto-detect flows, ambiguity handling, JSON round-trip)

### 5.2 Tests de Integración — Completado ✅

Todos los flujos de import/export cubiertos con 10 tests de integración:
- Export round-trip: exportar todas las entidades → limpiar DB → reimportar → verificar integridad
- CSV export → CSV import: productos y clientes
- Import inventory con actualización de stock (entry y exit)
- Import ventas con cliente ocasional (auto-creación y detección de duplicados)
- Import export completo con asientos contables
- Auto-detección de entidades en flujo completo
- Manejo de ambigüedad cliente/proveedor
- JSON export → JSON import via full export
- Import con arrays vacíos (edge case)

**Total: 9 suites de integración · 54 tests integración · 0 fallos**

### 5.3 Auditoría de Seguridad ✅

**Resultados de la auditoría (Jul 2026):**

| Ítem | Estado | Hallazgos |
|------|--------|-----------|
| `innerHTML` | 🔧 Corregido | 38 usos de `innerHTML = ''` (limpiar contenedores — seguro). 1 uso con datos dinámicos en `app.js:366` (error handler) — **corregido a DOM API** (`createElement` + `textContent`) |
| `eval()` / `new Function()` | ✅ No hay | 0 ocurrencias en producción |
| `document.write()` | ✅ No hay | 0 ocurrencias |
| Sanitización de entradas | 🔧 Mejorado | `sanitizer.js` existe con `escapeHtml`, `stripTags`, `sanitizeString`, `sanitizeObject`, `sanitizeNumeric`, `sanitizeAlphanumeric`. **Antes**: no era importado por ningún módulo. **Ahora**: `ImportService._sanitizeRecord` usa `stripTags` para limpiar HTML de datos importados |
| Datos sensibles en logs | ✅ No hay | 7 `console.*` llamadas: solo mensajes de error genéricos (sin contraseñas, tokens, ni información sensible) |
| localStorage | ✅ Aceptable | Solo para token de sesión (esperado en app offline) |
| Chart.js labels | ✅ Seguro | Datos de usuario pasados como `labels` a Chart.js (renderizado en canvas, no HTML) |

**Resumen:** Sin vulnerabilidades críticas. Arquitectura segura por diseño gracias al uso consistente de `textContent` en lugar de `innerHTML` para datos dinámicos. Se corrigió el único punto de mejora (error handler en `app.js`) y se integró sanitización en ImportService.

### 5.4 Performance ✅

**Schema DB v8** — índices compuestos añadidos:
- `products`: añadido índice `stock`
- `sales`: añadido índice `[customerId+date]`
- `purchases`: añadido índice `[supplierId+date]`
- `accountingEntries`: añadido índice `[referenceType+referenceId]`

**Repositorios optimizados (full scan → índice Dexie):**
- `AccountingRepository.findEntriesByReference()`: full scan → `where('[referenceType+referenceId]').equals()`
- `ProductRepository.findLowStock()`: full scan → `where('stock').belowOrEqual()`
- `SessionRepository.deleteExpired()`: full scan → `where('expiresAt').below()`
- `SaleRepository.findByCustomerAndDate()`: `.and()` en memoria → `between([customerId, date], ...)`
- `PurchaseRepository.findBySupplierAndDate()`: `.and()` en memoria → `between([supplierId, date], ...)`
- `SettingRepository.getMany()`: full scan → `where('key').anyOf()`
- `ReportRepository._generateStockReport()`: N+1 queries → batch `anyOf(productIds)` en InventoryRepository

**Renderizado optimizado:**
- `SaleFormView._renderCart()`: DocumentFragment para batch DOM
- `PurchaseFormView._renderCart()`: DocumentFragment para batch DOM
- `Table._renderBody()`: DocumentFragment para batch DOM

**Total: 45 suites · 0 fallos**

---

## Fase 6 — UX y Pulido ✅

### 6.1 Temas ✅
- [x] Implementar modo claro/oscuro vía CSS Custom Properties
- [x] Persistir preferencia en localStorage

### 6.2 Accesibilidad ✅
- [x] Roles ARIA en componentes
- [x] Navegación por teclado
- [x] Contraste suficiente
- [x] Etiquetas en formularios

### 6.3 Offline Avanzado
- [ ] PWA installable (✅ Ya implementado)
- [ ] Estrategia de sincronización futura (cuando haya backend)

---

## Convenios de Código

- Nombres de archivos: `PascalCase.js` para clases, `kebab-case.css`
- Exportaciones: `export default class` en cada archivo
- Importaciones sin extensiones (import map o manual)
- Variables: `camelCase`
- Constantes: `UPPER_SNAKE_CASE`
- Archivos máx 300 líneas
- Funciones máx 40 líneas
- Una clase por archivo
- Una responsabilidad por clase

## Checklist por Archivo

Cada módulo nuevo debe incluir:
- [ ] Modelo
- [ ] Repository
- [ ] Service
- [ ] Controller
- [ ] View
- [ ] Tests (al menos unitarios del service)

---

## Estado actual de tests

**Total: 45 suites · 410+ tests · 0 fallos**

### Suites de Service (13)
- PasswordService: 8 tests
- SessionService: 7 tests
- PermissionService: 12 tests
- AuthenticationService: 6 tests
- SystemService: 7 tests
- ProductService: 9 tests
- CustomerService: 7 tests
- SupplierService: 7 tests
- InventoryService: 8 tests
- SaleService: 9 tests
- PurchaseService: 8 tests
- ReportService: 6 tests
- AccountingService: 12 tests
- ExportService: 7 tests
- ImportService: 23 tests
- SettingService: 11 tests
- DashboardService: 10 tests

### Suites de Controller (10)
- LoginController: 6 tests
- SetupController: 6 tests
- ProductController: 7 tests
- CustomerController: 7 tests
- SupplierController: 7 tests
- InventoryController: 6 tests
- SaleController: 7 tests
- PurchaseController: 7 tests
- ReportController: 6 tests
- SettingsController: 9 tests
- ExportController: 5 tests
- ImportController: 7 tests
- UserController: 7 tests
- AccountingController: 12 tests
- DashboardController: 7 tests

### Tests de Integración (9 suites, 54+ tests)
- testSaleAccountingFlow
- testPurchaseAccountingFlow
- testCancelSaleFlow
- testCancelPurchaseFlow
- testDeleteSaleFlow
- testDeletePurchaseFlow
- testInsufficientStock
- testFinancialReports (2 tests)
- testExportFullDataAndReimport
- testExportCSVAndReimportProducts
- testExportCSVAndReimportCustomers
- testImportInventoryUpdatesStock
- testImportSalesWithOcasionalCustomer
- testImportFullExportWithAccountingEntries
- testImportAutoDetectFullFlow
- testImportRequiresManualEntitySelection
- testExportJSONAndReimportWithFullExport
- testImportFullExportEmptyArrays

---

## Deuda técnica resuelta en v1.4.0

- [x] ~~**AccountingView.js supera 300 líneas** (624 líneas):~~ Dividido en 4 sub-vistas: AccountingAccountsView, AccountingJournalView, AccountingBalanceView, AccountingIncomeView. Container (235) + sub-vistas (151, 117, 90, 94) = todos bajo 300.
- [x] ~~**ReportView.js ligeramente sobre 300 líneas** (329):~~ Dividido en 3 sub-vistas: ReportSalesView, ReportPurchasesView, ReportStockView. Container (205) + sub-vistas (52, 52, 51) = todos bajo 300.
- [x] ~~**PurchaseFormView.js ligeramente sobre 300 líneas** (306):~~ Ya estaba en 299 líneas, dentro del límite.

## Deuda técnica restante

- [x] ~~**Sin pruebas e2e**: Solo tests unitarios con mocks~~ ✅ 38 tests E2E (Playwright + Chromium)
- [ ] **Seguridad client-side**: RBAC se evalúa en el navegador. Aceptable para ERP offline.