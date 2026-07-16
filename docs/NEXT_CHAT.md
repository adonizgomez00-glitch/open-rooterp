# Resumen de Continuidad — v1.0.0

## Estado actual (Jul 16 2026)

**v1.0.0 — Primer lanzamiento público** — 76 escenarios E2E adversariales + 410+ unit/integration tests, 0 fallos. Todos los módulos planificados implementados, documentación completa.

## Qué ya está implementado

### Arquitectura base
- MVC + Repository + Service, 100 % offline, ES Modules, vanilla JS.
- Dexie 4 como capa de IndexedDB con 8 versiones de schema (v4 añadió auth, v5 añadió contabilidad, v6 idéntica a v5, v7 migración renombres de cuentas, v8 añadió índices compuestos `[customerId+date]` en sales, `[supplierId+date]` en purchases, `[referenceType+referenceId]` en accountingEntries, `stock` en products).
- Seed data: 10 productos, 5 clientes, 3 proveedores, 7 settings, 10 movimientos de inventario iniciales, 2 ventas, 2 compras, asientos contables.
- `src/app.js` con router interno e inyección de dependencias manual.

### Módulos completos (con tests)

| Módulo | Service | Controller | View | Tests |
|--------|---------|------------|------|-------|
| **Productos** | CRUD + lowStock + byCategory + search | init + search + create + edit + delete | Form modal, tabla, toolbar, search | 9 service + 7 controller |
| **Clientes** | CRUD + search | init + search + create + edit + delete | Form modal, tabla, toolbar, search | 7 service + 7 controller |
| **Inventario** | Stock overview + adjustments + movements | init + search + adjust + showMovements | Tabla con estado, ajuste modal, historial modal | 8 service + 6 controller |
| **Ventas** | Create (stock validation, tx atómica) + cancel (stock revert) | init + newSale + create + detail + cancel | Carrito en modal, detalle modal, confirmación anulación | 9 service + 7 controller |
| **Proveedores** | CRUD + search | init + search + create + edit + delete | Formulario modal, tabla, toolbar, search | 7 service + 7 controller |
| **Compras** | Create (tx atómica, entrada stock) + cancel (stock revert) | init + newPurchase + create + detail + cancel | Formulario simplificado, detalle modal, confirmación anulación | 8 service + 7 controller |
| **Reportes** | Sales report, purchases report, stock report, summary | init + tabChange + generateReport | Tabs, filtros fecha, tablas de reportes, resumen | 6 service + 6 controller |
| **Dashboard** | KPIs (ventas día, compras mes, stock bajo, totales) + gráficos | init + refresh + renderCharts | Grid de 6 cards con KPIs y botón actualizar | 10 service + 7 controller |
| **Configuración** | getAll + get + update + updateMany | init + save | Formulario con 7 campos de configuración del negocio | 11 service + 9 controller |
| **Exportación** | getAllData + getEntityData + toCSV + toJSON + download | init + handleExport | Selector de entidad, formato CSV/JSON, descarga multi-archivo | 7 service + 5 controller |
| **Importación** | parseCSV + parseJSON + import (Products/Customers/Suppliers/Sales/Purchases/Inventory/Settings) + autoDetect | init + handleFileSelect + handleImport | Dropzone, preview con Table, resultados con badges | 23 service + 7 controller |

### Contabilidad (Fase 3)
- **AccountingService**: 17 métodos — CRUD cuentas, asientos automáticos desde ventas/compras, asientos de anulación, Balance General, Estado de Resultados
- **AccountingController**: 7 métodos — init, tabChange (journal/accounts/balance/income), create/edit/delete account, generate report
- **AccountingView**: 4 tabs — Libro Diario (asientos con desglose débito/crédito), Plan de Cuentas (CRUD con tabla), Balance General (Activo/Pasivo/Patrimonio con cuadratura), Estado de Resultados (Ingresos/Gastos/Resultado Neto)
- **Asientos automáticos**: Ventas generan asiento (Caja → Ventas + IGV + Costo → Inventario). Compras generan asiento (Inventario + IGV → Proveedores). Anulaciones generan asientos inversos.
- **Plan de cuentas semilla**: 7 cuentas predefinidas (1101, 1201, 2101, 2102, 3101, 4101, 5101)
- **Permisos**: `accounting.view` (Vendedor puede ver), `accounting.create`, `accounting.edit`
- **Cache**: AccountingService cachea cuentas, invalidación tras modificaciones
- **Tests**: 12 service + 12 controller, 400+ tests total

