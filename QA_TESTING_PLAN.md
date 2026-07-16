# QA Testing Plan — ERP Ligero Offline

**Version:** 1.0  
**Approach:** Adversarial / Exploratory Testing (A-QA-Breaker)  
**Objective:** Make the application fail. Find bugs, not confirm features.

---

## Application Overview

**Stack:** Vanilla JS ES Modules, IndexedDB (Dexie.js), Service Worker, Chart.js  
**Architecture:** MVC + Service Layer + Repository Pattern  
**Modules:** Auth, Products, Customers, Suppliers, Sales, Purchases, Inventory, Accounting, Reports, Settings, Import/Export, Users  
**Security:** XSS sanitization, input validation, RBAC, offline-first

---

## Testing Philosophy

> "Every screen is assumed to contain hidden bugs until proven otherwise."
> — A-QA-Breaker Skill

**Personas to simulate:**
1. **Careless User** — Random clicks, empty fields, copy/paste, frequent refresh
2. **Angry User** — Spam clicks, double-clicks, navigate mid-process, cancel dialogs
3. **Curious User** — DevTools, URL manipulation, localStorage/IndexedDB editing, hidden routes
4. **Malicious User** — XSS, SQLi strings, HTML injection, huge payloads, unicode, control chars
5. **Slow Connection User** — Offline, timeouts, slow loads, refresh mid-request
6. **Mobile User** — Small viewport, landscape/portrait, keyboard, zoom 200%, a11y fonts

---

## Test Areas & Adversarial Scenarios

### 1. AUTHENTICATION & SESSION MANAGEMENT

| # | Scenario | Adversarial Angle | Expected Failure Mode |
|---|----------|-------------------|----------------------|
| A1 | Login with empty username/password | Careless: submit blank | Should show validation error |
| A2 | Login with 10,000 char username | Malicious: oversized input | Should reject gracefully |
| A3 | Login with SQL injection: `' OR '1'='1` | Malicious: SQLi string | Should not error, treat as literal |
| A4 | Login with XSS: `<script>alert(1)</script>` | Malicious: XSS | Should sanitize/escape |
| A5 | Login with RTL override: `‮admin` | Malicious: unicode bidi | Should not break UI |
| A6 | Login with emoji password: `🔥💣💀` | Malicious: unicode | Should handle gracefully |
| A7 | Double-click "Ingresar" rapidly | Angry: spam submit | Should not create duplicate sessions |
| A8 | Click Back after login → refresh | Careless: browser back | Should maintain session or redirect cleanly |
| A9 | Open login in 2 tabs, login in one, refresh other | Curious: multi-tab | Should sync or handle gracefully |
| A10 | Delete session token from localStorage, refresh | Curious: tamper storage | Should redirect to login |
| A11 | Modify session token in localStorage to another user's | Malicious: privilege escalation | Should invalidate session |
| A12 | Expire token manually (set expiresAt to past) | Malicious: expired token | Should force re-login |
| A13 | Logout while sale creation in progress | Angry: interrupt process | Should cancel pending operations |
| A14 | Setup wizard: submit with all fields empty | Careless: skip required | Should show validation errors |
| A15 | Setup wizard: username with spaces only | Careless: whitespace | Should trim and reject |
| A16 | Setup wizard: password ≠ confirm | Careless: mismatch | Should show error |
| A17 | Setup wizard: password < 8 chars | Careless: weak password | Should enforce minlength |
| A18 | Setup wizard: XSS in business name | Malicious: persistent XSS | Should sanitize on display |
| A19 | Direct navigation to `/users` without login | Curious: protected route | Should redirect to login |
| A20 | Concurrent login: same user, 2 browsers | Malicious: session fixation | Should handle per policy |

---

### 2. PRODUCTS MODULE

