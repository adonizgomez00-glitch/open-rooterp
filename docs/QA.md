# Plan de Testing QA — ERP Ligero Offline

**Versión:** 1.0  
**Enfoque:** Testing Adversarial / Exploratorio (A-QA-Breaker)  
**Objetivo:** Hacer fallar la aplicación. Encontrar bugs, no confirmar features.

---

## Resumen de la Aplicación

- **Stack:** Vanilla JS ES Modules, IndexedDB (Dexie.js), Service Worker, Chart.js
- **Arquitectura:** MVC + Service Layer + Repository Pattern
- **Módulos:** Auth, Productos, Clientes, Proveedores, Ventas, Compras, Inventario, Contabilidad, Reportes, Configuración, Import/Export, Usuarios
- **Seguridad:** Sanitización XSS, validación de entrada, RBAC, offline-first

---

## Filosofía de Testing

> *"Cada pantalla se asume que contiene bugs ocultos hasta que se demuestre lo contrario."*

### 6 Personalidades a simular

| Persona | Comportamiento |
|---------|---------------|
| **Usuario Descuidado** | Clicks aleatorios, campos vacíos, copy/paste, refresh frecuente |
| **Usuario Enojado** | Spam clicks, doble-click, navega durante carga, cancela diálogos |
| **Usuario Curioso** | DevTools, manipula URLs, edita localStorage/IndexedDB, rutas ocultas |
| **Usuario Malicioso** | XSS, SQLi, HTML injection, payloads grandes, unicode, control chars |
| **Usuario Conexión Lenta** | Offline, timeouts, cargas lentas, refresh mid-request |
| **Usuario Móvil** | Viewport pequeño, landscape/portrait, teclado, zoom 200%, fuentes a11y |

---

## Áreas de Test y Escenarios Adversarios

### 1. AUTENTICACIÓN Y SESIÓN

| # | Escenario | Ángulo Adversario | Falla Esperada |
|---|-----------|-------------------|----------------|
| A1 | Login con usuario/contraseña vacíos | Descuidado: submit en blanco | Error de validación |
| A2 | Login con 10,000 caracteres en username | Malicioso: input sobredimensionado | Rechazar graciosamente |
| A3 | Login con SQL injection: `' OR '1'='1` | Malicioso: string SQLi | No debe dar error, tratar como literal |
| A4 | Login con XSS: `<script>alert(1)</script>` | Malicioso: XSS | Sanitizar/escapar |
| A5 | Login con RTL override: `‮admin` | Malicioso: unicode bidi | No romper UI |
| A6 | Login con emoji en password: `🔥💣💀` | Malicioso: unicode | Manejar graciosamente |
| A7 | Doble-click rápido en "Ingresar" | Enojado: spam submit | No crear sesiones duplicadas |
| A8 | Click Back después de login → refresh | Descuidado: navegación browser | Mantener sesión o redirigir limpio |
| A9 | Abrir login en 2 pestañas, loguear en una, refrescar otra | Curioso: multi-pestaña | Sincronizar o manejar graciosamente |
| A10 | Borrar token de sesión de localStorage, refrescar | Curioso: manipular storage | Redirigir a login |
| A11 | Modificar token en localStorage al de otro usuario | Malicioso: escalada de privilegios | Invalidar sesión |
| A12 | Expirar token manualmente (poner expiresAt en pasado) | Malicioso: token expirado | Forzar re-login |
| A13 | Cerrar sesión mientras se crea una venta | Enojado: interrumpir proceso | Cancelar operaciones pendientes |
| A14 | Wizard setup: enviar con todos los campos vacíos | Descuidado: saltar requeridos | Mostrar errores de validación |
| A15 | Wizard setup: username con solo espacios | Descuidado: whitespace | Trim y rechazar |
| A16 | Wizard setup: password diferente a confirmación | Descuidado: no coinciden | Mostrar error |
| A17 | Wizard setup: password menor a 8 caracteres | Descuidado: password débil | Exigir minlength |
| A18 | Wizard setup: XSS en nombre del negocio | Malicioso: XSS persistente | Sanitizar al mostrar |
| A19 | Navegación directa a `/users` sin login | Curioso: ruta protegida | Redirigir a login |
| A20 | Login concurrente: mismo usuario, 2 navegadores | Malicioso: session fixation | Manejar según política |

---

### 2. MÓDULO PRODUCTOS