### Autenticación
- **PasswordService**: PBKDF2 + SHA-512 via Web Crypto API, hash/verify/needsRehash
- **SessionService**: sesiones con token, persistencia en localStorage, cleanup de expiradas
- **PermissionService**: RBAC completo con 30 permisos predefinidos (hasPermission/hasRole/requirePermission)
- **AuthenticationService**: login/logout/getCurrentUser, mensajes de error genéricos
- **SystemService**: detección de primer inicio (cuenta usuarios, no flags), setupInitial con creación de admin + rol + permisos. **Fix: setupInitial reutiliza rol "Administrador" existente y actualiza usuario si ya existe (reintento tras fallo parcial)**
- **LoginView/LoginController**: formulario de inicio de sesión
- **SetupView/SetupController**: wizard de configuración inicial (negocio, admin, contraseña)
- **app.js**: flujo corregido: isFirstRun → Setup → Login → MainApp

### UI Components
- Table, Form, Modal, Toast, Loader, ConfirmDialog, Header, Sidebar.
- Pagination, SearchBar implementados funcionalmente.
- CSS completo en `assets/css/components.css` (~1162 líneas).

### Reportes
- Auto-generación de reportes al cambiar de tab (Ventas/Compras/Stock).
- CSS con summary cards, tabs tipo pestaña, filtros en card, stats coloreados por estado.
- Fecha inicial por defecto: 1 año atrás.

### Settings (Configuración)
- Rediseñado con 2 secciones: Información del Negocio (5 campos) y Configuración Financiera (2 campos).
- Grid de 2 columnas responsive (1 columna en móvil).
- Placeholders en inputs, hint de guardado, botón grande.

### Dashboard — Gráficos (Fase 4.3)
- **Chart.js 4.x** (`assets/lib/chart.umd.min.js`) integrado para dos gráficos en el Dashboard:

| Gráfico | Tipo | Descripción |
|---------|------|-------------|
| Ventas Mensuales | Barras | Totales de ventas de los últimos 12 meses. Escala Y con formato `Q ` |
| Productos por Categoría | Dona | Distribución de productos agrupados por `category` |

- **Arquitectura**:
  - `DashboardService`: métodos `getMonthlySales(monthsBack=12)` y `getCategoryDistribution()`
  - `DashboardView`: método `renderCharts(monthlySales, categoryDist)` que crea los canvas e instancia `Chart`
  - `DashboardController`: llama a los 3 servicios en paralelo (`Promise.all`) en `_loadKPIs()`
  - Chart.js se carga como script global UMD en `index.html`

### Deuda técnica corregida
- **Race condition InventoryService**: `createAdjustment` ahora usa `db.transaction('rw', ...)` — la lectura de stock, creación del movimiento y actualización del producto ocurren atómicamente. Se extrajo `_executeAdjustment()` como helper.
- **innerHTML eliminado**: 5 usos de `innerHTML` en `app.js` reemplazados por `clearElement()` (helper nuevo en `helpers.js`) y `createElement`/`textContent`/`appendChild`.
- **Test cleanup**: `run-all.js` ahora recrea el DOM shim entre suites via `resetDOM()` en un bloque `finally`.
- **Performance**: Fase 5.4 completada — schema v8 con índices compuestos, 7 repositorios optimizados (full scan → consulta indexada), DocumentFragment en 3 vistas para batch DOM, todos los tests pasan.

