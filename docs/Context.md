# Open RootERP — Contexto del Proyecto

## Stack
- **Lenguaje**: JavaScript ES2022 (ES Modules)
- **Base de datos**: IndexedDB vía Dexie ^4.4.4 (schema v8 con índices compuestos)
- **Framework UI**: Ninguno (vanilla JS)
- **Tests**: Runner propio con DOM shim (Node.js)
- **Gráficos**: Chart.js 4.x (UMD) — integrado en Dashboard (Fase 4.3)
- **Servidor local**: Python HTTP server (puerto 3000)

## Arquitectura
MVC estricto con capas: View → Controller → Service → Repository → Dexie.
Prohibido saltarse capas (UI → DB no permitido).

## Módulos completos (14)

| Módulo | Archivos clave |
|--------|---------------|
| Productos | `ProductService`, `ProductController`, `ProductView` |
| Clientes | `CustomerService`, `CustomerController`, `CustomerView` |
| Inventario | `InventoryService`, `InventoryController`, `InventoryView` |
| Ventas | `SaleService`, `SaleController`, `SaleView`, `SaleFormView` |
| Proveedores | `SupplierService`, `SupplierController`, `SupplierView` |
| Compras | `PurchaseService`, `PurchaseController`, `PurchaseView`, `PurchaseFormView` |
| Reportes | `ReportService`, `ReportController`, `ReportView` |
| Dashboard | `DashboardService`, `DashboardController`, `DashboardView` |
| Configuración | `SettingService`, `SettingsController`, `SettingsView` |
| Exportación | `ExportService`, `ExportController`, `ExportView` |
| Importación | `ImportService`, `ImportController`, `ImportView` |
| Autenticación y Usuarios | `PasswordService`, `SessionService`, `PermissionService`, `AuthenticationService`, `SystemService`, `LoginController`, `SetupController`, `LoginView`, `SetupView`, `UserController`, `UserView` |
| Usuarios (RBAC) | `UserController`, `UserView` — CRUD de usuarios, solo Admin |
| Contabilidad | `AccountingService`, `AccountingController`, `AccountingView` — Plan de Cuentas, Libro Diario, Balance General, Estado de Resultados. Asientos automáticos desde ventas y compras. |

## Utils (implementados)
- `sanitizer.js` — escapeHtml, stripTags, sanitizeString, sanitizeObject, sanitizeNumeric, sanitizeAlphanumeric
- `validators.js` — validateRequired, validateEmail, validateUrl, validateDocumentId, validatePhone, validatePositiveNumber, validateInteger, validateMinMax, validateLength, validateEnum, validateRUC, validateDNI, composeValidators
- `helpers.js` — debounce, generateId, deepClone, truncate, groupBy, sortBy, pick, omit, parseNumber, isEmpty, formatError, clearElement
- `formatters.js` — formatCurrency (símbolo configurable), formatDate, formatDateTime, setCurrencySymbol, getCurrencySymbol, setTaxRate, getTaxRate
- `errors.js` — AppError, ValidationError, NotFoundError

## Roles y permisos

| Rol | Permisos |
|-----|----------|
| **Administrador** | Todos los permisos, incluyendo anular ventas/compras, importar datos y gestionar usuarios |
| **Vendedor** | Ver, crear, editar y exportar. No puede anular ventas/compras, importar, gestionar usuarios ni eliminar registros. Contabilidad: solo ver (`accounting.view`) |

Las views de Ventas/Compras ocultan el botón "Anular" si el usuario no tiene permiso `sales.cancel`/`purchases.cancel`.
La view de Importar muestra un mensaje de restricción si el usuario no tiene `imports.create`.
La sección "Usuarios" solo aparece en el sidebar para usuarios con `users.view`.

## Fixes recientes (Jul 2026)
- **Dark mode — texto ilegible en Contabilidad**: Faltaban `--color-muted` y `--color-bg-secondary` en variables CSS, y el `body` no tenía `color` definido. Se agregaron las variables para ambos temas y se añadió `color: var(--color-text)` al `body`.
- **Dark mode — badges de estado**: `.status--ok/low/critical`, `.report-stat--ok/low/critical strong`, `.import-results__badge--success/warning`, `.acct-total-ok/error` y `.btn--ghost-danger` ahora usan fondo sólido (verde/amarillo/rojo) con texto blanco en modo oscuro, en vez de solo texto coloreado sobre fondo oscuro.