| # | Escenario | Ángulo Adversario | Falla Esperada |
|---|-----------|-------------------|----------------|
| P1 | Crear producto: nombre vacío | Descuidado: campo requerido | Error de validación |
| P2 | Crear producto: nombre de 5000 caracteres | Malicioso: input enorme | Truncar o rechazar |
| P3 | Crear producto: nombre = `<img src=x onerror=alert(1)>` | Malicioso: XSS | Sanitizado al renderizar |
| P4 | Crear producto: código duplicado | Descuidado: constraint único | Rechazar con mensaje claro |
| P5 | Crear producto: purchasePrice negativo | Malicioso: números negativos | Rechazar (min: 0) |
| P6 | Crear producto: salePrice = "abc" | Malicioso: confusión de tipo | Rechazar no numérico |
| P7 | Crear producto: stock = -100 | Malicioso: stock negativo | Rechazar |
| P8 | Crear producto: stock = 999999999999 | Malicioso: overflow | Manejar números grandes |
| P9 | Crear producto: categoría con emoji `🎮💻` | Malicioso: unicode | Guardar/mostrar correctamente |
| P10 | Crear producto: categoría con RTL `‮Electrónicos` | Malicioso: bidi override | No romper layout |
| P11 | Click rápido "+ Nuevo Producto" 20 veces | Enojado: spam modales | No abrir modales duplicados |
| P12 | Abrir modal editar, cambiar URL hash, cerrar modal | Curioso: navegación mid-flow | Limpiar estado |
| P13 | Editar producto: cambiar código a uno existente | Descuidado: duplicado al editar | Validar unicidad |
| P14 | Eliminar producto con historial de ventas | Regla negocio: integridad referencial | Bloquear o hacer cascade |
| P15 | Input de búsqueda: pegar 10MB de texto | Malicioso: DoS via búsqueda | Debounce y límite |
| P16 | Búsqueda: SQL injection `' UNION SELECT * FROM users--` | Malicioso: SQLi | Tratar como string literal |
| P17 | Formulario: pegar HTML en descripción | Malicioso: HTML injection | Eliminar etiquetas |
| P18 | Descripción con caracteres de control `\n\r\t` | Malicioso: control chars | Sanitizar |
| P19 | Código de producto: espacios al inicio/final | Descuidado: whitespace | Hacer trim |
| P20 | Código de producto: solo espacios | Descuidado: parece vacío | Rechazar |

---

### 3. MÓDULO CLIENTES

| # | Escenario | Ángulo Adversario | Falla Esperada |
|---|-----------|-------------------|----------------|
| C1 | Crear cliente: nombre vacío | Descuidado | Error de validación |
| C2 | Crear cliente: documentId duplicado | Descuidado / Regla negocio | Error de constraint único |
| C3 | documentId: SQL injection `' OR 1=1--` | Malicioso | Tratar como literal |
| C4 | documentId: XSS `<svg onload=alert(1)>` | Malicioso | Sanitizado |
| C5 | Email: formato inválido `not-an-email` | Descuidado | Validación de formato |
| C6 | Email: `a@b` (mínimo válido) | Edge case | Debe aceptar |
| C7 | Email: 500 caracteres parte local | Malicioso | Límite de longitud |
| C8 | Teléfono: letras `abcdefghij` | Descuidado | Rechazar o sanitizar |
| C9 | Teléfono: `+502 1234-5678 ext. 123` | Formato real | Debe aceptar |
| C10 | Dirección: 10,000 caracteres con saltos de línea | Malicioso | Manejar/truncar |
| C11 | Dirección: inyección RTF/Markdown | Malicioso | Eliminar |
| C12 | Crear rápido 50 clientes spammeando Enter | Enojado | No duplicar |
| C13 | Editar cliente: cambiar documentId a uno existente | Regla negocio | Rechazar |
| C14 | Eliminar cliente con historial de ventas | Regla negocio | Bloquear o hacer cascade |
| C15 | Búsqueda: pegar datos binarios | Malicioso | No debe crashear |
| C16 | Tabla: click simultáneo "Editar" y "Eliminar" | Enojado: race condition | Manejar una sola acción |

---

### 4. MÓDULO PROVEEDORES

| # | Escenario | Ángulo Adversario | Falla Esperada |
|---|-----------|-------------------|----------------|
| S1 | NIT/RUC duplicado | Regla negocio | Constraint único |
| S2 | Validación formato NIT: `12345678-9` vs `123456789` | Formato regional | Aceptar formatos válidos |
| S3 | Crear proveedor durante creación de compra | Integración | Debe funcionar |
| S4 | Proveedor con caracteres especiales: `José & María S.A.` | Mundo real | Debe manejar |
| S5 | Eliminar proveedor con historial de compras | Regla negocio | Bloquear o hacer cascade |

---

### 5. MÓDULO VENTAS (Crítico - Flujo de Dinero)