### Fixes
- **Import JSON multi-entidad**: `parseJSON` ahora retorna el objeto completo cuando detecta múltiples entidades. Nuevo `importFullExport(data)` que importa en orden: settings → products → customers → suppliers → movements → sales → purchases. Nueva UI `showFullExportResults` con desglose por entidad.
- **ImportInventory fallback productName**: Cuando `_resolveProduct` falla por ID numérico, busca el producto por `productName` entre todos los existentes.
- **ImportSales sin customerId**: CSV exportado tiene `customerId` vacío para ventas sin cliente ("Cliente ocasional"). Fix: `_findOrCreateCustomerOcasional()` crea/reusa cliente `C-OCASIONAL`.
- **Auto-detección importación v2**: CSVs exportados de purchases/sales/movements se detectaban mal. Fix: `supplierid`, `suppliername`, `customername`, `subtotal` agregados a patterns/strong de purchases y sales; `productname`, `stockbefore`, `stockafter` agregados a inventory.
- **Resolución de IDs en importación**: `importSales`, `importPurchases`, `importInventory` fallaban con CSVs exportados (IDs numéricos). Fix: nuevas funciones `_resolveCustomer`, `_resolveSupplier`, `_resolveProduct` que prueban `findById` numérico antes de fallback a documentId/code.
- **Tiebreaker proveedores/clientes por documentId**: Cuando hay empate sin headers discriminantes, revisa `documentId` del primer registro (`PROV-*` → suppliers, `C*` → customers) antes de lanzar error.
- **ConfirmDialog**: Recursión infinita corregida limpiando `onClose` antes de `modal.close()`.
- **findByDateRange**: EndDate extendido con `T23:59:59.999Z` para cubrir el día completo.
- **SW cache**: Bump a v2 para forzar recarga de CSS de reportes/settings.
- **SetupInitial retry**: Maneja reintentos tras fallo parcial — busca rol "Administrador" existente antes de crear, actualiza usuario si ya existe (evita error "Ya existe un rol/usuario").
- **Auto-detección importación v1**: Patrones de clientes/proveedores solo en español → un CSV inglés (`name, email, phone`) se clasificaba como productos. Fix: weighted scoring (regular x1, strong x3), +30 field names internacionales, tiebreaker cliente/proveedor. Se añadió selector de entidad en UI (`ImportView.js`).
- **Proveedores guardados como clientes**: Cuando customer y supplier empataban y no había header `cliente`/`proveedor`, el tiebreaker forzaba `customers`. Fix: ahora lanza error para que el usuario seleccione manualmente.
- **Entity aliases**: `movements` e `inventory` ahora son alias intercambiables; `config` es alias de `settings`.
- **Patrón duplicado**: `product` eliminado del patrón de inventory (causaba falsos positivos).
- **Dead code**: `importReports()` eliminado (generaba reportes en vez de importar datos, nunca era llamado).

### Auto-generación de IDs
- Productos, Clientes y Proveedores generan automáticamente código correlativo (PROD-004, C006, PROV-004) al crear.
- Campo de código/documento readonly en creación para evitar datos inconsistentes.
- `Form` component soporta `field.readonly`.

### Utils
- sanitizer.js, validators.js, helpers.js, formatters.js, errors.js implementados con 35 tests.
- `formatters.js` — `formatCurrency` usa símbolo configurable vía `setCurrencySymbol()` desde Settings.

### Testing
- Test runner con DOM shim en Node (`tests/run-all.js`).
- 45 suites (36 unitarias + 9 de integración), 410+ tests, todos pasan.
- Cada test mockea repos e inyecta dependencias.

---

## Qué falta implementar

### Performance (Fase 5.4 — completada)

### Schema DB v8 — índices compuestos
| Tabla | Índice añadido | Repositorio optimizado |
|-------|----------------|----------------------|
| `products` | `stock` | `ProductRepository.findLowStock()` |
| `sales` | `[customerId+date]` | `SaleRepository.findByCustomerAndDate()` |
| `purchases` | `[supplierId+date]` | `PurchaseRepository.findBySupplierAndDate()` |
| `accountingEntries` | `[referenceType+referenceId]` | `AccountingRepository.findEntriesByReference()` |

