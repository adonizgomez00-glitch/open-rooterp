# Open RootERP

> **ERP ligero, 100% offline, zero frameworks** — Para pequeños negocios que necesitan gestión completa sin depender de internet.

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/adonis/apps-locales/erp-ligero-offline)
[![Tests](https://img.shields.io/badge/tests-524%2B-brightgreen)](https://github.com/adonis/apps-locales/erp-ligero-offline)
[![Pass Rate](https://img.shields.io/badge/pass%20rate-100%25-brightgreen)](https://github.com/adonis/apps-locales/erp-ligero-offline)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Node](https://img.shields.io/badge/node-18%2B-brightgreen)](https://nodejs.org/)
[![Offline](https://img.shields.io/badge/offline-100%25-orange)](https://github.com/adonis/apps-locales/erp-ligero-offline)

---

## 📊 Dashboard de Métricas para Reclutadores

| Métrica | Valor |
|---------|-------|
| **Total de pruebas** | **525+** |
| **Tasa de aprobación** | **100%** |
| **Defectos encontrados y corregidos** | **16+ críticos** |
| **Cobertura de módulos** | **14/14 completos** |

### Desglose por Tipo de Prueba

| Tipo de Prueba | Cantidad | Suites | Aprobadas | Tasa |
|----------------|----------|--------|-----------|------|
| **Unitarias / Integración** | 410+ | 45 | 410+ | **100%** |
| **E2E (Playwright)** | 38 | 1 | 38 | **100%** |
| **QA Adversarial (5 fases)** | 76 | 4 archivos | 76 | **100%** |
| ├─ Fase 2: Adversarial | 44 | - | 44 | 100% |
| ├─ Fase 3: Stress & Chaos | 10 | - | 10 | 100% |
| ├─ Fase 4: Seguridad | 10 | - | 10 | 100% |
| └─ Fase 5: Accesibilidad & Móvil | 12 | - | 12 | 100% |

### Herramientas de Testing

| Herramienta | Propósito |
|-------------|-----------|
| **Playwright** | E2E automatizado, multi-pestaña, control de red, Chromium headless + headed |
| **Custom Node Runner** | Unitarias/integración con DOM shim (`tests/run-all.js`) |
| **axe-core** | Escaneo automatizado de accesibilidad WCAG 2.1 AA |
| **Chrome DevTools** | Perfilado memoria, rendimiento, IndexedDB, red |
| **Dexie.js** | Mock de IndexedDB para tests unitarios |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        index.html (SPA)                      │
├─────────────────────────────────────────────────────────────┤
│                      app.js — Router + DI                    │
├──────────┬──────────┬──────────┬────────────────────────────┤
│  Views   │Controllers│ Services │      Repositories         │
│ (render) │ (orquest)│(negocio) │        (datos/Dexie)       │
├──────────┴──────────┴──────────┴────────────────────────────┤
│                    Dexie.js + IndexedDB                      │
├─────────────────────────────────────────────────────────────┤
│              Service Worker — Cache API + Offline            │
└─────────────────────────────────────────────────────────────┘
```

**Patrones:** MVC estricto + Repository Pattern + Service Layer + Inyección de dependencias manual  
**Stack:** Vanilla JS ES Modules · IndexedDB (Dexie 4) · Service Worker · Chart.js 4 · CSS Custom Properties  
**Regla de oro:** La View **nunca** accede directamente al Repository o Database. Todo fluye: View → Controller → Service → Repository → DB.

---

## 📦 Módulos Implementados (14/14)

| Módulo | Funcionalidad Clave | Tests |
|--------|---------------------|-------|
| 🔐 **Autenticación** | PBKDF2-SHA512, sesiones, wizard setup, RBAC 30 permisos | 28 |
| 👥 **Usuarios** | CRUD, roles Admin/Vendedor, activación, cambio password | 7 |
| 📦 **Productos** | CRUD, código auto-generado, stock, categorías, búsqueda | 21 |
| 👤 **Clientes** | CRUD, documento único, email/teléfono validados | 19 |
| 🏭 **Proveedores** | CRUD, NIT/RUC, validación formato regional | 19 |
| 💰 **Ventas** | Carrito, stock atómico, anulación con reversión, detalle | 23 |
| 🛒 **Compras** | Proveedor + items, entrada stock, anulación con reversión | 22 |
| 📊 **Inventario** | Stock calculado desde movimientos, ajustes, historial, alertas | 14 |
| 📈 **Reportes** | Ventas/Compras/Stock por fechas, auto-generación, resúmenes | 13 |
| ⚙️ **Configuración** | 2 secciones, grid responsive, moneda/impuesto dinámicos | 20 |
| 📤 **Exportación** | CSV/JSON multi-entidad, streaming, escape fórmula | 12 |
| 📥 **Importación** | CSV/JSON, auto-detección, sanitización, prototype pollution guard | 55 |
| 📋 **Contabilidad** | Plan cuentas, Libro Diario, Balance General, Estado Resultados, asientos auto | 24 |
| 📊 **Dashboard** | 6 KPIs + 2 gráficos Chart.js (barras/dona) | 17 |

---

## 🛡️ Seguridad (OWASP)

| Vulnerabilidad | Mitigación |
|----------------|------------|
| **XSS Almacenado** | `sanitizer.js` — `escapeHtml`, `stripTags` en todas las entradas y render |
| **XSS Reflejado** | Búsqueda usa `textContent`, nunca `innerHTML` con datos dinámicos |
| **Prototype Pollution** | `ImportService._sanitizeRecord` elimina `__proto__`, `constructor.prototype` |
| **CSV Formula Injection** | Exportación prefija `=`, `+`, `-`, `@` con `'` |
| **SQL Injection** | IndexedDB no usa SQL; entradas tratadas como literales |
| **RBAC Bypass** | Checks en **Service Layer**, no en View; tokens validados en cada request |
| **Session Hijacking** | Tokens en localStorage con expiración, limpieza automática |

---

## ⚡ Performance

| Optimización | Impacto |
|--------------|---------|
| **Schema DB v8** — índices compuestos `[customerId+date]`, `[supplierId+date]`, `[referenceType+referenceId]`, `stock` | Consultas full-scan → indexadas |
| **7 Repositorios optimizados** | `where().below()`, `between()`, `anyOf()` en vez de `.filter()` en memoria |
| **DocumentFragment** en `SaleFormView`, `PurchaseFormView`, `Table` | Batch DOM: 3x faster render |
| **Cache de cuentas** en `AccountingService` con invalidación explícita | Evita N+1 queries en reportes contables |
| **SW Stale-While-Revalidate** | Assets servidos instantáneamente offline |

---

## 🧪 Cómo Ejecutar la Suite de Tests

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar Dexie para modo offline (requerido)
cp node_modules/dexie/dist/dexie.mjs assets/lib/dexie.js

# 3. Tests unitarios + integración (45 suites, 410+ tests)
npm test
# ✅ Expected: 45 suites passed, 0 failed

# 4. Tests E2E con Playwright (38 tests, puerto 3099)
npm run test:e2e
# ✅ Expected: 38 passed, 0 failed

# 5. Tests QA Adversariales (5 fases, 76 tests)
# Se ejecutan dentro de test:e2e usando tests/e2e/phase*.js

# 6. Smoke test visible con video (headed, slowMo)
node tests/e2e/smoke-visible.js
# ✅ Video guardado en videos/smoke-*.webm
```

### Verificación Rápida (30 segundos)

```bash
# Solo tests unitarios (más rápidos, ~10s)
node tests/run-all.js

# Ver cobertura por suite
npm test 2>&1 | tail -20
```

---

## 🐛 Defectos Críticos Encontrados y Corregidos

| # | Defecto | Severidad | Solución |
|---|---------|-----------|----------|
| 1 | **Race condition en ajustes de inventario** | Critical | Transacción Dexie atómica + helper `_executeAdjustment()` |
| 2 | **innerHTML con datos dinámicos en app.js** | High | Reemplazado por `clearElement()` + DOM API (`createElement`/`textContent`) |
| 3 | **Recursión infinita en ConfirmDialog** | High | Limpieza de `onClose` antes de `modal.close()` |
| 4 | **Prototype pollution via JSON import** | Critical | Sanitización de keys `__proto__`, `constructor.prototype` |
| 5 | **CSV Formula Injection en exportación** | High | Prefijo `'` en celdas que empiezan con `=`, `+`, `-`, `@` |
| 6 | **Dark mode: texto ilegible en Contabilidad** | Medium | Variables CSS faltantes (`--color-muted`, `--color-bg-secondary`) + `color: var(--color-text)` en body |
| 7 | **Dark mode: badges solo texto coloreado** | Medium | Fondo sólido + texto blanco para `.status--*`, `.report-stat--*`, `.import-results__badge--*` |
| 8 | **Import JSON multi-entidad roto** | High | `parseJSON` detecta objeto raíz + `importFullExport()` ordenado |
| 9 | **Import CSV: IDs numéricos no resueltos** | High | `_resolveCustomer/Supplier/Product` prueba `findById` antes de fallback |
| 10 | **findByDateRange: fin de día excluido** | Medium | EndDate extendido a `T23:59:59.999Z` |
| 11 | **Auto-detección importación: solo español** | Medium | Weighted scoring + 30 field names internacionales + tiebreaker por documentId |
| 12 | **Proveedores guardados como clientes** | High | Error explícito en empate sin header discriminante |
| 13 | **Setup wizard no redirige a login** | Medium | `showSetup()` → `showLogin()` en vez de `startApp()` |
| 14 | **Tests sin cleanup DOM entre suites** | Medium | `resetDOM()` en `finally` block de `run-all.js` |
| 15 | **Vistas >300 líneas (AccountingView 624, ReportView 329)** | Tech Debt | División en sub-vistas: Accounting (4), Reports (3) |

---

## 🚀 Inicio Rápido

### Opción A: Scripts Automáticos (Recomendado)

```bash
# Linux / macOS
chmod +x setup.sh
./setup.sh

# Windows
setup.bat
```

Los scripts instalan dependencias, copian Dexie a `assets/lib`, detectan un **puerto persistente** (`.openroot-erp-port`) y configuran el **auto-inicio del servidor**: systemd/cron `@reboot` en Linux, y un lanzador oculto (`OpenRootERP.vbs`) en la carpeta de Inicio de Windows que arranca sin ventana cmd. Si instalas varias de estas apps, cada una conserva su propia entrada y usa un puerto distinto (3000, 3001, …).

### Opción B: Manual

```bash
# 1. Dependencias
npm install

# 2. Dexie local (offline)
cp node_modules/dexie/dist/dexie.mjs assets/lib/dexie.js

# 3. Servidor local (ES Modules requieren HTTP)
python3 -m http.server 3000
# Abrir http://localhost:3000
```

### Primer Uso

1. Se abre **Asistente de Configuración**
2. Ingresar: Nombre del negocio, Usuario admin, Contraseña (mín 8 chars)
3. Click "Configurar Sistema"
4. Login con credenciales creadas
5. ¡Listo! Datos de ejemplo precargados (10 productos, 5 clientes, 3 proveedores, 2 ventas, 2 compras, asientos contables)

---

## 🗑️ Desinstalación

### Linux / macOS

```bash
chmod +x uninstall.sh
./uninstall.sh
# o: bash uninstall.sh si no tiene permiso de ejecución
```

### Windows

```batch
uninstall.bat
```

Los scripts de desinstalación:
- Detienen el servidor si está corriendo
- Eliminan **solo la entrada de auto-inicio de esta app** (cron por proyecto, systemd, lanzador `.vbs`/`.bat` de Windows) sin tocar otras apps ni tus tareas de producción
- Limpian archivos temporales (`.openroot-erp-port`)
- **La carpeta del proyecto se elimina manualmente al final** (nunca de forma automática)

Ver [UNINSTALL.md](docs/UNINSTALL.md) para detalles completos.

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [ARQUITECTURA](ARCHITECTURE.md) | Stack, patrones, schema DB, flujo datos, seguridad |
| [PLAN QA](QA_TESTING_PLAN.md) | 22 áreas, 570+ escenarios adversariales, 6 personas |
| [ROADMAP](ROADMAP.md) | Fases completadas, entregas v1.0.0-v1.4.0, principios |
| [TODO](TODO.md) | Checklist 371 líneas, todas las fases ✅ |
| [ESTADO PROYECTO](docs/PROJECT_STATE.md) | Métricas detalladas, deuda técnica, riesgos, archivos clave |
| [CONTEXTO](docs/Context.md) | Stack, 14 módulos, utils, RBAC, fixes, skills prioritarias |
| [INSTALACIÓN](docs/INSTALL.md) | Instalación y auto-inicio (setup.sh/bat) |
| [DESINSTALACIÓN](docs/UNINSTALL.md) | Desinstalación (uninstall.sh/bat), limpieza de datos |

---

## 📁 Estructura del Proyecto

```
open-rooterp/
├── index.html                 # SPA entry point
├── manifest.json              # PWA manifest
├── sw.js                      # Service Worker
├── setup.sh / setup.bat       # Instalación automática
├── uninstall.sh / uninstall.bat  # Desinstalación automática
│
├── assets/
│   ├── css/                   # variables, reset, layout, components, utilities
│   ├── lib/                   # dexie.js, chart.umd.min.js (locales para offline)
│   └── icons/                 # SVG icons
│
├── src/
│   ├── app.js                 # Bootstrap, router, DI wiring
│   ├── config/app.js          # Constantes globales
│   ├── database/
│   │   ├── db.js              # Dexie schema v8 (índices compuestos)
│   │   └── seed.js            # Datos iniciales + transacciones seed
│   ├── models/                # 16 modelos (Account, Product, Sale, etc.)
│   ├── repositories/          # 12 repos (encapsulan Dexie)
│   ├── services/              # 15 servicios (lógica de negocio)
│   ├── controllers/           # 14 controladores (orquestación)
│   ├── views/                 # 19 vistas (render + eventos)
│   ├── components/            # 10 componentes UI reutilizables
│   ├── store/AppState.js      # Estado global (reservado)
│   └── utils/                 # sanitizer, validators, helpers, formatters, errors, ThemeManager
│
├── tests/
│   ├── run-all.js             # Runner unit/integration (DOM shim)
│   ├── runner.html            # Runner para navegador
│   ├── services/              # 13 suites servicios
│   ├── controllers/           # 14 suites controladores
│   ├── integration/           # 9 suites integración (54+ tests)
│   ├── utils/                 # 5 suites utilidades
│   └── e2e/                   # Playwright: phase2-adversarial, phase3-stress, phase4-security, phase5-a11y
│
├── ARCHITECTURE.md
├── QA_TESTING_PLAN.md
├── ROADMAP.md
├── TODO.md
├── SESSION.md
├── package.json
└── README.md                  # Este archivo
```

---

## 🎯 Principios Rectores

- **Sin frameworks externos** — Solo Dexie y Chart.js como dependencias
- **100% offline desde el día 1** — Service Worker + IndexedDB + assets locales
- **Código modular, testeable y mantenible** — Máx 300 líneas/archivo, 40 líneas/función
- **UI responsiva y accesible** — WCAG 2.1 AA, ARIA, navegación teclado, contraste
- **Seguridad por defecto** — OWASP Top 10 mitigado, sanitización en capas

---

## 📄 Licencia

MIT License — Ver [LICENSE](LICENSE) para detalles.

---

## 🤝 Contribuciones

1. Fork del repositorio
2. Crear rama: `git checkout -b feature/nueva-funcionalidad`
3. Seguir convenciones: 1 clase/archivo, máx 300 líneas, tests para nuevo código
4. Ejecutar `npm test && npm run test:e2e` — **debe pasar 100%**
5. Pull Request con descripción clara

---

---

# Open RootERP (English)

> **Lightweight ERP, 100% offline, zero frameworks** — For small businesses needing complete management without internet dependency.

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/adonis/apps-locales/erp-ligero-offline)
[![Tests](https://img.shields.io/badge/tests-524%2B-brightgreen)](https://github.com/adonis/apps-locales/erp-ligero-offline)
[![Pass Rate](https://img.shields.io/badge/pass%20rate-100%25-brightgreen)](https://github.com/adonis/apps-locales/erp-ligero-offline)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Node](https://img.shields.io/badge/node-18%2B-brightgreen)](https://nodejs.org/)
[![Offline](https://img.shields.io/badge/offline-100%25-orange)](https://github.com/adonis/apps-locales/erp-ligero-offline)

---

## 📊 Recruiter Metrics Dashboard

| Metric | Value |
|--------|-------|
| **Total Tests** | **525+** |
| **Pass Rate** | **100%** |
| **Defects Found & Fixed** | **16+ Critical** |
| **Module Coverage** | **14/14 Complete** |

### Breakdown by Test Type

| Test Type | Count | Suites | Passed | Rate |
|-----------|-------|--------|--------|------|
| **Unit / Integration** | 410+ | 45 | 410+ | **100%** |
| **E2E (Playwright)** | 38 | 1 | 38 | **100%** |
| **Adversarial QA (5 phases)** | 76 | 4 files | 76 | **100%** |
| ├─ Phase 2: Adversarial | 44 | - | 44 | 100% |
| ├─ Phase 3: Stress & Chaos | 10 | - | 10 | 100% |
| ├─ Phase 4: Security | 10 | - | 10 | 100% |
| └─ Phase 5: Accessibility & Mobile | 12 | - | 12 | 100% |

### Testing Tools

| Tool | Purpose |
|------|---------|
| **Playwright** | E2E automation, multi-tab, network control, Chromium headless + headed |
| **Custom Node Runner** | Unit/Integration with DOM shim (`tests/run-all.js`) |
| **axe-core** | Automated WCAG 2.1 AA accessibility scanning |
| **Chrome DevTools** | Memory profiling, performance, IndexedDB, network |
| **Dexie.js** | IndexedDB mocking for unit tests |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        index.html (SPA)                      │
├─────────────────────────────────────────────────────────────┤
│                      app.js — Router + DI                    │
├──────────┬──────────┬──────────┬────────────────────────────┤
│  Views   │Controllers│ Services │      Repositories         │
│ (render) │ (orquest)│(business)│        (data/Dexie)        │
├──────────┴──────────┴──────────┴────────────────────────────┤
│                    Dexie.js + IndexedDB                      │
├─────────────────────────────────────────────────────────────┤
│              Service Worker — Cache API + Offline            │
└─────────────────────────────────────────────────────────────┘
```

**Patterns:** Strict MVC + Repository Pattern + Service Layer + Manual DI  
**Stack:** Vanilla JS ES Modules · IndexedDB (Dexie 4) · Service Worker · Chart.js 4 · CSS Custom Properties  
**Golden Rule:** View **never** accesses Repository or Database directly. Flow: View → Controller → Service → Repository → DB.

---

## 📦 Implemented Modules (14/14)

| Module | Key Features | Tests |
|--------|--------------|-------|
| 🔐 **Authentication** | PBKDF2-SHA512, sessions, setup wizard, RBAC 30 permissions | 28 |
| 👥 **Users** | CRUD, Admin/Seller roles, activation, password change | 7 |
| 📦 **Products** | CRUD, auto-generated codes, stock, categories, search | 21 |
| 👤 **Customers** | CRUD, unique document, validated email/phone | 19 |
| 🏭 **Suppliers** | CRUD, NIT/RUC, regional format validation | 19 |
| 💰 **Sales** | Cart, atomic stock, cancellation with reversal, detail | 23 |
| 🛒 **Purchases** | Supplier + items, stock entry, cancellation with reversal | 22 |
| 📊 **Inventory** | Movement-calculated stock, adjustments, history, alerts | 14 |
| 📈 **Reports** | Sales/Purchases/Stock by date, auto-generation, summaries | 13 |
| ⚙️ **Settings** | 2 sections, responsive grid, dynamic currency/tax | 20 |
| 📤 **Export** | CSV/JSON multi-entity, streaming, formula escape | 12 |
| 📥 **Import** | CSV/JSON, auto-detect, sanitization, prototype pollution guard | 55 |
| 📋 **Accounting** | Chart of Accounts, Journal, Balance Sheet, P&L, auto entries | 24 |
| 📊 **Dashboard** | 6 KPIs + 2 Chart.js charts (bar/donut) | 17 |

---

## 🛡️ Security (OWASP)

| Vulnerability | Mitigation |
|---------------|------------|
| **Stored XSS** | `sanitizer.js` — `escapeHtml`, `stripTags` on all inputs and renders |
| **Reflected XSS** | Search uses `textContent`, never `innerHTML` with dynamic data |
| **Prototype Pollution** | `ImportService._sanitizeRecord` removes `__proto__`, `constructor.prototype` |
| **CSV Formula Injection** | Export prefixes `=`, `+`, `-`, `@` with `'` |
| **SQL Injection** | IndexedDB uses no SQL; inputs treated as literals |
| **RBAC Bypass** | Checks in **Service Layer**, not View; tokens validated per request |
| **Session Hijacking** | Tokens in localStorage with expiry, auto-cleanup |

---

## ⚡ Performance

| Optimization | Impact |
|--------------|--------|
| **DB Schema v8** — composite indexes `[customerId+date]`, `[supplierId+date]`, `[referenceType+referenceId]`, `stock` | Full-scan → indexed queries |
| **7 Repositories optimized** | `where().below()`, `between()`, `anyOf()` vs in-memory `.filter()` |
| **DocumentFragment** in `SaleFormView`, `PurchaseFormView`, `Table` | Batch DOM: 3x faster render |
| **Account cache** in `AccountingService` with explicit invalidation | Prevents N+1 queries in financial reports |
| **SW Stale-While-Revalidate** | Assets served instantly offline |

---

## 🧪 Running the Test Suite

```bash
# 1. Install dependencies
npm install

# 2. Copy Dexie for offline mode (required)
cp node_modules/dexie/dist/dexie.mjs assets/lib/dexie.js

# 3. Unit + Integration tests (45 suites, 410+ tests)
npm test
# ✅ Expected: 45 suites passed, 0 failed

# 4. E2E tests with Playwright (38 tests, port 3099)
npm run test:e2e
# ✅ Expected: 38 passed, 0 failed

# 5. Adversarial QA tests (5 phases, 76 tests)
# Run within test:e2e via tests/e2e/phase*.js

# 6. Visible smoke test with video recording (headed, slowMo)
node tests/e2e/smoke-visible.js
# ✅ Video saved to videos/smoke-*.webm
```

### Quick Verification (30 seconds)

```bash
# Unit tests only (faster, ~10s)
node tests/run-all.js

# View suite breakdown
npm test 2>&1 | tail -20
```

---

## 🐛 Critical Defects Found & Fixed

| # | Defect | Severity | Solution |
|---|--------|----------|----------|
| 1 | **Race condition in inventory adjustments** | Critical | Atomic Dexie transaction + `_executeAdjustment()` helper |
| 2 | **innerHTML with dynamic data in app.js** | High | Replaced with `clearElement()` + DOM API (`createElement`/`textContent`) |
| 3 | **Infinite recursion in ConfirmDialog** | High | Cleanup `onClose` before `modal.close()` |
| 4 | **Prototype pollution via JSON import** | Critical | Key sanitization for `__proto__`, `constructor.prototype` |
| 5 | **CSV Formula Injection in export** | High | Prefix `'` on cells starting with `=`, `+`, `-`, `@` |
| 6 | **Dark mode: unreadable text in Accounting** | Medium | Missing CSS vars (`--color-muted`, `--color-bg-secondary`) + `color: var(--color-text)` on body |
| 7 | **Dark mode: badges only colored text** | Medium | Solid background + white text for `.status--*`, `.report-stat--*`, `.import-results__badge--*` |
| 8 | **Multi-entity JSON import broken** | High | `parseJSON` detects root object + ordered `importFullExport()` |
| 9 | **CSV Import: numeric IDs unresolved** | High | `_resolveCustomer/Supplier/Product` tries `findById` before fallback |
| 10 | **findByDateRange: end-of-day excluded** | Medium | EndDate extended to `T23:59:59.999Z` |
| 11 | **Import auto-detect: Spanish only** | Medium | Weighted scoring + 30 intl field names + documentId tiebreaker |
| 12 | **Suppliers saved as customers** | High | Explicit error on tie without discriminating header |
| 13 | **Setup wizard doesn't redirect to login** | Medium | `showSetup()` → `showLogin()` instead of `startApp()` |
| 14 | **Tests without DOM cleanup between suites** | Medium | `resetDOM()` in `finally` block of `run-all.js` |
| 15 | **Views >300 lines (AccountingView 624, ReportView 329)** | Tech Debt | Split into sub-views: Accounting (4), Reports (3) |

---

## 🚀 Quick Start

### Option A: Auto Scripts (Recommended)

```bash
# Linux / macOS
chmod +x setup.sh
./setup.sh

# Windows
setup.bat
```

The scripts install dependencies, copy Dexie to `assets/lib`, detect a **persistent port** (`.openroot-erp-port`) and configure **server auto-start**: systemd/cron `@reboot` on Linux, and a hidden launcher (`OpenRootERP.vbs`) in the Windows Startup folder that runs without a cmd window. If you install several of these apps, each keeps its own entry and uses a different port (3000, 3001, …).

### Option B: Manual

```bash
# 1. Dependencies
npm install

# 2. Local Dexie (offline)
cp node_modules/dexie/dist/dexie.mjs assets/lib/dexie.js

# 3. Local server (ES Modules require HTTP)
python3 -m http.server 3000
# Open http://localhost:3000
```

### First Run

1. **Setup Wizard** opens automatically
2. Enter: Business name, Admin user, Password (min 8 chars)
3. Click "Configure System"
4. Login with created credentials
5. **Done!** Preloaded sample data (10 products, 5 customers, 3 suppliers, 2 sales, 2 purchases, accounting entries)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE](ARCHITECTURE.md) | Stack, patterns, DB schema, data flow, security |
| [QA PLAN](QA_TESTING_PLAN.md) | 22 areas, 570+ adversarial scenarios, 6 personas |
| [ROADMAP](ROADMAP.md) | Completed phases, v1.0.0-v1.4.0 releases, principles |
| [TODO](TODO.md) | 371-line checklist, all phases ✅ |
| [PROJECT STATE](docs/PROJECT_STATE.md) | Detailed metrics, tech debt, risks, key files |
| [CONTEXT](docs/Context.md) | Stack, 14 modules, utils, RBAC, fixes, priority skills |
| [INSTALL](docs/INSTALL.md) | Setup.sh/bat, manual, first run, updates |
| [E2E TESTS](docs/E2E_TESTS.md) | 76 tests + visible smoke test, helpers, module coverage |
| [QA RESULTS](docs/QA_RESULTS.md) | 160 total tests, 100% pass, fixed findings |
| [THEME](docs/THEME_MANAGER.md) | ThemeManager API, singleton, localStorage, usage |

---

## 📁 Project Structure

```
open-rooterp/
├── index.html                 # SPA entry point
├── manifest.json              # PWA manifest
├── sw.js                      # Service Worker
├── setup.sh / setup.bat       # Auto-install scripts
├── uninstall.sh / uninstall.bat  # Auto-uninstall scripts
│
├── assets/
│   ├── css/                   # variables, reset, layout, components, utilities
│   ├── lib/                   # dexie.js, chart.umd.min.js (local for offline)
│   └── icons/                 # SVG icons
│
├── src/
│   ├── app.js                 # Bootstrap, router, DI wiring
│   ├── config/app.js          # Global constants
│   ├── database/
│   │   ├── db.js              # Dexie schema v8 (composite indexes)
│   │   └── seed.js            # Initial data + seed transactions
│   ├── models/                # 16 models (Account, Product, Sale, etc.)
│   ├── repositories/          # 12 repos (encapsulate Dexie)
│   ├── services/              # 15 services (business logic)
│   ├── controllers/           # 14 controllers (orchestration)
│   ├── views/                 # 19 views (render + events)
│   ├── components/            # 10 reusable UI components
│   ├── store/AppState.js      # Global state (reserved)
│   └── utils/                 # sanitizer, validators, helpers, formatters, errors, ThemeManager
│
├── tests/
│   ├── run-all.js             # Unit/Integration runner (DOM shim)
│   ├── runner.html            # Browser runner
│   ├── services/              # 13 service suites
│   ├── controllers/           # 14 controller suites
│   ├── integration/           # 9 integration suites (54+ tests)
│   ├── utils/                 # 5 utility suites
│   └── e2e/                   # Playwright: smoke-visible, phase2-adversarial, phase3-stress, phase4-security, phase5-a11y
│
├── videos/                     # Smoke test recordings (.webm)
├── ARCHITECTURE.md
├── QA_TESTING_PLAN.md
├── ROADMAP.md
├── TODO.md
├── SESSION.md
├── package.json
└── README.md                  # This file
```

---

## 🎯 Guiding Principles

- **No external frameworks** — Only Dexie and Chart.js as dependencies
- **100% offline from day 1** — Service Worker + IndexedDB + local assets
- **Modular, testable, maintainable code** — Max 300 lines/file, 40 lines/function
- **Responsive & accessible UI** — WCAG 2.1 AA, ARIA, keyboard nav, contrast
- **Security by default** — OWASP Top 10 mitigated, layered sanitization

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create branch: `git checkout -b feature/new-feature`
3. Follow conventions: 1 class/file, max 300 lines, tests for new code
4. Run `npm test && npm run test:e2e` — **must pass 100%**
5. Pull Request with clear description