| # | Escenario | Ángulo Adversario | Falla Esperada |
|---|-----------|-------------------|----------------|
| SA1 | Crear venta: sin productos agregados | Descuidado: carrito vacío | Bloquear envío |
| SA2 | Crear venta: cantidad = 0 | Malicioso: edge case | Rechazar (mín: 1) |
| SA3 | Crear venta: cantidad = -5 | Malicioso: negativo | Rechazar |
| SA4 | Crear venta: cantidad = 999999 (excede stock) | Regla negocio | Verificar stock |
| SA5 | Crear venta: cantidad = 1.5 (decimal) | Malicioso: confusión tipo | Rechazar o truncar |
| SA6 | Crear venta: unitPrice = -100 | Malicioso: precio negativo | Rechazar |
| SA7 | Crear venta: unitPrice = "gratis" | Malicioso: string en número | Rechazar |
| SA8 | Crear venta: agregar mismo producto dos veces | Descuidado: línea duplicada | Fusionar cantidades |
| SA9 | Crear venta: modificar cantidad del carrito a 0 | Descuidado: eliminar via qty | Eliminar línea |
| SA10 | Crear venta: modificar cantidad mayor al stock | Regla negocio | Validar al cambiar |
| SA11 | Crear venta: cambiar selección de cliente a "ocasional" | Cambio de flujo | Manejar customerId null |
| SA12 | Notas con payload XSS | Malicioso: XSS almacenado | Sanitizar al renderizar |
| SA13 | Notas con 50KB de texto | Malicioso: payload enorme | Limitar longitud |
| SA14 | Doble-click rápido en "Agregar" | Enojado: race condition | No duplicar líneas |
| SA15 | Doble-click rápido en "Guardar Venta" | Enojado: doble envío | Deshabilitar botón al primer click |
| SA16 | Navegar fuera durante creación de venta | Descuidado: abandonar formulario | Advertir o auto-guardar borrador |
| SA17 | Refrescar página durante creación de venta | Descuidado: refresh | No crear venta parcial |
| SA18 | Offline: crear venta, volver online, sincronizar | Offline-first | Debe funcionar |
| SA19 | Cliente eliminado después de crear venta | Integridad de datos | Mostrar nombre desde registro de venta |
| SA20 | Anular venta: restauración correcta del stock | Crítico de negocio | El stock debe volver exactamente |
| SA21 | Anular venta: reversión del asiento contable | Integración | Crear asiento de reversión |
| SA22 | Anular venta que ya está anulada | Idempotencia | Mostrar error |
| SA23 | Eliminar venta: restauración del stock | Crítico de negocio | El stock debe volver |
| SA24 | Eliminar venta: eliminación del asiento contable | Integración | Eliminar asiento |
| SA25 | Ver detalle de venta eliminada | Edge case | Manejar graciosamente |
| SA26 | Venta con 100 líneas de items | Performance | Debe manejar |
| SA27 | Venta: producto eliminado después de agregar al carrito | Integridad de datos | Manejar producto faltante |
| SA28 | Ventas concurrentes del mismo producto (2 pestañas) | Race condition | El check de stock debe ser atómico |

---

### 6. MÓDULO COMPRAS

| # | Escenario | Ángulo Adversario | Falla Esperada |
|---|-----------|-------------------|----------------|
| PU1 | Crear compra: sin items | Descuidado | Bloquear envío |
| PU2 | Cantidad = 0 o negativa | Malicioso | Rechazar |
| PU3 | Precio unitario negativo | Malicioso | Rechazar |
| PU4 | Proveedor eliminado después de crear compra | Integridad de datos | Mostrar nombre desde registro de compra |
| PU5 | Anular compra: deducción correcta del stock | Crítico de negocio | Stock debe disminuir exactamente |
| PU6 | Anular compra: reversión contable | Integración | Crear reversión |
| PU7 | Eliminar compra: deducción del stock | Crítico de negocio | Stock debe disminuir |
| PU8 | Agregar/remover items rápidamente | Enojado | Sin duplicados |
| PU9 | Compra con 500 items | Performance | Debe manejar |

---

### 7. INVENTARIO / AJUSTES DE STOCK

| # | Escenario | Ángulo Adversario | Falla Esperada |
|---|-----------|-------------------|----------------|
| I1 | Ajuste: cantidad = 0 | Edge case | Rechazar o permitir |
| I2 | Ajuste: cantidad negativa para tipo "entrada" | Malicioso: bypass de lógica | Validar tipo/cantidad coincidan |
| I3 | Ajuste: cantidad enorme (overflow) | Malicioso | Manejar números grandes |
| I4 | Producto eliminado después de abrir modal de ajuste | Race condition | Manejar graciosamente |
| I5 | Historial de movimientos: 10,000 filas | Performance | Paginación / virtualización |
| I6 | Tipo de movimiento: XSS en notas | Malicioso | Sanitizar |
| I7 | Stock negativo mediante ajuste de salida | Regla de negocio | Permitir con advertencia o bloquear |

---

### 8. CONTABILIDAD