| # | Scenario | Adversarial Angle | Expected Failure Mode |
|---|----------|-------------------|----------------------|
| P1 | Create product: empty name | Careless: required field | Validation error |
| P2 | Create product: name = 5000 chars | Malicious: huge input | Truncate or reject |
| P3 | Create product: name = `<img src=x onerror=alert(1)>` | Malicious: XSS | Sanitized on render |
| P4 | Create product: code = duplicate | Careless: unique constraint | Should reject with clear message |
| P5 | Create product: negative purchasePrice | Malicious: negative numbers | Should reject (min: 0) |
| P6 | Create product: salePrice = "abc" | Malicious: type confusion | Should reject non-numeric |
| P5 | Create product: stock = -100 | Malicious: negative stock | Should reject |
| P6 | Create product: stock = 999999999999 | Malicious: overflow | Should handle large numbers |
| P7 | Create product: category with emoji `🎮💻` | Malicious: unicode | Should store/display correctly |
| P8 | Create product: category with RTL `‮Electrónicos` | Malicious: bidi override | Should not break layout |
| P9 | Rapid click "+ Nuevo Producto" 20 times | Angry: spam modals | Should not open duplicate modals |
| P10 | Open edit modal, change URL hash, close modal | Curious: navigation mid-flow | Should clean up state |
| P11 | Edit product: change code to existing product's code | Careless: duplicate on edit | Should validate uniqueness |
| P12 | Delete product with existing sales history | Business rule: referential integrity | Should block or cascade properly |
| P13 | Search input: paste 10MB text | Malicious: DoS via search | Should debounce and limit |
| P14 | Search: SQL injection `' UNION SELECT * FROM users--` | Malicious: SQLi | Should treat as literal string |
| P15 | Sort table by clicking header rapidly | Angry: spam sort | Should not flicker or error |
| P16 | Table with 10,000 products: scroll, sort, search | Performance: huge dataset | Should virtualize or paginate |
| P17 | Product form: paste HTML in description | Malicious: HTML injection | Should strip tags |
| P18 | Product form: description with `\n\r\t` control chars | Malicious: control chars | Should sanitize |
| P19 | Product code: leading/trailing spaces | Careless: whitespace | Should trim |
| P20 | Product code: only spaces | Careless: empty-like | Should reject |

---

### 3. CUSTOMERS MODULE

| # | Scenario | Adversarial Angle | Expected Failure Mode |
|---|----------|-------------------|----------------------|
| C1 | Create customer: empty name | Careless | Validation error |
| C2 | Create customer: duplicate documentId | Careless/Business rule | Unique constraint error |
| C3 | DocumentId: SQL injection `' OR 1=1--` | Malicious | Literal string |
| C4 | DocumentId: XSS `<svg onload=alert(1)>` | Malicious | Sanitized |
| C5 | Email: invalid format `not-an-email` | Careless | Format validation |
| C6 | Email: `a@b` (minimal valid) | Edge case | Should accept |
| C7 | Email: 500 char local part | Malicious | Length limit |
| C8 | Phone: letters `abcdefghij` | Careless | Should reject or sanitize |
| C9 | Phone: `+502 1234-5678 ext. 123` | Real-world format | Should accept |
| C10 | Address: 10,000 chars with newlines | Malicious | Should handle/truncate |
| C11 | Address: RTF/Markdown injection | Malicious | Should strip |
| C12 | Rapid create 50 customers via Enter spam | Angry | Should not duplicate |
| C13 | Edit customer: change documentId to existing | Business rule | Should reject |
| C14 | Delete customer with sales history | Business rule | Should block or cascade |
| C15 | Search: paste binary data | Malicious | Should not crash |
| C16 | Table: click "Editar" and "Eliminar" simultaneously | Angry: race condition | Should handle one action |

---

### 4. SUPPLIERS MODULE

| # | Scenario | Adversarial Angle | Expected Failure Mode |
|---|----------|-------------------|----------------------|
| S1 | Duplicate documentId (NIT/RUC) | Business rule | Unique constraint |
| S2 | NIT format validation: `12345678-9` vs `123456789` | Regional format | Should accept valid formats |
| S3 | Create supplier during purchase creation | Integration | Should work |
| S4 | Supplier with special chars in name: `José & María S.A.` | Real-world | Should handle |
| S5 | Delete supplier with purchase history | Business rule | Block or cascade |

---