## Fixes recientes
- **Editar usuarios**: Ahora permite cambiar el nombre de usuario en edición. El rol `"Usuario"` fue renombrado a `"Vendedor"`. El dropdown de roles en el formulario de usuarios solo muestra Administrador y Vendedor. Si el rol Vendedor no existe en DB, `UserController.loadUsers()` lo crea automáticamente.
- **Fix onCreate cableado**: `UserController.init()` conectaba `onCreate` directamente a `handleSave(null)` causando `"Cannot access property username, data is null"`. Corregido: ahora llama a `showCreateForm()`.
- **Fix setup redirect**: `showSetup()` ahora redirige al login al terminar (en vez de `startApp()`), y se corrigió `settingRepo.findByKey` → `settingRepo.get` en `SystemService.setupInitial`.
- **Race condition inventory**: `InventoryService.createAdjustment` ahora envuelve la lectura/escritura de stock en transacción Dexie (`db.transaction('rw', ...)`) para evitar que dos ajustes concurrentes lean el mismo `stockBefore`. Se extrajo `_executeAdjustment()` como helper.
- **innerHTML eliminado**: Se agregó `clearElement()` en `helpers.js`. Los 5 usos de `innerHTML` en `app.js` fueron reemplazados por `removeChild`/`createElement`.
- **Test cleanup**: `tests/run-all.js` ahora llama `resetDOM()` entre cada suite para restaurar el DOM shim a su estado original.
- **Import JSON multi-entidad**: El JSON de exportación completa ahora se importa correctamente (antes solo importaba products). Fix: `parseJSON` detecta objetos multi-entidad, nuevo método `importFullExport` que procesa settings → products → customers → suppliers → movements → sales → purchases en orden.
- **ImportInventory fallback productName**: Cuando el `productId` numérico del movement no coincide con el ID interno en DB (por productos duplicados saltados), se busca por `productName` existente.
- **ImportSales sin customerId**: CSV exportado tiene `customerId` vacío para ventas sin cliente registrado. Fix: crea automáticamente un cliente `C-OCASIONAL` cuando `customerId` está vacío pero `customerName` tiene valor.
- **Importación: auto-detección v2**: CSVs exportados de purchases, sales, movements se detectaban como entidad incorrecta. Fix: agregados patrones `supplierid`, `suppliername`, `customername`, `subtotal`, `productname`, `stockbefore`, `stockafter` a los patrones de auto-detección.
- **Importación: resolución de IDs**: `importSales`, `importPurchases` e `importInventory` fallaban al reimportar CSVs exportados porque `customerId`/`supplierId`/`productId` son IDs numéricos internos, no documentId/code. Fix: funciones `_resolveCustomer`, `_resolveSupplier`, `_resolveProduct` que prueban `findById` numérico antes de fallback a documentId/code.
- **Importación: tiebreaker por documentId**: Cuando customers y suppliers empatan sin headers discriminantes, se revisa el valor `documentId` del primer registro (`PROV-*` → suppliers, `C*` → customers).
- **ConfirmDialog**: Se rompía recursión infinita entre `_resolve()` → `modal.close()` → `onClose()` → `_resolve()`. Fix: limpiar `onClose` antes de llamar `close()`.
- **Reportes (Ventas/Compras)**: Ahora auto-generan reporte al cambiar de tab (como Stock). Fecha inicial por defecto: 1 año atrás.
- **findByDateRange**: Las fechas se guardan como ISO string (`2026-07-08T12:34:56.789Z`) pero el filtro comparaba contra `"2026-07-08"` (solo fecha), nunca coincidía. Fix: extender endDate con `T23:59:59.999Z`.
- **Settings**: Rediseñado con secciones (Información del Negocio + Configuración Financiera), grid de 2 columnas, placeholders y responsive.
- **Contabilidad**: Fase 3 completa. 7 cuentas predefinidas en seed. Asientos automáticos desde ventas/compras con débito/crédito. Balance General y Estado de Resultados. Asientos inversos para anulaciones. Cache de cuentas en AccountingService.
- **Dashboard Gráficos (Fase 4.3)**: Integración de Chart.js 4.x para Ventas Mensuales (barras) y Productos por Categoría (dona).
- **Performance (Fase 5.4)**: Schema v8 con índices compuestos `[customerId+date]`, `[supplierId+date]`, `[referenceType+referenceId]`, `stock`. 7 repositorios optimizados de full scan a consulta indexada. DocumentFragment en 3 vistas para batch DOM.

