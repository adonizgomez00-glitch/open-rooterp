# ERP Ligero Offline — Estado del Proyecto

## Estado general

ERP funcional con 14 módulos completos (Productos, Clientes, Inventario, Ventas, Proveedores, Compras, Reportes, Dashboard, Configuración, Exportación, Importación, Autenticación, Usuarios, Contabilidad).  
Arquitectura MVC con Repository + Service.  
100 % offline, zero frameworks. ES Modules. IndexedDB vía Dexie.

Última verificación: **45 suites unit/integration · 410+ tests · 0 fallos + 38 tests E2E · 0 fallos**.

---

## Arquitectura

```
Vista (View)
    ↓  (eventos del DOM)
Controller
    ↓  (llamadas)
Service
    ↓  (reglas de negocio)
Repository
    ↓  (CRUD)
Dexie / IndexedDB
```

- **View** — Crea el DOM, escucha eventos, delega al Controller.
- **Controller** — Orquesta: recibe eventos de la View, llama al Service, actualiza la View.
- **Service** — Lógica de negocio y validaciones. Nunca toca el DOM ni IndexedDB directamente.
- **Repository** — Única capa que importa Dexie. Mapea filas a instancias de modelos.

### Prohibiciones

- Ninguna capa puede saltarse otra (UI → DB prohibido).
- No `innerHTML` con datos dinámicos.
- No estilos inline en JS.
- No eval, no Function constructor.

---

## Módulos terminados

| Módulo | Service | Controller | View | Tests |
|--------|---------|------------|------|-------|
| Productos | 8 métodos | 8 métodos | 17 métodos públicos | 9 service + 7 controller |
| Clientes | 6 métodos | 8 métodos | 17 métodos públicos | 7 service + 7 controller |
| Inventario | 6 métodos (nuevo: `_executeAdjustment`) | 6 métodos | 15 métodos públicos | 8 service + 6 controller |
| Ventas | 6 métodos | 6 métodos | 15 métodos públicos (View) + 4 (FormView) | 9 service + 7 controller |
| Proveedores | 6 métodos | 8 métodos | 17 métodos públicos | 7 service + 7 controller |
| Compras | 5 métodos | 6 métodos | 15 métodos públicos (View) + 4 (FormView) | 8 service + 7 controller |
| Reportes | 5 métodos | 5 métodos | 17 métodos públicos | 6 service + 6 controller |
| Dashboard | 4 métodos (incl. gráficos) | 4 métodos | 8 métodos públicos | 10 service + 7 controller |
| Configuración (Settings) | 4 métodos | 3 métodos | 10 métodos públicos | 11 service + 9 controller |
| Exportación | 5 métodos | 2 métodos | 16 métodos públicos | 7 service + 5 controller |
| Importación | 13 métodos (6 import + 3 parse + autoDetect + sanitize) | 2 métodos | 10 métodos públicos | 23 service + 7 controller |
| Autenticación | 5 servicios | 2 controllers | 2 views | 5 service + 2 controller |
| Usuarios | — | `UserController` (7 métodos) | `UserView` (showForm + tabla CRUD) | 7 controller |
| Contabilidad | `AccountingService` (17 métodos) | `AccountingController` (7 métodos) | `AccountingView` + 4 sub-vistas (Accounts, Journal, Balance, Income) | 12 service + 12 controller |
| **Integración** | — | — | — | **9 suites · 54+ tests** |

Cada módulo sigue el patrón: Service → Controller → View, con tests separados para Service y Controller.

### Inventario
- Stock calculado desde movimientos (`inventoryMovements`)
- Vista general con tabla de stock, columna de estado (OK/Bajo/Crítico)
- Ajustes: entrada, salida, ajuste manual
- Historial de movimientos por producto en modal
- Seed inicial crea movimientos de entrada para cada producto
- **Race condition corregido**: `createAdjustment` usa `db.transaction('rw', ...)` y helper `_executeAdjustment()`