### 5. SALES MODULE (Critical - Money Flow)

| # | Scenario | Adversarial Angle | Expected Failure Mode |
|---|----------|-------------------|----------------------|
| SA1 | Create sale: no products added | Careless: empty cart | Should block submit |
| SA2 | Create sale: quantity = 0 | Malicious: edge case | Should reject (min: 1) |
| SA3 | Create sale: quantity = -5 | Malicious: negative | Should reject |
| SA4 | Create sale: quantity = 999999 (exceeds stock) | Business rule | Should check stock |
| SA5 | Create sale: quantity = 1.5 (decimal) | Malicious: type confusion | Should reject or floor |
| SA6 | Create sale: unitPrice = -100 | Malicious: negative price | Should reject |
| SA7 | Create sale: unitPrice = "gratis" | Malicious: string in number | Should reject |
| SA8 | Create sale: add same product twice | Careless: duplicate line | Should merge quantities |
| SA9 | Create sale: modify cart quantity to 0 | Careless: remove via qty | Should remove line |
| SA10 | Create sale: modify cart quantity > stock | Business rule | Should validate on change |
| SA11 | Create sale: customer select → change to "ocasional" | Workflow change | Should handle null customerId |
| SA12 | Create sale: notes with XSS payload | Malicious: stored XSS | Should sanitize on render |
| SA13 | Create sale: notes with 50KB text | Malicious: huge payload | Should limit length |
| SA14 | Double-click "Agregar" rapidly | Angry: race condition | Should not duplicate lines |
| SA15 | Double-click "Guardar Venta" rapidly | Angry: double submit | Should disable button on first click |
| SA16 | Navigate away during sale creation | Careless: abandon form | Should warn or auto-save draft |
| SA17 | Refresh page during sale creation | Careless: refresh | Should not create partial sale |
| SA18 | Offline: create sale, go online, sync | Offline-first | Should work |
| SA19 | Sale with customer deleted after sale created | Data integrity | Should show customer name from sale record |
| SA20 | Cancel sale: stock restoration correctness | Business critical | Stock must return exactly |
| SA21 | Cancel sale: accounting entry reversal | Integration | Should create reversal entry |
| SA22 | Cancel already cancelled sale | Idempotency | Should show error |
| SA23 | Delete sale: stock restoration | Business critical | Stock must return |
| SA24 | Delete sale: accounting entry deletion | Integration | Should delete entry |
| SA25 | View detail of deleted sale | Edge case | Should handle gracefully |
| SA26 | Sale with 100 line items | Performance | Should handle |
| SA27 | Sale: product deleted after added to cart | Data integrity | Should handle missing product |
| SA28 | Concurrent sales of same product (2 tabs) | Race condition | Stock check must be atomic |

---

### 6. PURCHASES MODULE

| # | Scenario | Adversarial Angle | Expected Failure Mode |
|---|----------|-------------------|----------------------|
| PU1 | Create purchase: empty items | Careless | Block submit |
| PU2 | Quantity = 0 or negative | Malicious | Reject |
| PU3 | Unit price negative | Malicious | Reject |
| PU4 | Supplier deleted after purchase created | Data integrity | Show supplier name from purchase record |
| PU5 | Cancel purchase: stock deduction correctness | Business critical | Stock must decrease exactly |
| PU6 | Cancel purchase: accounting reversal | Integration | Should create reversal |
| PU7 | Delete purchase: stock deduction | Business critical | Stock must decrease |
| PU8 | Rapid add/remove items | Angry | No duplicates |
| PU9 | Purchase with 500 items | Performance | Should handle |

---

### 7. INVENTORY / STOCK ADJUSTMENTS

| # | Scenario | Adversarial Angle | Expected Failure Mode |
|---|----------|-------------------|----------------------|
| I1 | Adjustment: quantity = 0 | Edge case | Should reject or allow? |
| I2 | Adjustment: negative quantity for "entry" | Malicious: logic bypass | Should validate type/qty match |
| I3 | Adjustment: huge quantity (overflow) | Malicious | Handle large numbers |
| I4 | Adjustment: product deleted after opening modal | Race condition | Should handle gracefully |
| I5 | Movement history: 10,000 rows | Performance | Pagination/virtualization |
| I6 | Movement type: XSS in notes | Malicious | Sanitize |
| I7 | Stock goes negative via adjustment exit | Business rule | Should allow with warning or block |

