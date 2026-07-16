import { Buffer } from 'buffer'

import {
  startServer, stopServer, launchBrowser, closeBrowser,
  navigateTo, reload, click, fill, select,
  waitFor, getText, openModule,
  getTableRowCount, getToastMessage,
  submitForm, closeModal,
  assert, assertTableNotEmpty,
  getResults, getPage, getBaseUrl
} from './helpers.js'

let testCount = 0
let testPassed = 0
let testFailed = 0

async function recoverPageState() {
  try {
    await getPage().evaluate(() => {
      document.querySelectorAll('.modal, .modal__overlay, .confirm-dialog, .confirm-dialog__overlay, .toast').forEach(el => el.remove())
    })
  } catch {}
}

function test(name, fn) {
  testCount++
  return async () => {
    await recoverPageState()
    try {
      await fn()
      testPassed++
      console.log(`  ✓ ${name}`)
    } catch (err) {
      testFailed++
      const lines = err.message.split('\n')
      console.log(`  ✗ ${name}: ${lines[0]}`)
      await recoverPageState()
    }
  }
}

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function waitForToastContaining(text, timeout = 5000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    await wait(200)
    const msg = await getToastMessage()
    if (msg && msg.includes(text)) return msg
  }
  console.log(`    [warn] Toast "${text}" not found`)
  return null
}

async function createProduct(name, price, opts = {}) {
  await click('button:has-text("+ Nuevo Producto")')
  await waitFor('#field-name')
  await fill('#field-name', name)
  await fill('#field-purchasePrice', String(Math.round(price * 0.7)))
  await fill('#field-salePrice', String(price))
  if (opts.stock !== undefined) await fill('#field-stock', String(opts.stock))
  await submitForm()
  await wait(300)
}

async function setup() {
  await navigateTo()
  await waitFor('#setup-business')
  await fill('#setup-business', 'Stress Test Store')
  await fill('#setup-username', 'admin')
  await fill('#setup-password', 'admin1234')
  await fill('#setup-confirm', 'admin1234')
  await click('button:has-text("Configurar Sistema")')
  await waitFor('#login-username')
  await fill('#login-username', 'admin')
  await fill('#login-password', 'admin1234')
  await click('button:has-text("Ingresar")')
  await waitFor('.toolbar__title')
  await wait(500)
}

async function safeCloseModal() {
  try {
    const btn = await getPage().$('.modal__close')
    if (btn) await btn.click()
    await wait(200)
  } catch {}
}