| # | Escenario | Ángulo Adversario | Falla Esperada |
|---|-----------|-------------------|----------------|
| AC1 | Plan de Cuentas: código duplicado | Regla de negocio | Constraint único |
| AC2 | Referencia circular (padre = hijo) | Malicioso: loop infinito | Detectar/prevenir |
| AC3 | Asiento contable: débito/crédito desbalanceado | Regla de negocio | Debe sumar cero |
| AC4 | Asiento contable: montos negativos | Malicioso | Rechazar |
| AC5 | Balance General: rango de fechas en futuro | Edge case | Debe manejar |
| AC6 | Balance General: fecha inicio mayor a fecha fin | Descuidado | Intercambiar o mostrar error |
| AC7 | Estado de Resultados: rango de fechas enorme (10 años) | Performance | Debe manejar |
| AC8 | Tipo de cuenta: valor enum inválido | Malicioso | Validar enum |
| AC9 | Eliminar cuenta con asientos | Integridad referencial | Bloquear |
| AC10 | Código de cuenta: ceros a la izquierda `0001` vs `1` | Integridad de datos | Preservar formato |

---

### 9. REPORTES

| # | Escenario | Ángulo Adversario | Falla Esperada |
|---|-----------|-------------------|----------------|
| R1 | Reporte de ventas: fecha inicio mayor a fecha fin | Descuidado | Intercambiar o mostrar error |
| R2 | Reporte de ventas: rango de fechas de 50 años | Performance | Manejar rangos grandes |
| R3 | Reporte de stock: filtrar por categoría con XSS | Malicioso | Sanitizar |
| R4 | Reporte con 0 resultados | Estado vacío | Mostrar mensaje vacío |
| R5 | Cambio rápido de pestañas de reporte | Enojado | No duplicar solicitudes |
| R6 | Exportar reporte durante su generación | Race condition | Manejar cancelación |

---

### 10. CONFIGURACIÓN

| # | Escenario | Ángulo Adversario | Falla Esperada |
|---|-----------|-------------------|----------------|
| SE1 | Tasa de impuesto: valor negativo | Malicioso | Rechazar (mín: 0) |
| SE2 | Tasa de impuesto: mayor a 100% | Malicioso | Rechazar (máx: 100) |
| SE3 | Tasa de impuesto: `"12%"` (con símbolo %) | Descuidado | Parsear o rechazar |
| SE4 | Símbolo de moneda: `<script>alert(1)</script>` | Malicioso: XSS almacenado | Sanitizar al renderizar |
| SE5 | Símbolo de moneda: 100 caracteres con emojis | Malicioso | Limitar longitud |
| SE6 | Nombre del negocio: override RTL | Malicioso | No romper layout |
| SE7 | Email: formato inválido | Descuidado | Validar |
| SE8 | Teléfono: letras | Descuidado | Sanitizar/validar |
| SE9 | Clicks rápidos en guardar | Enojado | Debounce |
| SE10 | Cambiar tasa de impuesto → ventas existentes se recalculan? | Regla de negocio | NO debe recalcular histórico |

---

### 11. IMPORT / EXPORT (Alto Riesgo - Integridad de Datos)

| # | Escenario | Ángulo Adversario | Falla Esperada |
|---|-----------|-------------------|----------------|
| IM1 | Importar CSV de 100MB | Malicioso: DoS | Límite de tamaño, parseo streaming |
| IM2 | Importar CSV malformado (comillas sin cerrar) | Malicioso: crash del parser | Error grácil |
| IM3 | Importar CSV de 50,000 filas | Performance | Batch, progreso, no bloquear UI |
| IM4 | Importar CSV: códigos duplicados en el archivo | Calidad de datos | Saltar o fusionar |
| IM5 | Importar CSV: XSS en campo nombre `<img src=x onerror=alert(1)>` | Malicioso: XSS almacenado | Sanitizar al importar |
| IM6 | Importar CSV: SQL injection en campos | Malicioso | Tratar como literal |
| IM7 | Importar CSV: caracteres de control `\x00\x1F` | Malicioso | Eliminar caracteres de control |
| IM8 | Importar CSV: encoding diferente (UTF-16, Latin1) | Mundo real | Detectar/manejar encoding |
| IM9 | Importar JSON malformado | Malicioso: error de parseo | Capturar y mostrar error de fila |
| IM10 | Importar JSON: referencia circular | Malicioso: stack overflow | Detectar circular |
| IM11 | Importar JSON: prototype pollution `__proto__` | Crítico: prototype pollution | Sanitizar keys |
| IM12 | Importar JSON: `constructor.prototype.polluted = true` | Prototype pollution | Sanitizar keys |
| IM13 | Import: entidad incorrecta (archivo productos → clientes) | Descuidado: selección errónea | Auto-detectar o validar |
| IM14 | Cancelar importación a medio proceso | Enojado: interrumpir | Rollback limpio |
| IM15 | Import: fallo de red (simulado) | Offline | Reanudar o limpiar estado |
| IM16 | Exportar 50,000 filas CSV | Performance | Stream, no en memoria |
| IM17 | Exportar: caracteres especiales (comas, comillas, saltos de línea) | Integridad de datos | Escaping CSV correcto |
| IM18 | Exportar: formula injection `=2+5` | Seguridad: CSV injection | Prefijar con `'` |
| IM19 | Import export completo: referencias circulares entre entidades | Integridad de datos | Manejar dependencias |
| IM20 | Import: documentId duplicado entre entidades | Regla de negocio | Único por entidad |
| IM21 | Import: integridad referencial (venta referencia cliente eliminado) | Integridad de datos | Validar FK |