### Ventas
- Creación con carrito: buscador de productos, cantidades editables, totales en tiempo real
- Validación de stock contra movimientos antes de confirmar
- Transacción atómica: crea venta + items + movimiento de salida + actualiza stock
- Anulación: revierte stock, registra movimiento de ajuste
- Modal de detalle con tabla de items y totales

### Proveedores
- CRUD completo con búsqueda por nombre, documento o email
- Validación de documento único
- Formulario modal reutilizando componente Form
- Tabla ordenable con acciones de edición/eliminación

### Compras
- Creación con selección de proveedor y agregado de productos (cantidad + precio)
- Transacción atómica: crea compra + items + movimiento de entrada + actualiza stock
- Anulación: revierte stock, registra movimiento de ajuste
- Formulario simplificado sin carrito complejo (sin edición inline de cantidades)
- Modal de detalle con tabla de items y totales

### Reportes
- 3 tipos de reporte: Ventas, Compras y Stock
- Reportes de ventas y compras filtrables por rango de fechas, auto-generados al cambiar de tab
- Reporte de stock con estado (OK/Bajo/Crítico) y resumen de conteos
- Tarjetas de resumen general (productos, clientes, proveedores, ventas, compras)
- Interfaz con tabs para cambiar entre tipos de reporte
- CSS propio con summary bar, stats coloreados, tabs tipo pestaña, filtros en card
- Fix: `findByDateRange` usa `T23:59:59.999Z` para incluir el día completo en búsquedas

---

### Autenticación (nuevo)
- **PasswordService**: hash/verify con PBKDF2 + SHA-512 via Web Crypto API, sal de 32 bytes, 100k iteraciones
- **SessionService**: creación/destrucción de sesiones con token, persistencia en localStorage, limpieza de expiradas
- **PermissionService**: RBAC completo con 30 permisos predefinidos por módulo, asignación por rol
- **AuthenticationService**: login/logout/getCurrentUser, mensajes de error genéricos (no revela existencia del usuario)
- **SystemService**: detección de primer inicio basada en conteo de usuarios (no flags), setupInitial crea admin + rol + permisos. **Fix: setupInitial reutiliza rol "Administrador" existente y actualiza usuario si ya existe (reintento tras fallo parcial)**
- **SetupView/SetupController**: wizard de primer inicio (nombre del negocio, usuario admin, contraseña)
- **LoginView/LoginController**: formulario de inicio de sesión

### Contabilidad (nuevo — Fase 3 del ROADMAP)
- **Plan de Cuentas**: CRUD completo de cuentas contables con código de 4 dígitos, tipo (Activo/Pasivo/Patrimonio/Ingreso/Gasto)
- **Libro Diario**: Visualización de asientos contables con filtro por fecha, desglose de débito/crédito por cuenta
- **Balance General**: Activo, Pasivo y Patrimonio calculados desde los movimientos contables, con verificación de cuadratura
- **Estado de Resultados**: Ingresos y Gastos con cálculo de resultado neto (Ganancia/Pérdida)
- **Asientos automáticos**: Cada venta genera asiento (Caja → Ventas + IGV + Costo → Inventario), cada compra genera asiento (Inventario + IGV → Proveedores). Las anulaciones generan asientos inversos.
- **7 cuentas predefinidas** en seed: 1101 Caja, 1201 Mercaderías, 2101 IGV, 2102 Proveedores, 3101 Capital, 4101 Ventas, 5101 Costo de Ventas
- **Permisos**: `accounting.view`, `accounting.create`, `accounting.edit` (Vendedor solo puede ver)
- **Cache de cuentas**: `AccountingService` cachea el plan de cuentas; `invalidateCache()` tras modificaciones
- **Tests**: 12 service + 12 controller tests

### Dashboard — Gráficos (Fase 4.3)
- **Chart.js 4.x** integrado (`assets/lib/chart.umd.min.js`)
- **Ventas Mensuales**: Gráfico de barras, últimos 12 meses, formato `S/ `
- **Productos por Categoría**: Gráfico de dona, distribución por `category`

---

## Mejoras recientes