## PWA / Offline
- Service Worker (`sw.js`) cachea 118 assets con estrategia stale-while-revalidate
- `manifest.json` con `display: standalone` e iconos SVG para instalación
- `setup.sh` (Linux) y `setup.bat` (Windows) para instalación en computador nuevo
- 100% offline sin dependencia de CDN o backend
- Dexie se sirve desde `assets/lib/dexie.js` (copia local)

## Skills — Prioridad obligatoria

Al generar o modificar código, se aplican las skills en el siguiente orden estricto. No se puede saltar ningún nivel. Cada nivel debe cumplirse antes de pasar al siguiente.

### Nivel A — Obligatorio siempre (máxima prioridad)
1. **A-coding-standards** — SOLID, DRY, KISS, Clean Code, máximo 300 líneas/archivo, 40 líneas/función
2. **A-project-architecture** — MVC estricto, capas separadas, inyección de dependencias
3. **A-secure-coding** — Sin innerHTML dinámico, sin eval, sin estilos inline, sanitizar entradas
4. **A-testing** — Código testeable, AAA, FIRST, casos borde, mocks
5. **D-git-workflow** — Conventional Commits, Trunk-Based, PR gates, SemVer

### Nivel B — Obligatorio cuando aplica
6. **B-authentication-security** — PBKDF2, RBAC, mínimo privilegio
7. **B-html-css** — HTML semántico, CSS con clases, sin estilos inline
8. **B-javascript-clean** — ES Modules, const/let, async/await, sin var
9. **B-ui-components** — Componentes reutilizables, separación de concerns
10. **C-database-design-offline** — Normalización, índices compuestos, migraciones, seed idempotente
11. **C-dexie-patterns** — Repository pattern, queries optimizadas, transacciones atómicas

### Nivel C — Verificación / Debugging (obligatorio siempre al finalizar)
12. **C-debugging** — Flujo obligatorio al terminar cualquier módulo/corrección:
    1. Encontrar causa → 2. Explicar problema → 3. Proponer solución → 4. Implementar → 5. Verificar (tests 0 fallos)
13. **C-documentation** — Documentar solo cuando todo el código anterior está verificado y funcionando. Sin comentarios en código, solo documentación externa si es necesaria.
14. **C-qa-breaker** — QA adversarial obligatorio (Fase 7): 8 categorías ATK-*, gate de release

### Nivel D — Soporte / Mejora Continua
15. **D-prompt-engineering** — CoT, few-shot, structured output para prompts
16. **D-Agente-IA** — Arquitectura agente: Planner, Context Manager, Skill Registry, Tool Executor, Mode Controller

## Convenciones clave
- Una clase por archivo, máx. 300 líneas, funciones máx. 40 líneas
- `_prefijo` para privados
- Nombres en inglés para clases/métodos; UI en español
- Comentarios solo en lógica compleja (skill C-documentation)
- Sin `innerHTML` con datos dinámicos (usar `textContent` + `createElement`)
- Sin estilos inline en JS (usar clases CSS)

## Patrones
- Repository encapsula Dexie, Service tiene lógica de negocio, Controller orquesta, View crea DOM
- Inyección de dependencias manual en `app.js`
- Transacciones atómicas Dexie en SaleService, PurchaseService e InventoryService
- Stock calculado desde `inventoryMovements` (redundancia en `product.stock`)

## Tests
- Runner unit/integration: `tests/run-all.js`
- Runner E2E: `npm run test:e2e` (Playwright + Chromium headless, port 3099)
- Smoke test visible: `node tests/e2e/smoke-visible.js` (headed, slowMo 200ms, graba video)
- 45 suites unit/integration, 410+ tests, 0 fallos (incluye 9 suites de integración con 54+ tests)
- 38 tests E2E, 0 fallos (cubre todos los módulos: setup, login, productos, clientes, proveedores, ventas, compras, inventario, contabilidad, reportes, settings, export, import, usuarios)
- Cada suite unitaria crea sus propios mocks (sin isolation entre suites)

## Archivos confidenciales — NO subir a GitHub
- `GUIA_ENTREVISTA_BANRURAL.md` — agregado a `.gitignore` para evitar subida accidental

## Verificación final
- Ejecutar `node tests/run-all.js` y confirmar **0 fallos** antes de dar por terminado cualquier cambio.
- Prohibido corregir por prueba y error.