# Tests E2E — Open RootERP

**Runner:** `npm run test:e2e` (Playwright + Chromium headless, puerto 3099)
**Helpers:** `tests/e2e/helpers.js`

---

## `tests/e2e/phase2-adversarial.js` — 44 escenarios

Cubre interacciones adversariales: entradas inválidas, doble-click, fuerza bruta, spam, datos maliciosos.

| Área | Escenarios |
|------|------------|
| Setup | Logo corrupto, contraseña débil, setup duplicado |
| Login | Sesión activa, password incorrecto, campos vacíos, usuario inexistente, SQL injection, fuerza bruta (30 intentos), caracteres especiales |
| Sidebar | Colapsado, expandido, clicks rápidos, módulo inexistente |
| Productos | Creación/cancelación rápida 10x, código duplicado, precio negativo, precio cero, nombre 500 chars, código vacío, solo espacios |
| Clientes | Documento duplicado, email inválido, teléfono especiales, nombre con números |
| Proveedores | Duplicado, borrar con productos asociados, documento ultra largo |
| Compras | Sin proveedor, cantidad negativa, precio total cero |
| Ventas | Sin cliente, stock insuficiente, stock negativo |
| General | Exportar tabla vacía, JSON malformado, navegar durante export, spam toolbar, redimensionar durante carga, cerrar modal durante submit, doble click guardar, navegar mientras guarda, logout y volver |

---

## `tests/e2e/phase3-stress.js` — 10 escenarios

Cubre tests de estrés, carga concurrente y chaos.

| # | Escenario | Descripción |
|---|-----------|-------------|
| ST01 | Cambio rápido módulos 50x | Memoria: navegar 50 veces entre módulos |
| ST02 | Spam modal productos 100x | DOM: abrir/cerrar modal 100 veces |
| ST03 | Crear 50 productos | IndexedDB: stress de escritura |
| ST04 | Ordenar tabla 50x | Render: ordenar tabla repetidamente |
| ST05 | Búsqueda rápida 30x | Debounce: escribir rápido en buscador |
| ST06 | Navegar todos los módulos | Navegación: visitar cada módulo |
| ST07 | Verificar tabla 50+ registros | Render: validar tabla con datos masivos |
| ST08 | Guardar settings concurrente | Concurrencia: guardar mientras navega |
| ST09 | Restaurar settings | Post-stress: restaurar configuración |

---

## `tests/e2e/phase4-security.js` — 10 escenarios

Cubre vulnerabilidades de seguridad (XSS, prototype pollution, CSV injection).

| # | Escenario | Tipo |
|---|-----------|------|
| X1 | Stored XSS en nombre de producto | XSS persistente |
| X2 | Stored XSS en dirección de cliente | XSS persistente |
| X3 | Reflected XSS en búsqueda | XSS reflejado |
| X5 | CSV Formula Injection | CSV injection |
| X6 | Prototype pollution via `__proto__` | Prototype pollution |
| X7 | Constructor.prototype pollution | Prototype pollution |
| X9 | localStorage con datos maliciosos | Client-side tampering |
| X10 | Token de sesión inválido | Session hijacking |
| XSS_EXTRA | SVG onload en proveedor | XSS persistente |

---

## `tests/e2e/phase5-a11y.js` — 12 escenarios

Cubre accesibilidad WCAG y responsive design.

| # | Escenario | Categoría |
|---|-----------|-----------|
| A1 | Navegación por teclado (Tab) | Accesibilidad |
| A2 | Roles ARIA presentes | Accesibilidad |
| A4 | Labels en todos los inputs | Accesibilidad |
| A5 | Font-size accesible (≥14px) | Accesibilidad |
| A6 | Mensajes de error descriptivos | Accesibilidad |
| A7 | Skip to content link | Accesibilidad |
| R1 | Viewport 375×667 (iPhone SE) | Móvil |
| R2 | Viewport 768×1024 (iPad) | Tablet |
| R3 | Touch events: tap buttons | Táctil |
| R4 | Zoom 200% — layout estable | Baja visión |
| R5 | Formularios responsive en móvil | Móvil |

---

## Resumen

| Archivo | Escenarios | Cobertura |
|---------|-----------|-----------|
| `phase2-adversarial.js` | 44 | Adversarial / input validation / stress UX |
| `phase3-stress.js` | 10 | Performance / memoria / concurrencia |
| `phase4-security.js` | 10 | XSS / prototype pollution / CSV injection |
| `phase5-a11y.js` | 12 | Accesibilidad / responsive / táctil |
| **Total** | **76** | **5 fases QA** |