---

### 8. ACCOUNTING MODULE

| # | Scenario | Adversarial Angle | Expected Failure Mode |
|---|----------|-------------------|----------------------|
| AC1 | Chart of Accounts: duplicate code | Business rule | Unique constraint |
| AC2 | Chart of Accounts: circular reference (parent = child) | Malicious: infinite loop | Should detect/prevent |
| AC3 | Journal entry: unbalanced debit/credit | Business rule | Must balance to 0 |
| AC4 | Journal entry: negative amounts | Malicious | Should reject |
| AC5 | Balance Sheet: date range future dates | Edge case | Should handle |
| AC6 | Balance Sheet: start date > end date | Careless | Should swap or error |
| AC7 | Income Statement: huge date range (10 years) | Performance | Should handle |
| AC8 | Account type: invalid enum value | Malicious | Should validate enum |
| AC9 | Delete account with entries | Referential integrity | Should block |
| AC10 | Account code: leading zeros `0001` vs `1` | Data integrity | Should preserve format |

---

### 9. REPORTS MODULE

| # | Scenario | Adversarial Angle | Expected Failure Mode |
|---|----------|-------------------|----------------------|
| R1 | Sales report: start date > end date | Careless | Swap or error |
| R2 | Sales report: date range 50 years | Performance | Handle large ranges |
| R3 | Stock report: filter by category with XSS | Malicious | Sanitize |
| R4 | Report with 0 results | Empty state | Show empty message |
| R5 | Report: rapid tab switching | Angry | No duplicate requests |
| R6 | Export report during generation | Race condition | Handle cancel |

---

### 10. SETTINGS MODULE

| # | Scenario | Adversarial Angle | Expected Failure Mode |
|---|----------|-------------------|----------------------|
| SE1 | Tax rate: negative value | Malicious | Reject (min: 0) |
| SE2 | Tax rate: > 100% | Malicious | Reject (max: 100) |
| SE3 | Tax rate: "12%" (with %) | Careless | Parse or reject |
| SE4 | Currency symbol: `<script>alert(1)</script>` | Malicious: stored XSS | Sanitize on render |
| SE5 | Currency symbol: 100 char emoji | Malicious | Length limit |
| SE6 | Business name: RTL override | Malicious | No layout break |
| SE7 | Email: invalid format | Careless | Validate |
| SE8 | Phone: letters | Careless | Sanitize/validate |
| SE9 | Rapid save clicks | Angry | Debounce |
| SE10 | Change tax rate → existing sales recalc? | Business rule | Should NOT recalc historical |

---

### 11. IMPORT / EXPORT MODULE (High Risk - Data Integrity)

| # | Scenario | Adversarial Angle | Expected Failure Mode |
|---|----------|-------------------|----------------------|
| IM1 | Import CSV: 100MB file | Malicious: DoS | Size limit, streaming parse |
| IM2 | Import CSV: malformed (unclosed quotes) | Malicious: parser crash | Graceful error |
| IM3 | Import CSV: 50,000 rows | Performance | Batch, progress, not block UI |
| IM4 | Import CSV: duplicate codes in file | Data quality | Skip or merge |
| IM5 | Import CSV: XSS in name field `<img src=x onerror=alert(1)>` | Malicious: stored XSS | Sanitize on import |
| IM6 | Import CSV: SQL injection in fields | Malicious | Treat as literal |
| IM7 | Import CSV: control chars `\x00\x1F` | Malicious | Strip control chars |
| IM8 | Import CSV: different encoding (UTF-16, Latin1) | Real-world | Detect/handle encoding |
| IM9 | Import JSON: malformed JSON | Malicious: parse error | Catch and show row error |
| IM10 | Import JSON: circular reference | Malicious: stack overflow | Detect circular |
| IM11 | Import JSON: prototype pollution `__proto__` | Critical: prototype pollution | Sanitize keys |
| IM12 | Import: entity mismatch (products file → customers) | Careless: wrong selection | Auto-detect or validate |
| IM13 | Import: cancel mid-process | Angry: interrupt | Clean rollback |
| IM14 | Import: network fails (simulated) | Offline | Resume or clear state |
| IM15 | Export: 50,000 rows CSV | Performance | Stream, not memory |
| IM16 | Export: special chars in data (commas, quotes, newlines) | Data integrity | Proper CSV escaping |
| IM17 | Export: XSS in exported data (formula injection `=2+5`) | Security: CSV injection | Prefix with `'` |
| IM18 | Import full export: circular refs between entities | Data integrity | Handle dependencies |
| IM19 | Import: duplicate documentId across entities | Business rule | Unique per entity |
| IM20 | Import: referential integrity (sale references deleted customer) | Data integrity | Validate FKs |

