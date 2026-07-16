# ROADMAP — ERP Ligero Offline

**Versión:** 1.0.0  
**Estado:** Primer lanzamiento público — todas las fases completadas

---

## Visión

ERP ligero, 100% offline, pensado para pequeños negocios que necesitan gestionar productos, inventario, clientes, proveedores, ventas, compras y contabilidad básica sin depender de conexión a internet.

---

## Fases

### Fase 1 — Fundación (MVP) ✅

| # | Módulo | Descripción | Estado |
|---|--------|-------------|--------|
| 1.1 | Scaffolding | Estructura de directorios, archivos base, configuración | ✅ |
| 1.2 | Database | Schema Dexie: Products, Customers, Suppliers, Sales, Purchases, Users | ✅ |
| 1.3 | Core UI | Layout base, sidebar, header, navegación SPA | ✅ |
| 1.4 | Productos | CRUD completo + búsqueda | ✅ |
| 1.5 | Clientes | CRUD completo + búsqueda | ✅ |
| 1.6 | Proveedores | CRUD completo + búsqueda | ✅ |
| 1.7 | Ventas | Registro de ventas + detalle + lista | ✅ |
| 1.8 | Compras | Registro de compras + detalle + lista | ✅ |
| 1.9 | Dashboard | Resumen con indicadores clave | ✅ |
| 1.10 | Service Worker | Cacheo de assets para 100% offline + PWA installable | ✅ |

**Adicionales implementados:** Autenticación (PBKDF2 + RBAC), Importación/Exportación, Reportes, Configuración, Módulo Usuarios.

---

### Fase 2 — Inventario y Movimientos ✅

| # | Módulo | Descripción | Estado |
|---|--------|-------------|--------|
| 2.1 | Control de Stock | Stock actual por producto, precio ponderado | ✅ |
| 2.2 | Movimientos | Entradas, salidas, ajustes de inventario | ✅ |
| 2.3 | Alertas | Stock mínimo, stock crítico | ✅ |
| 2.4 | Transferencias | Movimiento entre almacenes (si aplica) | ⬜ Futuro |

---

### Fase 3 — Contabilidad Básica ✅

| # | Módulo | Descripción | Estado |
|---|--------|-------------|--------|
| 3.1 | Libro Diario | Registro automático de transacciones desde ventas/compras | ✅ |
| 3.2 | Plan de Cuentas | Catálogo contable configurable con 7 cuentas predefinidas | ✅ |
| 3.3 | Reportes | Balance General y Estado de Resultados | ✅ |

**Detalles:**
- Asientos automáticos: Ventas (Caja → Ventas + IGV + Costo → Inventario), Compras (Inventario + IGV → Proveedores)
- Anulaciones generan asientos inversos
- 7 cuentas seed: 1101 Caja, 1201 Mercaderías, 2101 IGV, 2102 Proveedores, 3101 Capital, 4101 Ventas, 5101 Costo de Ventas
- Permisos: `accounting.view` (Vendedor), `accounting.create`, `accounting.edit`
- Cache de cuentas en AccountingService con invalidación explícita

---

### Fase 4 — Reportes y Exportación (parcial)

| # | Módulo | Descripción | Estado |
|---|--------|-------------|--------|
| 4.1 | Reportes | Ventas por período, productos más vendidos, etc. | ✅ |
| 4.2 | Exportación | CSV, JSON de cualquier módulo | ✅ |
| 4.3 | Gráficos | Dashboard visual con Chart.js | ✅ |

**Implementado en Fase 4.3:**
- Chart.js 4.x integrado (`assets/lib/chart.umd.min.js`)
- Ventas Mensuales: Gráfico de barras, últimos 12 meses
- Productos por Categoría: Gráfico de dona, distribución por `category`
- DashboardService: `getMonthlySales()`, `getCategoryDistribution()`
- DashboardView: `renderCharts()` crea canvas e instancia Chart

---

### Fase 5 — Calidad y Pruebas ✅