---

### 12. USUARIOS Y RBAC

| # | Escenario | Ángulo Adversario | Falla Esperada |
|---|-----------|-------------------|----------------|
| U1 | Crear usuario: username duplicado | Regla de negocio | Constraint único |
| U2 | Crear usuario: password menor a 8 caracteres | Política de seguridad | Exigir minlength |
| U3 | Crear usuario: password igual al username | Password débil | Advertir o rechazar |
| U4 | Crear usuario: rol = ID inválido | Malicioso: manipular select | Validar enum |
| U5 | Auto-editar: bajar propio rol de admin | Escalada de privilegios | Bloquear o advertir |
| U6 | Auto-eliminarse | Edge case | Bloquear |
| U7 | Crear usuario con XSS en username | Malicioso: XSS almacenado | Sanitizar al renderizar |
| U8 | Crear/eliminar usuarios rápidamente | Enojado: stress | Sin datos huérfanos |
| U9 | Verificar permiso: URL directa a módulo de admin | Curioso: bypass UI | Check del lado del Service (no View) |
| U10 | Sesión: modificar roleId en localStorage | Malicioso: escalada client-side | Service re-valida |
| U11 | Dos pestañas: cerrar sesión en una, continuar en otra | Multi-pestaña | Sincronizar o redirigir |
| U12 | Sesión expirada: intentar acción | Seguridad | Redirigir a login |

---

### 13. NAVEGACIÓN Y ROUTING

| # | Escenario | Ángulo Adversario | Falla Esperada |
|---|-----------|-------------------|----------------|
| N1 | URL directa a `/products` sin login | Curioso: bypass | Redirigir a login |
| N2 | URL directa a `/users` sin permiso admin | Curioso: bypass RBAC | Redirigir o 403 |
| N3 | Botón Back del navegador después de enviar formulario | Descuidado: doble envío | No debe re-enviar |
| N4 | Botón Back después de cerrar sesión | Descuidado: página cacheada | No debe mostrar datos |
| N5 | Botón Forward después de Back | Navegación | Debe funcionar |
| N6 | Refresh en cualquier módulo | Descuidado: pérdida de estado | Restaurar desde IndexedDB |
| N7 | Abrir módulo en nueva pestaña (Ctrl+Click) | Multi-pestaña | Debe funcionar independientemente |
| N8 | 50 pestañas abiertas, navegar rápidamente | Stress: memoria | Sin fugas |
| N9 | Ruta inválida `/modulo-invalido` | Curioso: 404 | Mostrar error amigable |
| N10 | Cambio de hash durante modal abierto | Race condition | Cerrar modal limpiamente |

---

### 14. MODALES Y OVERLAYS

| # | Escenario | Ángulo Adversario | Falla Esperada |
|---|-----------|-------------------|----------------|
| M1 | Abrir modal, presionar ESC | Teclado: descartar | Debe cerrar |
| M2 | Abrir modal, click en overlay | Mouse: descartar | Debe cerrar (si es cerrable) |
| M3 | Abrir modal, click en overlay (no cerrable) | Malicioso: forzar cierre | NO debe cerrar |
| M4 | Spam abrir/cerrar modal 50 veces | Enojado: stress | Sin fuga de memoria |
| M5 | Abrir modal, redimensionar ventana | Móvil: orientación | Debe reposicionar |
| M6 | Abrir modal, rotar dispositivo | Móvil | Debe adaptarse |
| M7 | Abrir 2 modales simultáneamente | Race condition | Apilar o prevenir |
| M8 | Focus trap del modal: Tab cicla correctamente | Accesibilidad | Foco se queda en el modal |
| M9 | Modal: el foco regresa al trigger al cerrar | Accesibilidad | Restaurar foco |
| M10 | ConfirmDialog: presionar Enter = confirmar? | Teclado | Debe requerir acción explícita |
| M11 | ConfirmDialog: spam botón confirmar | Enojado: doble acción | Deshabilitar al primer click |