---

### 12. USERS & RBAC MODULE

| # | Scenario | Adversarial Angle | Expected Failure Mode |
|---|----------|-------------------|----------------------|
| U1 | Create user: username duplicate | Business rule | Unique constraint |
| U2 | Create user: password < 8 chars | Security policy | Enforce minlength |
| U3 | Create user: password = username | Weak password | Warn or reject |
| U4 | Create user: role = invalid ID | Malicious: tamper select | Validate enum |
| U5 | Edit self: demote own admin role | Privilege escalation | Block or warn |
| U6 | Delete self | Edge case | Block |
| U7 | Create user with XSS in username | Malicious: stored XSS | Sanitize on render |
| U8 | Rapid create/delete users | Angry: stress | No orphan data |
| U9 | Permission check: direct URL to admin module | Curious: bypass UI | Server-side (service) check |
| U10 | Session: modify roleId in localStorage | Malicious: client-side escalation | Server re-validates |
| U11 | Two tabs: logout in one, continue in other | Multi-tab | Sync or redirect |
| U12 | Expired session: try action | Security | Redirect to login |

---

### 13. NAVIGATION & ROUTING

| # | Scenario | Adversarial Angle | Expected Failure Mode |
|---|----------|-------------------|----------------------|
| N1 | Direct URL to `/products` without login | Curious: bypass | Redirect to login |
| N2 | Direct URL to `/users` without admin permission | Curious: RBAC bypass | Redirect or 403 |
| N3 | Browser Back after form submit | Careless: double submit | Should not re-submit |
| N4 | Browser Back after logout | Careless: cached page | Should not show data |
| N5 | Browser Forward after Back | Navigation | Careless | Should work |
| N6 | Refresh on any module | Careless: state loss | Should restore from IndexedDB |
| N7 | Open module in new tab (Ctrl+Click) | Multi-tab | Should work independently |
| N8 | 50 tabs open, navigate rapidly | Stress: memory | No leaks |
| N9 | Invalid route `/invalid-module` | Curious: 404 | Show friendly error |
| N10 | Hash change during modal open | Race condition | Close modal cleanly |

---

### 14. MODALS & OVERLAYS

| # | Scenario | Adversarial Angle | Expected Failure Mode |
|---|----------|-------------------|----------------------|
| M1 | Open modal, press ESC | Keyboard: dismiss | Should close |
| M2 | Open modal, click overlay | Mouse: dismiss | Should close (if closable) |
| M3 | Open modal, click overlay (non-closable) | Malicious: force close | Should NOT close |
| M4 | Spam open/close modal 50x | Angry: stress | No memory leak |
| M5 | Open modal, resize window | Mobile: orientation | Should reposition |
| M6 | Open modal, rotate device | Mobile | Should adapt |
| M7 | Open 2 modals simultaneously | Race condition | Should stack or prevent |
| M8 | Modal focus trap: Tab cycles correctly | Accessibility | Focus stays in modal |
| M9 | Modal: focus returns to trigger on close | Accessibility | Restore focus |
| M10 | ConfirmDialog: press Enter = confirm? | Keyboard | Should require explicit |
| M11 | ConfirmDialog: spam confirm button | Angry: double action | Disable on first click |