- **Dark mode — visibilidad en Contabilidad**: Se añadieron las variables `--color-muted` y `--color-bg-secondary` faltantes en el tema oscuro. Se agregó `color: var(--color-text)` al `body` para que el texto herede el color del tema correctamente. Los badges de estado (OK/Bajo/Crítico), report stats, import results, diferencia y resultado neto contable, y botones ghost-danger ahora usan fondo sólido con texto blanco en modo oscuro.

## Mejoras recientes

- **Importación de JSON export completo**: El JSON generado por `ExportService.getAllData()` contiene múltiples entidades (`products`, `customers`, `suppliers`, `sales`, `purchases`, `movements`, `settings`, `accounts`, `accountingEntries`) pero `parseJSON` solo devolvía el primer array (products). Fix: `parseJSON` ahora detecta objetos multi-entidad y los retorna completos. Nuevo método `importFullExport(data)` que importa cada entidad en orden (settings → products → customers → suppliers → movements → sales → purchases) y `ImportController` lo maneja automáticamente sin pasar por preview. Nueva vista `showFullExportResults` con desglose por entidad.
- **Fix importInventory: fallback por productName**: Al reimportar movements, el `productId` numérico puede no coincidir con el ID interno en DB si los productos se saltaron por duplicados. Fix: cuando `_resolveProduct` falla, se busca el producto por `productName` entre todos los existentes.
- **Fix importSales sin customerId**: Al reimportar CSVs de ventas exportadas, el campo `customerId` viene vacío para ventas sin cliente registrado ("Cliente ocasional"). Fix: ahora crea automáticamente un cliente `C-OCASIONAL` cuando `customerId` está vacío pero `customerName` tiene valor. La primera vez lo crea, las siguientes lo reusa.
- **Fix auto-detección importación v2**: CSVs exportados desde purchases, sales y movements no se detectaban correctamente. Causas: faltaban patrones `supplierid`, `suppliername`, `customername`, `subtotal`, `productname`, `stockbefore`, `stockafter`. Solución: se agregaron todos los patrones faltantes para que CSVs re-exportados se detecten sin ambigüedad.
- **Fix resolución de IDs en importación**: Al reimportar CSVs exportados, `customerId`, `supplierId` y `productId` son números (IDs internos) pero los métodos `importSales`/`importPurchases`/`importInventory` solo intentaban `findByDocumentId`/`findByCode`. Solución: nuevas funciones `_resolveCustomer`, `_resolveSupplier`, `_resolveProduct` que intentan `findById` numérico primero y hacen fallback a documentId/code.
- **Fix tiebreaker proveedores/clientes por documentId**: Cuando el score empataba y no había headers `cliente`/`proveedor`, se revisa el valor de `documentId` del primer registro. Si empieza con `PROV-` se asigna suppliers, si empieza con `C` se asigna customers.
- **Configuración**: Rediseño completo con secciones agrupadas (Información del Negocio + Configuración Financiera), grid responsive de 2 columnas, placeholders en campos, hint de guardado.
- **Reportes**: Auto-generación al cambiar de tab Ventas/Compras. CSS propio con summary cards, tabs tipo pestaña, filtros en card, stats coloreados. Fecha inicial por defecto extendida a 1 año.
- **Fix recursión ConfirmDialog**: Se rompía ciclo infinito entre `_resolve()` → `modal.close()` → `onClose()` → `_resolve()`. Solución: limpiar `onClose` antes de cerrar.
- **Fix findByDateRange**: Las fechas ISO (`2026-07-08T12:34:56.789Z`) no coincidían con filtros de solo fecha (`2026-07-08`). Solución: extender endDate con `T23:59:59.999Z`.
- **Service Worker**: Cache bump a v2 para forzar recarga de assets nuevos (CSS de reportes/settings).
- **CSS**: +220 líneas de estilos para reportes y settings. Total ~1162 líneas en `components.css`.
- **Fix auto-detección importación v1**: El algoritmo de auto-detección solo tenía patrones en español para clientes/proveedores. Un CSV con headers inglés (`name, email, phone, address`) se clasificaba como productos porque `name` matcheaba el patrón de productos. Solución: patrón con weighted scoring (patrones regulares x1, fuertes x3), +30 field names en inglés, tiebreaker cliente/proveedor. Se añadió selector de entidad en la UI para override manual.
- **Fix proveedores guardados como clientes**: Cuando customer y supplier empataban en score sin header discriminante (`cliente`/`customer` vs `proveedor`/`supplier`), el tiebreaker anterior devolvía `customers` por defecto. Fix: ahora lanza error explícito pidiendo selección manual. Nunca más se guardan datos en la entidad incorrecta.
- **Fix entity aliases import**: Se añadieron alias `movements` → inventory y `config` → settings para compatibilidad con exportación.
- **Fix patrón duplicado**: `product` eliminado del patrón de inventory para evitar contaminación cruzada con products.
- **Fix dead code**: `importReports` eliminado (generaba reportes en lugar de importar, nunca era llamado).
- **Editar usuario**: Campo username ahora editable en edición. Se incluye `username` en `updateData` de `UserController.handleSave()`.
- **Rol Vendedor**: Rol `"Usuario"` renombrado a `"Vendedor"`. `UserController.loadUsers()` crea automáticamente el rol Vendedor si no existe en DB. El dropdown de roles en el formulario de usuarios filtra solo Administrador y Vendedor.
- **Fix cableado onCreate**: `onCreate` estaba conectado a `handleSave(null)` causando error. Corregido a `showCreateForm()`.
- **Fix método inexistente**: `SystemService.setupInitial` llamaba `this._settingRepo.findByKey('business_name')` pero el método real es `get(key)`. Corregido.
- **Fix setup redirige a login**: `showSetup()` ahora llama a `showLogin()` al completar (en vez de `startApp()`), evitando el error "El sistema ya está configurado" y permitiendo ingresar sin F5.
- **Race condition inventory**: `InventoryService.createAdjustment` ahora usa `db.transaction('rw', [inventoryMovements, products], ...)` para atomicidad. Se agregó helper `_executeAdjustment()`. Constructor acepta `db` como primer parámetro.
- **innerHTML eliminado**: Se agregó `clearElement()` a `helpers.js`. Todos los `innerHTML` en `app.js` reemplazados por `removeChild`/`createElement`/`appendChild`.
- **Test cleanup DOM**: `run-all.js` ahora recrea el DOM shim entre suites vía `resetDOM()` en el `finally` del loop.
- **Seed data transaccional**: `seed.js` ahora genera 2 ventas (Juan Pérez, María García) con items, movimientos de inventario y asientos contables; 2 compras (Distribuidora Tech, Importaciones Globales) con items, movimientos y asientos contables. Stock tracker preciso con stockBefore/stockAfter en cada movimiento. Los asientos contables permiten ver Balance General y Estado de Resultados con datos reales desde el primer inicio. Migración automática: si ya hay productos pero no hay ventas, se agregan las transacciones seed.