---

### 15. FORMULARIOS Y VALIDACIÓN

| # | Escenario | Ángulo Adversario | Falla Esperada |
|---|-----------|-------------------|----------------|
| F1 | Campo requerido: solo espacios `"   "` | Descuidado: whitespace | Hacer trim y rechazar |
| F2 | Campo requerido: zero-width space `​` | Malicioso: carácter invisible | Detectar |
| F3 | Campo numérico: `Infinity` | Malicioso: JS special | Rechazar |
| F4 | Campo numérico: `NaN` | Malicioso | Rechazar |
| F5 | Campo numérico: `1e10` (notación científica) | Edge case | Parsear o rechazar |
| F6 | Campo numérico: pegar "abc" | Descuidado: tipo incorrecto | Rechazar |
| F7 | Campo email: `test@` | Descuidado: incompleto | Rechazar |
| F8 | Campo email: `test@test@test.com` | Malicioso | Rechazar |
| F9 | Select: manipular valor via DevTools | Curioso: bypassear opciones | Validar del lado del servicio |
| F10 | Textarea: pegar 100KB | Malicioso: DoS | Límite de longitud |
| F11 | Textarea: saltos de línea, tabs, RTL | Mundo real | Preservar o sanitizar |
| F12 | Envío de formulario: doble-click | Enojado: doble POST | Deshabilitar al enviar |
| F13 | Formulario: Enter en textarea = enviar? | UX: envío accidental | No debe enviar |
| F14 | Autocompletado llena campo incorrecto | Comportamiento del browser | Atributos autocomplete correctos |
| F15 | Validación: mensaje de error con XSS inyectado | Malicioso: inyección en msg error | Escapar mensajes de error |

---

### 16. TABLAS Y DATA GRIDS

| # | Escenario | Ángulo Adversario | Falla Esperada |
|---|-----------|-------------------|----------------|
| T1 | Ordenar: click en header 20 veces rápido | Enojado: spam | Sin flicker, estable |
| T2 | Ordenar: columna con valores null | Edge case | Nulls al final |
| T3 | Ordenar: columna con tipos mixtos (str/num) | Calidad de datos | Orden consistente |
| T4 | Paginación: tamaño de página 1000 | Performance | Virtualizar o limitar |
| T5 | Paginación: saltar a página 999 | Edge case | Manejar graciosamente |
| T6 | Búsqueda: escribir 50 caracteres/segundo | Enojado: stress | Debounce funciona |
| T7 | Búsqueda: caracteres especiales regex `.*+?^${}()|[]\` | Malicioso: ReDoS | Búsqueda literal |
| T8 | Click en fila: doble-click | Enojado: doble acción | Una sola acción |
| T9 | Tabla vacía: rendimiento al renderizar | Edge case | Estado vacío rápido |
| T10 | 10,000 filas: scroll, ordenar, filtrar | Performance | Scroll virtual |

---

### 17. OFFLINE / SERVICE WORKER / INDEXEDDB

| # | Escenario | Ángulo Adversario | Falla Esperada |
|---|-----------|-------------------|----------------|
| O1 | Ir offline → crear venta → volver online | Offline-first | Sincronizar al reconectar |
| O2 | Ir offline → editar producto → volver online | Offline-first | Sincronizar |
| O3 | Ir offline → eliminar cliente → volver online | Offline-first | Sincronizar con resolución conflictos |
| O4 | Service Worker: caché corrupto | Recuperación | Auto-reparar o pedir reinicio |
| O5 | IndexedDB: cuota excedida (llenar almacenamiento) | Stress | Degradación grácil |
| O6 | IndexedDB: base de datos corrupta | Recuperación | Botón "Restablecer DB" funciona |
| O7 | Múltiples pestañas: una limpia la DB, otra tiene datos obsoletos | Multi-pestaña | Sincronizar via BroadcastChannel |
| O8 | Modo Private/Incognito | Restricción del navegador | Manejar graciosamente |
| O9 | Safari: IndexedDB bloqueado | Restricción del navegador | Fallback o error |
| O10 | Red lenta: SW sirve datos obsoletos, luego actualiza | Stale-while-revalidate | Mostrar datos frescos eventualmente |

---

### 18. SEGURIDAD: XSS / INJECTION / PROTOTYPE POLLUTION

| # | Escenario | Ángulo Adversario | Falla Esperada |
|---|-----------|-------------------|----------------|
| X1 | XSS almacenado: nombre producto `<img src=x onerror=alert(1)>` | XSS persistente | Escapado al renderizar |
| X2 | XSS almacenado: dirección cliente `"><script>steal()</script>` | XSS persistente | Escapado al renderizar |
| X3 | XSS reflejado: query de búsqueda `<script>alert(1)</script>` | XSS reflejado | No reflejado sin sanitizar |
| X4 | DOM XSS: hash de URL `#<img src=x onerror=alert(1)>` | DOM-based | No usado en innerHTML |
| X5 | CSV Formula Injection: `=2+5` o `=HYPERLINK("...")` | CSV injection | Prefijar con `'` |
| X6 | Import JSON: `__proto__.polluted = true` | Prototype pollution | Sanitizar keys |
| X7 | Import JSON: `constructor.prototype.polluted = true` | Prototype pollution | Sanitizar keys |
| X8 | HTML en exportación visto en Excel | CSV injection | Prefijar formulas |
| X9 | localStorage: inyectar datos maliciosos | Manipulación storage cliente | Validar al leer |
| X10 | sessionStorage: manipular token | Session hijacking | Validar del lado del servicio |