---

### 15. FORMS & VALIDATION

| # | Scenario | Adversarial Angle | Expected Failure Mode |
|---|----------|-------------------|----------------------|
| F1 | Required field: spaces only `"   "` | Careless: whitespace | Should trim and reject |
| F2 | Required field: zero-width space `​` | Malicious: invisible char | Should detect |
| F3 | Number field: `Infinity` | Malicious: JS special | Should reject |
| F4 | Number field: `NaN` | Malicious | Should reject |
| F5 | Number field: `1e10` (scientific) | Edge case | Parse or reject |
| F6 | Number field: paste "abc" | Careless: wrong type | Should reject |
| F7 | Email field: `test@` | Careless: incomplete | Should reject |
| F8 | Email field: `test@test@test.com` | Malicious | Should reject |
| F9 | Select: tamper value via DevTools | Curious: bypass options | Should validate server-side |
| F10 | Textarea: 100KB paste | Malicious: DoS | Length limit |
| F11 | Textarea: newlines, tabs, RTL | Real-world | Preserve or sanitize |
| F12 | Form submit: double-click submit | Angry: double POST | Disable on submit |
| F13 | Form: enter in textarea = submit? | UX: accidental submit | Should not submit |
| F14 | Form: autocomplete fills wrong field | Browser behavior | Proper autocomplete attrs |
| F15 | Form validation: error message XSS | Malicious: error msg injection | Escape error messages |

---

### 16. TABLES & DATA GRIDS

| # | Scenario | Adversarial Angle | Expected Failure Mode |
|---|----------|-------------------|----------------------|
| T1 | Sort: click header 20x rapidly | Angry: spam | No flicker, stable |
| T2 | Sort: column with null values | Edge case | Nulls last |
| T3 | Sort: column with mixed types (str/num) | Data quality | Consistent ordering |
| T4 | Pagination: page size 1000 | Performance | Virtualize or limit |
| T5 | Pagination: jump to page 999 | Edge case | Handle gracefully |
| T6 | Search: type 50 chars/sec | Angry: stress | Debounce works |
| T7 | Search: special regex chars `.*+?^${}()|[]\` | Malicious: ReDoS | Literal search |
| T8 | Row click: double-click | Angry: double action | Single action |
| T9 | Empty table: render performance | Edge case | Fast empty state |
| T10 | 10,000 rows: scroll, sort, filter | Performance | Virtual scroll |

---

### 17. OFFLINE / SERVICE WORKER / INDEXEDDB

| # | Scenario | Adversarial Angle | Expected Failure Mode |
|---|----------|-------------------|----------------------|
| O1 | Go offline → create sale → go online | Offline-first | Sync on reconnect |
| O2 | Go offline → edit product → go online | Offline-first | Sync |
| O3 | Go offline → delete customer → go online | Offline-first | Sync with conflict resolution |
| O4 | Service Worker: cache corrupted | Recovery | Self-heal or prompt reset |
| O5 | IndexedDB: quota exceeded (fill storage) | Stress | Graceful degradation |
| O6 | IndexedDB: corrupt database | Recovery | "Reset DB" button works |
| O7 | Multiple tabs: one clears DB, other has stale data | Multi-tab | BroadcastChannel sync |
| O8 | Private/Incognito mode | Browser restriction | Handle gracefully |
| O9 | Safari: IndexedDB blocked | Browser restriction | Fallback or error |
| O10 | Slow network: SW serves stale, then updates | Stale-while-revalidate | Show fresh eventually |

---

### 18. SECURITY: XSS / INJECTION / PROTOTYPE POLLUTION

| # | Scenario | Adversarial Angle | Expected Failure Mode |
|---|----------|-------------------|----------------------|
| X1 | Stored XSS: product name `<img src=x onerror=alert(1)>` | Persistent XSS | Escaped on render |
| X2 | Stored XSS: customer address `"><script>steal()</script>` | Persistent XSS | Escaped on render |
| X3 | Reflected XSS: search query `<script>alert(1)</script>` | Reflected XSS | Not reflected unsanitized |
| X4 | DOM XSS: URL hash `#<img src=x onerror=alert(1)>` | DOM-based | Not used in innerHTML |
| X5 | CSV Formula Injection: `=2+5` or `=HYPERLINK("...")` | CSV injection | Prefix with `'` |
| X6 | JSON Import: `__proto__.polluted = true` | Prototype pollution | Sanitize keys |
| X7 | JSON Import: `constructor.prototype.polluted = true` | Prototype pollution | Sanitize keys |
| X8 | HTML in export viewed in Excel | CSV injection | Prefix formulas |
| X9 | localStorage: inject malicious data | Client storage tampering | Validate on read |
| X10 | sessionStorage: tamper token | Session hijacking | Validate server-side (service) |