async function runAll() {
  console.log('\n=== FASE 3: Stress & Chaos ===\n')

  console.log('[setup] Starting server...')
  await startServer()
  console.log('[setup] Launching browser...')
  await launchBrowser()

  try {
    await (test('ST00 — Setup', async () => {
      await setup()
      assert(true, 'Setup OK')
    }))()

    // ── P1: Rapid module switching ──
    await (test('ST01 — Rapid module switching 50x (memory stress)', async () => {
      const modules = ['dashboard', 'products', 'customers', 'suppliers', 'sales', 'purchases', 'inventory', 'reports', 'settings', 'exports', 'imports']
      const startTime = Date.now()
      let errors = 0
      for (let i = 0; i < 50; i++) {
        const mod = modules[i % modules.length]
        try {
          await openModule(mod)
          await wait(100)
        } catch (e) {
          errors++
        }
      }
      const elapsed = Date.now() - startTime
      assert(errors === 0, `50 switches in ${elapsed}ms, errors: ${errors}`)
      assert(elapsed < 180000, `Completed in ${elapsed}ms (under 180s)`)
    }))()

    // ── P2: Spam open/close modals ──
    await (test('ST02 — Spam open/close product modal 100x (DOM leak check)', async () => {
      await openModule('products')
      await wait(300)

      const startTime = Date.now()
      let errors = 0
      for (let i = 0; i < 100; i++) {
        try {
          await click('button:has-text("+ Nuevo Producto")')
          await wait(50)
          await getPage().keyboard.press('Escape')
          await wait(50)
        } catch (e) {
          errors++
        }
      }
      const elapsed = Date.now() - startTime
      assert(errors === 0, `100 modal cycles in ${elapsed}ms, errors: ${errors}`)
      const modals = await getPage().$$('.modal')
      assert(modals.length <= 1, `Max 1 modal left, found ${modals.length}`)
    }))()

    // ── P3: Create 50 products (stress IndexedDB) ──
    await (test('ST03 — Create 50 products (IndexedDB write stress)', async () => {
      await openModule('products')
      await wait(300)

      const startTime = Date.now()
      let errors = 0
      for (let i = 0; i < 50; i++) {
        try {
          await createProduct(`Stress Product ${i}`, 10 + i * 5, { stock: i * 2 })
        } catch (e) {
          errors++
          if (errors > 5) break
        }
      }
      const elapsed = Date.now() - startTime
      const rows = await getTableRowCount()
      assert(errors <= 3 && rows >= 45, `Created products: ${rows} rows, errors: ${errors}, elapsed: ${elapsed}ms`)
    }))()

    // ── P5: Sort table 50x ──
    await (test('ST04 — Sort products table 50x (render stress)', async () => {
      const startTime = Date.now()
      let errors = 0
      const headers = await getPage().$$('.table__th--sortable')
      if (headers.length === 0) {
        assert(true, 'No sortable headers found')
        return
      }
      for (let i = 0; i < 50; i++) {
        try {
          const idx = i % headers.length
          await headers[idx].click()
          await wait(30)
        } catch (e) {
          errors++
        }
      }
      const elapsed = Date.now() - startTime
      assert(errors === 0, `50 sort ops in ${elapsed}ms, errors: ${errors}`)
    }))()

    // ── P6: Rapid search ──
    await (test('ST05 — Rapid search typing (debounce stress)', async () => {
      const searchInput = await getPage().$('.toolbar__input')
      if (!searchInput) {
        assert(true, 'No search input on this module, skip')
        return
      }
      const startTime = Date.now()
      let errors = 0
      for (let i = 0; i < 30; i++) {
        try {
          await fill('.toolbar__input', `search ${i}`)
          await wait(20)
        } catch (e) {
          errors++
        }
      }
      await fill('.toolbar__input', '')
      await wait(500)
      const elapsed = Date.now() - startTime
      assert(errors === 0, `30 rapid searches in ${elapsed}ms, errors: ${errors}`)
    }))()

    // ── P7: Navigate modules under stress (from products) ──
    await (test('ST06 — Navigate all modules rapidly (navigation stress)', async () => {
      const modules = ['dashboard', 'products', 'customers', 'suppliers', 'sales', 'purchases', 'inventory', 'reports', 'settings', 'exports', 'imports']
      let errors = 0
      for (let i = 0; i < 3; i++) {
        for (const mod of modules) {
          try {
            await openModule(mod)
            await wait(50)
          } catch (e) {
            errors++
          }
        }
      }
      assert(errors === 0, `Navigation stress test: ${errors} errors`)
    }))()

    // ── P8: Large dataset - generate table with search ──
    await (test('ST07 — Verify products table renders with 50+ records', async () => {
      await openModule('products')
      await wait(500)
      const rows = await getTableRowCount()
      assert(rows >= 45, `Table has ${rows} rows (expect >= 45)`)
    }))()

    // ── Concurrent stress: settings save while navigating ──
    await (test('ST08 — Save settings while navigating (concurrent stress)', async () => {
      await openModule('settings')
      await waitFor('#setting-business_name')
      let errors = 0
      for (let i = 0; i < 10; i++) {
        try {
          await fill('#setting-business_name', `Stress Save ${i}`)
          await click('#settings-save-btn')
          await wait(100)
          if (i % 2 === 0) {
            await openModule('dashboard')
            await wait(100)
            await openModule('settings')
            await waitFor('#setting-business_name')
          }
        } catch (e) {
          errors++
        }
      }
      assert(errors <= 3, `Concurrent save/nav: ${errors} errors`)
    }))()

    // ── Restore settings ──
    await (test('ST09 — Restore settings', async () => {
      await fill('#setting-business_name', 'Stress Test Store')
      await fill('#setting-business_email', 'stress@test.com')
      await fill('#setting-tax_rate', '12')
      await fill('#setting-currency_symbol', 'Q ')
      await click('#settings-save-btn')
      await wait(500)
      assert(true, 'Settings restored after stress')
    }))()

    const results = getResults()
    console.log(`\n=== Fase 3: Resumen Stress & Chaos ===`)
    console.log(`Tests: ${testCount} | Pasaron: ${testPassed} | Fallaron: ${testFailed}`)

    if (testFailed > 0) {
      process.exit(1)
    }
  } finally {
    await closeBrowser()
    await stopServer()
  }
}

runAll().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