---

### 19. PERFORMANCE Y MEMORIA

| # | Escenario | Ángulo Adversario | Falla Esperada |
|---|-----------|-------------------|----------------|
| P1 | Cambio rápido de módulos 100 veces | Stress: fugas memoria | Heap sin crecimiento |
| P2 | Abrir/cerrar modales 500 veces | Stress: fugas DOM | Sin nodos desprendidos |
| P3 | Crear/eliminar 1000 productos | Stress: IndexedDB | Tiempo razonable |
| P4 | Importar CSV de 10,000 filas | Stress: UI bloqueante | Web Worker o chunked |
| P5 | Ordenar tabla 100 veces en 5000 filas | Stress: CPU | Menos de 100ms por ordenamiento |
| P6 | Dashboard: cambios rápidos de rango de fechas | Stress: llamadas API | Debounce/cancelar anterior |
| P7 | Memoria: navegar 100 módulos | Stress: fuga | GC recolecta |
| P8 | Larga duración: dejar app abierta 1 hora | Inactividad: timers | Sin timers descontrolados |

---

### 20. ACCESIBILIDAD (a11y)

| # | Escenario | Ángulo Adversario | Falla Esperada |
|---|-----------|-------------------|----------------|
| A1 | Navegación Tab: app completa | Solo teclado | Orden lógico, sin trampas |
| A2 | Lector de pantalla: NVDA/JAWS | a11y | Labels ARIA, roles |
| A3 | Indicadores de foco visibles | Visual | Anillos de foco claros |
| A4 | Contraste de color: modo oscuro | Visual | WCAG AA |
| A5 | Zoom al 200%: layout se mantiene | Baja visión | Sin scroll horizontal |
| A6 | Reduced motion: animaciones apagadas | Vestibular | Respeta prefers-reduced-motion |
| A7 | Regiones ARIA live: toasts | Lector pantalla | Anuncia |
| A8 | Labels de formularios: todos los inputs etiquetados | a11y | Sin inputs huérfanos |
| A9 | Modal: focus trap | Teclado | Se queda en el modal |
| A10 | Tabla: headers asociados | Lector pantalla | scope="col" |

---

### 21. MÓVIL / RESPONSIVE

| # | Escenario | Ángulo Adversario | Falla Esperada |
|---|-----------|-------------------|----------------|
| M1 | Viewport 320px: todos los módulos usables | Móvil | Scroll horizontal solo en tablas |
| M2 | Rotación Landscape ↔ Portrait | Móvil | Layout se adapta |
| M3 | Teclado virtual se abre: modal se redimensiona | Móvil | Input visible |
| M4 | Touch: swipe para scroll en tabla | Táctil | Funciona |
| M5 | Touch: objetivos táctiles ≥ 44px | Táctil | Accesible |
| M6 | iOS Safari: bug de 100vh | Quirk del browser | Maneja correctamente |
| M7 | Android Chrome: pull-to-refresh | Browser | No rompe la app |
| M8 | Zoom 200%: texto legible | Baja visión | Reflujo |

---

### 22. EDGE CASES Y ESTADOS IMPOSIBLES

| # | Escenario | Ángulo Adversario | Falla Esperada |
|---|-----------|-------------------|----------------|
| E1 | Año bisiesto: ventas/reportes del 29 de Feb | Edge case de fecha | Maneja correctamente |
| E2 | Transición horario de verano: venta a las 2:30am (reloj retrocede) | Zona horaria | Timestamps consistentes |
| E3 | Año 2038: manejo de fechas | Tiempo 32-bit | Usa JS Date (64-bit) |
| E4 | Concurrente: dos ventas del mismo producto, último item | Race condition | Check de stock atómico |
| E5 | Venta creada → producto eliminado → ver venta | Integridad referencial | Muestra nombre desde venta |
| E6 | Cliente fusionado (DB manual) → ventas lo referencian | Integridad de datos | Maneja graciosamente |
| E7 | Tasa de impuesto cambiada → ventas viejas muestran nueva tasa? | Regla de negocio | Ventas viejas mantienen tasa original |
| E8 | Moneda cambiada → reportes viejos | Regla de negocio | Muestra moneda original |
| E9 | Usuario eliminado → "creado por" muestra "Usuario Eliminado" | Integridad de datos | Soft delete o placeholder |
| E10 | Upgrade de versión: migración de schema v7→v8 | Migración | Auto-migrate, sin pérdida de datos |