---

### 19. PERFORMANCE & MEMORY

| # | Scenario | Adversarial Angle | Expected Failure Mode |
|---|----------|-------------------|----------------------|
| P1 | Rapid module switching 100x | Stress: memory leaks | No increasing heap |
| P2 | Open/close modals 500x | Stress: DOM leaks | No detached nodes |
| P3 | Create/delete 1000 products | Stress: IndexedDB | Reasonable time |
| P4 | Import 10,000 row CSV | Stress: blocking UI | Web Worker or chunked |
| P5 | Table sort 100x on 5000 rows | Stress: CPU | < 100ms per sort |
| P6 | Dashboard: rapid date range changes | Stress: API calls | Debounce/cancel prev |
| P7 | Memory: navigate 100 tabs | Stress: leak | GC collects |
| P8 | Long-running: leave app open 1 hour | Idle: timers | No runaway timers |

---

### 20. ACCESSIBILITY (a11y)

| # | Scenario | Adversarial Angle | Expected Failure Mode |
|---|----------|-------------------|----------------------|
| A1 | Tab navigation: full app | Keyboard only | Logical order, no traps |
| A2 | Screen reader: NVDA/JAWS | a11y | ARIA labels, roles |
| A3 | Focus indicators visible | Visual | Clear focus rings |
| A4 | Color contrast: dark mode | Visual | WCAG AA |
| A5 | Zoom 200%: layout holds | Low vision | No horizontal scroll |
| A6 | Reduced motion: animations off | Vestibular | Respects prefers-reduced-motion |
| A7 | ARIA live regions: toasts | Screen reader | Announces |
| A8 | Form labels: all inputs labeled | a11y | No orphan inputs |
| A9 | Modal: focus trap | Keyboard | Stays in modal |
| A10 | Table: headers associated | Screen reader | scope="col" |

---

### 21. MOBILE / RESPONSIVE

| # | Scenario | Adversarial Angle | Expected Failure Mode |
|---|----------|-------------------|----------------------|
| M1 | Viewport 320px: all modules usable | Mobile | Horizontal scroll only on tables |
| M2 | Landscape ↔ Portrait rotation | Mobile | Layout adapts |
| M3 | Virtual keyboard opens: modal resizes | Mobile | Input visible |
| M4 | Touch: swipe to scroll table | Touch | Works |
| M5 | Touch: tap targets ≥ 44px | Touch | Accessible |
| M6 | iOS Safari: 100vh viewport bug | Browser quirk | Handles correctly |
| M7 | Android Chrome: pull-to-refresh | Browser | Doesn't break app |
| M8 | Zoom 200%: text readable | Low vision | Reflows |

---

### 22. EDGE CASES & IMPOSSIBLE STATES

| # | Scenario | Adversarial Angle | Expected Failure Mode |
|---|----------|-------------------|----------------------|
| E1 | Leap year: Feb 29 sales/reports | Date edge case | Handles correctly |
| E2 | DST transition: sale at 2:30am (clocks back) | Timezone | Consistent timestamps |
| E3 | Year 2038: date handling | 32-bit time | Uses JS Date (64-bit) |
| E4 | Concurrent: two sales same product, last item | Race condition | Atomic stock check |
| E5 | Sale created → product deleted → view sale | Referential integrity | Shows product name from sale |
| E6 | Customer merged (manual DB) → sales reference | Data integrity | Handles gracefully |
| E7 | Tax rate changed → old sales show new rate? | Business rule | Old sales keep original rate |
| E8 | Currency changed → old reports | Business rule | Shows original currency |
| E9 | User deleted → created by user shows "Deleted User" | Data integrity | Soft delete or placeholder |
| E10 | App version upgrade: schema migration v7→v8 | Migration | Auto-migrate, no data loss |