No quedan módulos pendientes (Fases 1-3 completadas).

---

## Estructura de carpetas

```
src/
├── app.js                     — Entry point, router, DI
├── config/
│   └── app.js                 — APP_CONFIG (tax rate, debounce, etc.)
├── database/
│   ├── db.js                  — Dexie schema (8 versiones, v5 añadió contabilidad, v8 añadió índices performance)
│   └── seed.js                — Datos iniciales (10 prod, 5 cli, 3 prov, 7 settings, 10 mov + transacciones seed)
├── models/                    — 16 clases (Account, AccountingEntry, Product, Customer, Supplier, Sale, SaleItem,
│                                Purchase, PurchaseItem, InventoryMovement, Setting,
│                                User, Role, Permission, RolePermission, Session)
├── repositories/              — 12 repos (Accounting, Product, Customer, Supplier, Sale,
│                                Purchase, Inventory, Setting,
│                                User, Role, Permission, Session)
├── services/                  — 15 servicios (Password, Session, Permission,
│                                Authentication, System, Accounting, +9 existentes)
├── controllers/               — 14 controladores (Login, Setup, Accounting, +11 existentes)
├── views/                     — 19 vistas (AccountingView container + 4 sub-vistas contables, ReportView container + 3 sub-vistas reportes, +11 existentes)
├── components/                — 10 componentes (10 implementados)
│     Table, Form (con readonly), Modal, Toast, Loader, ConfirmDialog, Header, Sidebar,
│     Pagination, SearchBar
├── store/
│   └── AppState.js            — Clase vacía (reservada)
├── utils/
│   ├── formatters.js           — formatCurrency (símbolo configurable), formatDate, formatDateTime, etc.
│   ├── sanitizer.js            — escapeHtml, stripTags, sanitizeString, sanitizeObject, sanitizeNumeric, sanitizeAlphanumeric
│   ├── validators.js           — validateRequired, validateEmail, validateUrl, validateDocumentId, validatePhone,
│   │                             validatePositiveNumber, validateInteger, validateMinMax, validateLength,
│   │                             validateEnum, validateRUC, validateDNI, composeValidators
│   ├── helpers.js              — debounce, generateId, deepClone, truncate, groupBy, sortBy, pick, omit,
│   │                             parseNumber, isEmpty, formatError, clearElement
│   └── errors.js               — AppError, ValidationError, NotFoundError
assets/
├── lib/
│   └── dexie.js               — Dexie v4 ESM (copia de node_modules para servir offline)
│   └── chart.umd.min.js       — Chart.js 4.x UMD para gráficos en Dashboard
├── css/
│   ├── reset.css, variables.css, main.css, layout.css
│   ├── components.css         — ~1160 líneas, todos los estilos de componentes
│   └── utilities.css
├── fonts/ y icons/
tests/
├── run-all.js                 — Runner con DOM shim
├── runner.html                — Runner para navegador
├── integration/               — 8 tests de integración (flujo venta/compra, contabilidad, import/export)
├── services/                  — 13 archivos (Password, Session, Permission, Authentication, System, +8 existentes)
└── controllers/               — 10 archivos (Login, Setup, +8 existentes)
```