### Otras optimizaciones
| Repositorio | Antes | Después |
|------------|-------|---------|
| `SessionRepository.deleteExpired()` | `toArray()` + `.filter()` | `where('expiresAt').below()` |
| `SettingRepository.getMany()` | `toArray()` + `.filter()` | `where('key').anyOf()` |
| `ReportRepository._generateStockReport()` | N+1 queries (1 por producto) | Batch `anyOf(productIds)` |
| `SaleFormView._renderCart()` | `.append(row)` en loop | DocumentFragment |
| `PurchaseFormView._renderCart()` | `.append(row)` en loop | DocumentFragment |
| `Table._renderBody()` | `.appendChild(row)` en loop | DocumentFragment |

### Pendientes críticos
- (ninguno — todos los módulos planificados están implementados, Fase 5 completa)

### Deuda técnica
- La app requiere un servidor HTTP local (ES Modules no funcionan con file://)
- Dexie se sirve desde `assets/lib/dexie.js` (copia de node_modules)

#### Seed data — ejemplo transaccional
- `seed.js` ahora genera 2 ventas (Juan Pérez, María García) con items, movimientos de inventario y asientos contables
- 2 compras (Distribuidora Tech, Importaciones Globales) con items, movimientos y asientos contables
- Stock tracker preciso con stockBefore/stockAfter en cada movimiento
- Los asientos contables permiten ver Balance General y Estado de Resultados con datos reales desde el primer inicio
- Migración automática: si ya hay productos pero no hay ventas, se agregan las transacciones seed

---

## Próximo paso recomendado
- ~~Temas claro/oscuro (Fase 6.1)~~ ✅
- ~~Accesibilidad WCAG 2.1 AA (Fase 6.2)~~ ✅
- ~~E2E Testing (Fase 6.3)~~ ✅
- ~~View splitting + deuda técnica~~ ✅
- **Release v1.0.0** 🎉


---

## Riesgos conocidos

1. **Stock dual**: El stock se trackea en dos lugares — `product.stock` (redundante) y calculado desde `inventoryMovements`. Si un día se desincronizan (ej. por una operación que no actualice ambos), la UI mostrará valores incorrectos. La tabla de inventario lee de movimientos, pero `SaleService.createSale` también actualiza `product.stock` directo.

2. **Race conditions en ajustes**: `InventoryService.createAdjustment` NO usa transacción Dexie. Si dos ajustes ocurren casi simultáneos, el `stockAfter` puede calcularse mal. SaleService sí usa transacciones. *(Corregido en la versión actual — ya usa transacción)*

3. **Seed duplicado**: `seedData()` chequea `productCount > 0` pero si la DB está corrupta o parcial, no reintenta. No hay migraciones destructivas.

4. **innerHTML residual**: `app.js` usa `main.innerHTML` con `moduleId` (controlado internamente, bajo riesgo).

5. **Tests sin cleanup**: Los tests unitarios no limpian mocks entre tests. El orden de ejecución importa (cada suite crea sus propios mocks, pero no hay isolation entre suites).

6. **Seguridad client-side**: RBAC se evalúa en el navegador. Un usuario técnico puede modificar JS y saltarse permisos. Aceptable para ERP offline donde el usuario controla su máquina.

7. **Asientos contables no revertibles**: Si se elimina directamente una venta/compra desde la DB (sin usar la UI de anulación), el asiento contable queda huérfano. Las anulaciones sí generan asientos inversos automáticos.

8. **Cache de cuentas**: `AccountingService` cachea el plan de cuentas en memoria. Si otro módulo modifica cuentas directamente, la cache queda desactualizada. `invalidateCache()` debe llamarse explícitamente.

---

## Archivos importantes

| Archivo | Por qué es clave |
|---------|------------------|
| `src/app.js` | Entry point, DI wiring, router |
| `src/database/db.js` | Schema Dexie (8 versiones, v4 añadió auth, v5 contabilidad, v7 migración renombres, v8 índices compuestos) |
| `src/database/seed.js` | Datos iniciales + movimientos de inventario + transacciones contables |
| `src/config/app.js` | `APP_CONFIG` (tax rate, debounce, etc.) |
| `src/services/SaleService.js` | Lógica más compleja: tx atómica, stock validation, cancel con revert |
| `src/services/PurchaseService.js` | Mismo patrón que SaleService: tx atómica, entrada de stock, cancelación |
| `src/repositories/InventoryRepository.js` | `getStockByProduct()` — cálculo de stock desde movimientos |
| `src/views/SaleFormView.js` | View más grande: carrito, cantidades editables, totales en vivo |
| `src/views/PurchaseFormView.js` | Formulario simplificado sin carrito complejo |
| `src/views/SaleView.js` | Tabla de ventas + modal detalle + delega a SaleFormView |
| `src/views/InventoryView.js` | Tabla de stock + modal ajuste + modal movimientos |
| `src/views/ProductView.js` | CRUD completo, referencia para nuevos módulos |
| `src/components/Modal.js` | Modal con apertura/cierre, fix: close() sin depender de animationend |
| `src/components/Form.js` | Generación de formularios desde config, soporta readonly |
| `src/utils/formatters.js` | `formatCurrency` con símbolo configurable desde Settings |
| `src/components/Table.js` | Tabla ordenable con render personalizado |
| `tests/services/SaleService.test.js` | Test más completo (9 tests), patrón para PurchaseService |
| `tests/services/PurchaseService.test.js` | 8 tests, patrón de tx atómica y cancelación |
| `tests/services/ReportService.test.js` | 6 tests para reportes de ventas, compras, stock |
| `tests/controllers/SaleController.test.js` | Mock de view + service, patrón para otros controllers |
| `src/views/SettingsView.js` | Formulario de configuración con secciones y grid responsive |
| `src/controllers/ReportController.js` | Auto-generación de reportes al cambiar de tab |
| `src/components/ConfirmDialog.js` | Fix: recursión infinita en _resolve con modal.close() |
| `src/controllers/UserController.js` | CRUD usuarios con permisos (showEditForm/handleSave) |
| `src/views/UserView.js` | Formulario de usuario con roles, tabla de gestión |
| `src/services/SystemService.js` | `_ensureDefaultRoles()`, permisos `imports.*` |
| `src/views/ImportView.js` | Restricción "Solo administradores" si no tiene permiso |
| `src/models/Account.js` | Modelo de cuenta contable con código de 4 dígitos y tipo |
| `src/models/AccountingEntry.js` | Modelo de asiento contable con items débito/crédito y validación de cuadratura |
| `src/repositories/AccountingRepository.js` | CRUD cuentas + asientos + getAccountBalances |
| `src/services/AccountingService.js` | 17 métodos: CRUD + asientos automáticos venta/compra + Balance + Resultados |
| `src/controllers/AccountingController.js` | 4 tabs: Plan de Cuentas, Libro Diario, Balance General, Estado Resultados |
| `src/views/AccountingView.js` | UI con tabs, tabla cuentas, cards de asientos, reportes financieros |
| `src/services/DashboardService.js` | KPIs + getMonthlySales + getCategoryDistribution |
| `src/views/DashboardView.js` | renderCharts con Chart.js, canvas dinámicos |
| `assets/lib/chart.umd.min.js` | Chart.js 4.x UMD para gráficos en Dashboard |

---

## PWA / Service Worker

- **`sw.js`**: 118 assets precargados, stale-while-revalidate, fallback offline para SPA, skipWaiting + clients.claim
- **`manifest.json`**: display standalone, iconos SVG, scope "/"
- **`index.html`**: registro automático, meta tags iOS/Android
- **Scripts setup**: `setup.bat` (Windows) y `setup.sh` (Linux) con detección de Node.js, npm install, copia de Dexie, servidor HTTP local

## Debugging obligatorio

Al finalizar cualquier módulo, corrección o escritura de código, aplicar flujo C-debugging:
1. Encontrar causa → 2. Explicar problema → 3. Proponer solución → 4. Implementar → 5. Verificar (tests)

Prohibido corregir por prueba y error.

## Próximo objetivo

Fases 1-5 completadas. Contabilidad Básica, Dashboard con gráficos Chart.js, Tests de Integración Import/Export, Auditoría de Seguridad y Optimización de Performance implementados. 45 suites de test, 410+ tests, 0 fallos. Próximo paso: Fase 6 — UX y Pulido (Temas claro/oscuro, Accesibilidad WCAG 2.1 AA).