---

## Test Execution Strategy

### Phase 1: Automated Regression (Existing)
- Run `npm test` (45 suites, 410+ tests)
- Run `npm run test:e2e` (38 E2E scenarios)
- **Goal:** Baseline must pass 100%

### Phase 2: Adversarial Exploratory (Manual + Semi-Auto)
- Execute scenarios from tables above
- Prioritize: **Sales/Purchases (money)**, **Import/Export (data integrity)**, **Auth (security)**
- Use Playwright for scriptable adversarial flows

### Phase 3: Stress & Chaos
- Concurrent users (Playwright multi-context)
- Network throttling (DevTools / Playwright)
- Large datasets (seed 10k+ records)
- Memory profiling (Chrome DevTools)

### Phase 4: Security Focused
- XSS payloads in every input
- Prototype pollution via import
- CSV formula injection
- RBAC bypass attempts

### Phase 5: Accessibility & Mobile
- axe-core automated scan
- Manual keyboard navigation
- Mobile viewport testing

---

## Bug Reporting Template

```markdown
## Title
[Module] Short description — e.g., "Sales: Double-click 'Guardar Venta' creates duplicate sale"

## Severity
Critical / High / Medium / Low / Enhancement

## Area
Sales / Products / Auth / Import / etc.

## Preconditions
1. Logged in as admin
2. Product "Laptop" exists with stock=1
3. Customer "Juan" exists

## Steps
1. Navigate to Ventas
2. Click "+ Nueva Venta"
3. Select customer, add product qty=1
4. Rapidly double-click "Guardar Venta"
5. Observe toast messages and sales list

## Expected Result
Single sale created, button disabled after first click

## Actual Result
Two sales created with same items, stock decremented twice

## Evidence
- Screenshot: duplicate sales in list
- Console: no errors
- Network: two POST-equivalent IndexedDB transactions
- IndexedDB: two sale records, stock = -1

## Possible Cause
Frontend: missing submit button disable on click
Backend: Service lacks idempotency key / race condition in stock check
Race condition: concurrent transactions read same stock value

## Reproducibility
100% on double-click, 0% on single click
```

---

## Tooling & Helpers

| Tool | Purpose |
|------|---------|
| Playwright | E2E automation, multi-tab, network control |
| Chrome DevTools | Memory, Performance, Network, Application (IndexedDB) |
| axe-core | Automated a11y scanning |
| Custom scripts | Seed large datasets, prototype pollution testers |
| OWASP ZAP | Security scanning (if HTTP server) |

---

## Definition of Done for QA

- [ ] All Phase 1 tests pass (baseline)
- [ ] All Critical/High adversarial scenarios executed
- [ ] Zero Critical bugs open
- [ ] Zero High bugs open without mitigation plan
- [ ] Security scenarios: XSS, Prototype Pollution, CSV Injection verified fixed
- [ ] Performance: no memory leaks in 1hr run
- [ ] Accessibility: axe-core 0 violations (AA)
- [ ] Mobile: 320px viewport functional
- [ ] Offline: create/edit/delete works offline, syncs online

---

## Risk Areas Requiring Extra Attention

| Area | Why |
|------|-----|
| **Sales/Purchases stock atomicity** | Race conditions = money loss |
| **Import/Export** | Data corruption, XSS, prototype pollution |
| **Authentication/Session** | Client-side only = escalation risk |
| **Accounting entries** | Financial integrity, audit trail |
| **Offline sync** | Conflict resolution, data loss |
| **RBAC enforcement** | All checks in Service layer, not View |

---

*Plan created per A-QA-Breaker methodology: Assume broken, prove otherwise.*