---

## Convenciones de código

- **Un archivo por clase**, máximo 300 líneas.
- **Una responsabilidad por clase** (SOLID).
- **Funciones de máximo 40 líneas**.
- **Variables privadas** con prefijo `_`.
- **Nombres en inglés** para clases y métodos; **mensajes de UI en español**.
- **Sin comentarios** en código.
- **Sin innerHTML** con datos dinámicos (usar `createElement` + `textContent`).
- **Sin estilos inline** en JS (usar clases CSS).
- **Eventos con `addEventListener`**, nunca `onclick` en HTML.

---

## Dependencias principales

| Dependencia | Versión | Propósito |
|-------------|---------|-----------|
| Dexie | ^4.4.4 | Wrapper IndexedDB |
| Chart.js | 4.x | Gráficos en Dashboard |
| (sin framework JS) | — | Vanilla JS, ES Modules |

Nota: Dexie se sirve desde `assets/lib/dexie.js` (copia local) para funcionar sin bundler ni CDN. Chart.js desde `assets/lib/chart.umd.min.js`.

---

## Patrones utilizados

| Patrón | Dónde |
|--------|-------|
| **MVC** | Todo el proyecto: View ↔ Controller ↔ Service ↔ Repository |
| **Repository** | Capa de datos: 12 repositorios encapsulan Dexie |
| **Inyección de dependencias** | Manual en `app.js`: repos → services → controllers → views |
| **Auto-ID** | Productos, Clientes y Proveedores generan código correlativo automático al crear |
| **Observer/Callback** | View expone `onSearch(cb)`, `onCreate(cb)`, etc.; Controller los registra |
| **Módulo (ES Module)** | `export class` / `import { ... } from` |
| **Factory** | Modelos: `fromDB(data)` → `new Model(data)` |
| **Singleton** | `Toast` con métodos static |
| **Transaction** | Dexie `db.transaction('rw', ...)` en SaleService, PurchaseService, InventoryService |
| **Private fields** | Convención `_prop` (no # privates por compatibilidad) |

---

## Decisiones importantes

1. **Stock basado en movimientos**: `getStockByProduct()` suma/resta movimientos en lugar de leer `product.stock`. El campo `product.stock` se mantiene actualizado como redundancia.
2. **Sin framework UI**: Se eligió vanilla JS para mantener 0 dependencias y total control offline.
3. **Seed con movimientos iniciales**: Cada producto seedeado crea un inventoryMovement de entrada, para que el stock calculado coincida desde el inicio.
4. **Formulario de venta como View separada**: `SaleFormView` se extrajo de `SaleView` para cumplir el límite de 300 líneas.
5. **Ocho versiones de DB schema**: La v3 añadió `updatedAt` a sales/purchases y `reference`/`referenceId` a inventoryMovements. La v4 añadió tablas de autenticación (users, roles, permissions, rolePermissions, sessions). La v5 añadió tablas de contabilidad (accounts, accountingEntries). La v8 (v6-v7 internas) añadió índices compuestos `[customerId+date]`, `[supplierId+date]`, `[referenceType+referenceId]` e índice simple `stock` en products para optimizar consultas.
6. **Tax rate configurable**: `setTaxRate`/`getTaxRate` desde `formatters.js`, se carga desde Settings al iniciar y se actualiza dinámicamente al guardar configuración. Por defecto 18 %.
7. **Autenticación con RBAC**: Se implementó sistema completo de autenticación con roles y permisos. Primer inicio detecta ausencia de usuarios (no flags). Password hashing con PBKDF2 + SHA-512 via Web Crypto API.
8. **Dexie servido localmente**: Se copió `dexie.mjs` a `assets/lib/dexie.js` para evitar dependencia de CDN/bundler y mantener compatibilidad offline.
9. **Símbolo de moneda configurable**: Se lee `currency_symbol` desde Settings al iniciar. `formatCurrency` usa el símbolo dinámico vía `setCurrencySymbol()`. Al guardar en Configuración, se actualiza en toda la app sin recargar.
10. **Auto-generación de IDs**: Productos (PROD-n), Clientes (Cn) y Proveedores (PROV-n) generan su código correlativo automáticamente al crear. El controlador fuerza la generación en `handleSave` ignorando lo enviado por el formulario, para evitar datos inconsistentes incluso si se manipula el DOM. `Form` component soporta `field.readonly`.

---

## Pendientes

### Deuda técnica
- ~~**Sin pruebas e2e**: Solo tests unitarios con mocks.~~ ✅ 38 tests E2E con Playwright
- **Seguridad client-side**: RBAC se evalúa en el navegador. Aceptable para ERP offline.
- ~~**Race condition en InventoryService**: Corregido con transacción Dexie.~~
- ~~**innerHTML residual en app.js**: Corregido, reemplazado por DOM API.~~
- ~~**Tests sin cleanup entre suites**: Corregido, `resetDOM()` entre suites.~~
- ~~**AccountingView.js supera 300 líneas (624)**: Dividido en 4 sub-vistas (~200 c/u).~~
- ~~**ReportView.js supera 300 líneas (329)**: Dividido en 3 sub-vistas (~200 c/u).~~
- ~~**PurchaseFormView.js (306)**: Ya está en 299 líneas, cumple el límite.~~

### Funcional faltante
- (ninguno — Fases 1-5 completadas: todos los módulos planificados están implementados)

---

## Roles y permisos implementados

| Rol | Creado por defecto | Permisos |
|-----|-------------------|----------|
| **Administrador** | `setupInitial()` | Todos los permisos (`products.*`, `customers.*`, `suppliers.*`, `sales.*`, `purchases.*`, `inventory.*`, `reports.*`, `dashboard.*`, `settings.*`, `exports.*`, `imports.*`, `users.*`) |
| **Vendedor** | `_ensureDefaultRoles()` en `setupInitial()` o auto-creado por `UserController.loadUsers()` | Solo lectura/creación/edición/exportación. Sin `sales.cancel`, `purchases.cancel`, `imports.*`, `users.*`, `settings.edit`, `products.delete`, `customers.delete`, `suppliers.delete` |

### Restricciones en UI
- **Ventas**: botón "Anular" oculto si el usuario no tiene `sales.cancel`
- **Compras**: botón "Anular" oculto si el usuario no tiene `purchases.cancel`
- **Importar**: dropzone e importación bloqueados si no tiene `imports.create` (mensaje "Solo administradores")
- **Usuarios**: módulo visible solo para usuarios con `users.view`; botones crear/editar/eliminar según permisos individuales
- **Sidebar**: ítem "Usuarios" solo visible si `users.view` está habilitado

### Nuevo módulo: Usuarios (UserController + UserView)
- CRUD completo de usuarios desde la UI
- Selección de rol (Administrador/Vendedor), dropdown filtrado a solo esos 2 roles
- Activación/desactivación de usuarios
- Cambio de contraseña desde edición
- Solo accesible por usuarios con permiso `users.view`

## PWA / Service Worker

- **`sw.js`**: cachea 118 assets (todos los JS, CSS, iconos, libs) con estrategia stale-while-revalidate
- **`manifest.json`**: `display: standalone`, iconos SVG 192x192 y 512x512, scope "/"
- **`index.html`**: registro automático del SW, meta tags iOS y Android para instalación
- **Icons**: `assets/icons/icon-192.svg` y `icon-512.svg`
- **Scripts de instalación**: `setup.sh` (Linux) y `setup.bat` (Windows) — verifican Node.js, ejecutan `npm install`, copian Dexie a `assets/lib/`, inician servidor HTTP local y abren el navegador

## Importar datos desde JSON

El módulo **Importar** acepta archivos JSON con la estructura de exportación completa del sistema.

### Formato esperado

```json
{
  "products": [ ... ],
  "customers": [ ... ],
  "suppliers": [ ... ],
  "sales": [ ... ],
  "purchases": [ ... ],
  "inventoryMovements": [ ... ],
  "settings": [ ... ],
  "accounts": [ ... ],
  "accountingEntries": [ ... ]
}
```

Cada array sigue la misma estructura que genera el módulo **Exportar**. El importador detecta automáticamente la entidad por el nombre de la clave raíz y crea los registros respetando las validaciones del sistema.

### Notas
- Los registros duplicados (mismo código en productos, mismo documento en clientes/proveedores) se omiten.
- Las sesiones de usuario, roles y permisos **no** se importan/exportan (se conservan siempre).
- El importador también acepta CSV con cabeceras en español o inglés.

## Próximo paso recomendado

- ~~Temas claro/oscuro (Fase 6.1)~~ ✅
- ~~Accesibilidad WCAG 2.1 AA (ARIA + Teclado + Contraste + Etiquetas) (Fase 6.2)~~ ✅
- ~~Dividir vistas grandes: AccountingView, ReportView, PurchaseFormView~~ ✅
- ~~E2E Testing (38 tests)~~ ✅
- Release v1.0.0 🎉

## E2E Tests

**Runner**: `npm run test:e2e` (Playwright + Chromium headless, port 3099)

**Cobertura (38 tests)**:
| Módulo | Tests |
|--------|-------|
| Setup/Login | 01-02, 37-38 |
| Dashboard | 03 |
| Productos | 04-09 |
| Clientes | 10-11 |
| Proveedores | 12 |
| Ventas | 13-16 |
| Compras | 17-18 |
| Inventario | 19-20 |
| Contabilidad | 21-25 |
| Reportes | 26-27 |
| Settings | 28 |
| Exportación | 29-30 |
| Importación | 31-32 |
| Usuarios | 33-36 |

**Helpers**: `tests/e2e/helpers.js` — server management, browser lifecycle, page helpers, assertions, recovery