---

## Estrategia de Ejecución

### Fase 1: Regresión Automatizada (Existente)
- Ejecutar `npm test` (45 suites, 410+ tests)
- Ejecutar `npm run test:e2e` (38 escenarios E2E)
- **Meta:** Baseline debe pasar 100%

### Fase 2: Exploratorio Adversarial (Manual + Semi-Automatizado)
- Ejecutar escenarios de las tablas anteriores
- Priorizar: **Ventas/Compras (dinero)**, **Import/Export (integridad datos)**, **Auth (seguridad)**
- Usar Playwright para flujos adversariales scripteables

### Fase 3: Stress & Chaos
- Usuarios concurrentes (Playwright multi-context)
- Limitación de red (DevTools / Playwright)
- Datasets grandes (seed 10k+ registros)
- Perfilado de memoria (Chrome DevTools)

### Fase 4: Seguridad Enfocada
- Payloads XSS en cada input
- Prototype pollution via import
- CSV formula injection
- Intentos de bypass RBAC

### Fase 5: Accesibilidad y Móvil
- Escaneo automatizado con axe-core
- Navegación manual por teclado
- Testing en viewport móvil

---

## Template para Reporte de Bugs

```markdown
## Título
[Módulo] Descripción corta — ej: "Ventas: Doble-click 'Guardar Venta' crea venta duplicada"

## Severidad
Critical / High / Medium / Low / Enhancement

## Área
Ventas / Productos / Auth / Import / etc.

## Precondiciones
1. Logueado como admin
2. Producto "Laptop" existe con stock=1
3. Cliente "Juan" existe

## Pasos
1. Ir a Ventas
2. Click "+ Nueva Venta"
3. Seleccionar cliente, agregar producto qty=1
4. **Doble-click rápido "Guardar Venta"**
5. Observar toasts y lista de ventas

## Resultado Esperado
Una sola venta creada, botón deshabilitado después del primer click

## Resultado Real
Dos ventas creadas con los mismos items, stock decrementado dos veces

## Evidencia
- Screenshot: ventas duplicadas en la lista
- Consola: sin errores
- Red: dos transacciones IndexedDB equivalentes a POST
- IndexedDB: dos registros de venta, stock = -1

## Causa Posible
Frontend: falta deshabilitar botón submit al hacer click
Backend: Service carece de clave de idempotencia / race condition en check de stock
Race condition: transacciones concurrentes leen el mismo valor de stock

## Reproducibilidad
100% con doble-click, 0% con click simple
```

---

## Herramientas y Ayudantes

| Herramienta | Propósito |
|-------------|-----------|
| Playwright | Automatización E2E, multi-pestaña, control de red |
| Chrome DevTools | Memoria, Rendimiento, Red, Aplicación (IndexedDB) |
| axe-core | Escaneo automatizado de accesibilidad |
| Scripts personalizados | Seed de datasets grandes, testers de prototype pollution |
| OWASP ZAP | Escaneo de seguridad (si hay servidor HTTP) |

---

## Criterios de Aceptación para QA

- [ ] Todos los tests de la Fase 1 pasan (baseline)
- [ ] Todos los escenarios adversarios Critical/High ejecutados
- [ ] Cero bugs Critical abiertos
- [ ] Cero bugs High abiertos sin plan de mitigación
- [ ] Escenarios de seguridad: XSS, Prototype Pollution, CSV Injection verificados como corregidos
- [ ] Performance: sin fugas de memoria en corrida de 1 hora
- [ ] Accesibilidad: axe-core 0 violaciones (AA)
- [ ] Móvil: viewport 320px funcional
- [ ] Offline: crear/editar/eliminar funciona offline, sincroniza online

---

## Áreas de Riesgo que Requieren Atención Extra

| Área | Por Qué |
|------|---------|
| **Atomicidad de stock en Ventas/Compras** | Race conditions = pérdida de dinero |
| **Import/Export** | Corrupción de datos, XSS, prototype pollution |
| **Autenticación/Sesión** | Solo client-side = riesgo de escalada |
| **Asientos contables** | Integridad financiera, trail de auditoría |
| **Sincronización offline** | Resolución de conflictos, pérdida de datos |
| **RBAC enforcement** | Todos los checks están en la capa Service, no en View |

---

*Plan creado bajo metodología A-QA-Breaker: Asumir roto, probar lo contrario.*