| # | Módulo | Descripción | Estado |
|---|--------|-------------|--------|
| 5.1 | Tests Unitarios | Services, Repositories, Utils (36 suites, 380+ tests) | ✅ |
| 5.2 | Tests Integración | 9 suites, 54+ tests (venta/compra/contabilidad/import-export) | ✅ |
| 5.3 | Auditoría Seguridad | Revisión OWASP — innerHTML, eval, sanitización, logs sensibles | ✅ |
| 5.4 | Performance | Schema v8, 7 repos optimizados, DocumentFragment en 3 vistas | ✅ |

---

### Fase 6 — UX y Pulido

| # | Módulo | Descripción | Estado |
|---|--------|-------------|--------|
| 6.1 | Temas | Modo claro/oscuro vía CSS Custom Properties + persistencia localStorage | ✅ |
| 6.2 | Accesibilidad | ARIA roles, navegación teclado, etiquetas formularios | ✅ |
| 6.2a | Accesibilidad (cont.) | Contraste WCAG 2.1 AA | ✅ |
| 6.3 | E2E Testing | 38 tests E2E con Playwright (cubre todos los módulos) | ✅ |
| 6.4 | Offline avanzado | Sincronización cuando haya conectividad (futuro) | ⬜ Futuro |

---

## Entregas

| Hito | Estado | Contenido |
|------|--------|-----------|
| MVP | ✅ Completado | Fase 1 completa + Autenticación + RBAC |
| v1.1.0 | ✅ Completado | Fase 1 + Fase 2 + Import/Export + Reportes + Usuarios |
| v1.2.0 | ✅ Completado | Contabilidad Básica (Fase 3) |
| v1.2.1 | ✅ Completado | Dashboard Gráficos (Fase 4.3) |
| v1.3.0 | ✅ Completado | Fase 5 completa (5.1 unitarios ✅, 5.2 integración ✅, 5.3 seguridad ✅, 5.4 performance ✅). Fase 6 pendiente |
| v1.3.1 | ✅ Completado | Fase 6.1 Temas (claro/oscuro) + Fase 6.2 Accesibilidad (ARIA + Teclado + Contraste + Etiquetas) |
| v1.4.0 | ✅ Release Candidate | Fase 6.3 E2E Testing (38 tests), deuda técnica (view splitting), mitigación de riesgos |

---

## Principios Rectores

- Sin frameworks externos (solo Dexie y Chart.js)
- 100% offline desde el día 1
- Código modular, testeable y mantenible
- UI responsiva y accesible
- Seguridad por defecto (OWASP)

---

## Próximos pasos inmediatos

1. ~~**Temas claro/oscuro** (Fase 6.1)~~ ✅ Completado
2. ~~**Accesibilidad WCAG 2.1 AA (ARIA + Teclado + Etiquetas)**~~ ✅ Completado
3. ~~**Contraste WCAG 2.1 AA** (Fase 6.2a): Verificar y ajustar ratios de contraste~~ ✅ Completado
4. ~~**Dividir vistas grandes**: AccountingView (624→~200), ReportView (329), PurchaseFormView (306)~~ ✅ Completado
5. ~~**E2E Testing**: 38 tests con Playwright cubriendo todos los módulos~~ ✅ Completado
6. **Release v1.4.0**: Primer release oficial

## Test suite actual

**38 tests E2E** (Playwright + Chromium, port 3099):
- Setup wizard, login/logout/re-login
- Product CRUD (crear, editar, eliminar, buscar, validación)
- Customer crear + duplicado
- Supplier crear
- Sales (con/sin cliente, detalle, anular)
- Purchases (crear, anular)
- Inventory (ver stock, ajuste)
- Accounting (journal, accounts CRUD, balance, income)
- Reports (sales, stock)
- Settings update
- Export JSON + CSV
- Import CSV + JSON
- Users CRUD (ver tabla, crear, editar, eliminar)

**410+ unit/integration tests**: 45 suites, 0 fallos