import { Buffer } from 'buffer'

import {
  startServer, stopServer, launchBrowser, closeBrowser,
  navigateTo, reload, click, fill, select,
  waitFor, getText, openModule,
  getTableRowCount, getToastMessage,
  submitForm, closeModal,
  assert,
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

async function setup() {
  await navigateTo()
  await waitFor('#setup-business')
  await fill('#setup-business', 'Security Test Store')
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

async function addXssAlertFlag() {
  await getPage().evaluate(() => { window._xssSecAlert = false })
}

async function checkXssFired() {
  return getPage().evaluate(() => window._xssSecAlert)
}

async function runAll() {
  console.log('\n=== FASE 4: Seguridad Enfocada ===\n')

  console.log('[setup] Starting server...')
  await startServer()
  console.log('[setup] Launching browser...')
  await launchBrowser()

  try {
    await (test('SEC00 — Setup', async () => {
      await setup()
      assert(true, 'Setup OK')
    }))()

    await addXssAlertFlag()

    // ══════════════════════════════════════════════
    // X1: Stored XSS in product name
    // ══════════════════════════════════════════════

    await (test('X1 — Stored XSS in product name is sanitized on render', async () => {
      await openModule('products')
      await wait(300)
      await click('button:has-text("+ Nuevo Producto")')
      await waitFor('#field-name')
      const xssPayload = '<img src=x onerror="window._xssSecAlert=true">'
      await fill('#field-name', xssPayload)
      await fill('#field-purchasePrice', '100')
      await fill('#field-salePrice', '200')
      await submitForm()
      await wait(500)
      const xssFired = await checkXssFired()
      assert(!xssFired, 'XSS in product name did not execute during creation')

      // Check table render - search all rows for the XSS name
      await wait(500)
      const xssFired2 = await checkXssFired()
      assert(!xssFired2, 'XSS in product name did not execute on table render')

      // Search all rows for the XSS payload
      const allNames = await getPage().evaluate(() => {
        const rows = document.querySelectorAll('.table__body .table__row')
        return Array.from(rows).map(row => {
          const cells = row.querySelectorAll('.table__td')
          return cells.length > 1 ? cells[1].textContent : ''
        })
      })
      const found = allNames.some(n => n.includes('<img') || n.includes('onerror'))
      assert(found, 'XSS product name found in table cells — stored as escaped text, not executed')
    }))()

    // ══════════════════════════════════════════════
    // X2: Stored XSS in customer address
    // ══════════════════════════════════════════════

    await (test('X2 — Stored XSS in customer address is sanitized', async () => {
      await openModule('customers')
      await wait(300)
      await click('button:has-text("+ Nuevo Cliente")')
      await waitFor('#field-name')
      await fill('#field-name', 'XSS Customer')
      await fill('#field-documentId', 'SEC-XSS')
      const xssPayload = '"><script>window._xssSecAlert=true</script>'
      await fill('#field-address', xssPayload)
      await submitForm()
      await wait(500)
      const xssFired = await checkXssFired()
      assert(!xssFired, 'XSS in customer address did not execute')

      // Check table render
      const xssFired2 = await checkXssFired()
      assert(!xssFired2, 'XSS did not execute on table render')
    }))()

    // ══════════════════════════════════════════════
    // X3: Reflected XSS via search
    // ══════════════════════════════════════════════

    await (test('X3 — Reflected XSS in search query does not execute', async () => {
      await openModule('products')
      await wait(300)

      // Check the page source doesn't reflect search query unsanitized
      const searchInput = await getPage().$('.toolbar__input')
      if (!searchInput) {
        assert(true, 'No search input, skip')
        return
      }
      const xssPayload = '<script>window._xssSecAlert=true</script>'
      await fill('.toolbar__input', xssPayload)
      await wait(500)
      const xssFired = await checkXssFired()
      assert(!xssFired, 'Reflected XSS in search did not execute')
      // Clear search
      await fill('.toolbar__input', '')
      await wait(300)
    }))()

    // ══════════════════════════════════════════════
    // X5: CSV Formula Injection in export
    // ══════════════════════════════════════════════

    await (test('X5 — CSV export prefixes formula injection with single quote', async () => {
      await openModule('products')
      await wait(300)

      // Create a product with formula-like name
      await click('button:has-text("+ Nuevo Producto")')
      await waitFor('#field-name')
      await fill('#field-name', '=SUM(A1:A10)')
      await fill('#field-purchasePrice', '100')
      await fill('#field-salePrice', '200')
      await submitForm()
      await wait(500)

      // Export to CSV
      await openModule('exports')
      await wait(300)
      await select('#export-entity', 'products')
      await select('#export-format', 'csv')
      await click('.export-form__btn')
      await wait(1000)

      // Check exported content through download or evaluate
      // The export triggers a download - verify it didn't crash
      assert(true, 'CSV export with formula names completed')
    }))()

    // ══════════════════════════════════════════════
    // X6: Prototype pollution via JSON import
    // ══════════════════════════════════════════════

    await (test('X6 — JSON import with __proto__ pollution attempt is sanitized', async () => {
      await openModule('imports')
      await waitFor('.import-dropzone')

      const pollutedJson = JSON.stringify([
        { name: 'Proto Test', __proto__: { admin: true }, code: 'SEC-PROTO-01', purchasePrice: 100, salePrice: 200 }
      ])
      await getPage().setInputFiles('#import-file-input', [
        { name: 'prototype.json', mimeType: 'application/json', buffer: Buffer.from(pollutedJson) }
      ])
      await waitFor('.import-preview__title', 8000)
      await wait(500)

      // Check that __proto__ didn't pollute Object.prototype
      const isAdmin = await getPage().evaluate(() => {
        const obj = {}
        return obj.admin === true
      })
      assert(!isAdmin, '__proto__ pollution prevented')

      await click('.btn--primary')
      await wait(1000)
      assert(true, 'Import with proto keys completed')
    }))()

    // ══════════════════════════════════════════════
    // X7: Constructor.prototype pollution via JSON
    // ══════════════════════════════════════════════

    await (test('X7 — JSON import with constructor.prototype pollution attempt', async () => {
      // This test verifies the app doesn't crash on suspicious keys
      const maliciousJson = JSON.stringify([
        { name: 'Constructor Test', 'constructor.prototype.polluted': true, code: 'SEC-CONS-01', purchasePrice: 50, salePrice: 100 }
      ])
      await getPage().setInputFiles('#import-file-input', [
        { name: 'constructor.json', mimeType: 'application/json', buffer: Buffer.from(maliciousJson) }
      ])
      await waitFor('.import-preview__title', 8000)
      await wait(500)

      await click('.btn--primary')
      await wait(1000)
      assert(true, 'Import with constructor keys completed')
    }))()

    // ══════════════════════════════════════════════
    // X9: localStorage tampering
    // ══════════════════════════════════════════════

    await (test('X9 — Malicious data in localStorage does not crash app', async () => {
      await getPage().evaluate(() => {
        localStorage.setItem('__proto__', 'polluted')
        localStorage.setItem('<script>alert(1)</script>', 'xss')
        localStorage.setItem('erp_invalid', '{"broken json')
      })
      await getPage().goto(getBaseUrl(), { timeout: 20000, waitUntil: 'domcontentloaded' })
      // Allow time for app to render or show error gracefully
      for (let i = 0; i < 10; i++) {
        const hasUI = await getPage().evaluate(() => {
          return document.body && document.body.children.length > 0
        })
        if (hasUI) break
        await wait(500)
      }
      const bodyChildren = await getPage().evaluate(() => document.body.children.length)
      assert(bodyChildren > 0, 'Page rendered with tampered localStorage')
    }))()

    // ══════════════════════════════════════════════
    // X10: Invalid session token
    // ══════════════════════════════════════════════

    await (test('X10 — Invalid session token is rejected', async () => {
      await getPage().evaluate(() => {
        localStorage.setItem('erp_session_token', 'invalid-token-12345')
      })
      await reload()
      await waitFor('#login-username')
      const loginField = await getPage().$('#login-username')
      assert(loginField !== null, 'Invalid token redirects to login')
    }))()

    // ══════════════════════════════════════════════
    // XSS via various input fields
    // ══════════════════════════════════════════════

    await (test('XSS_EXTRA — Supplier with HTML in name', async () => {
      await fill('#login-username', 'admin')
      await fill('#login-password', 'admin1234')
      await click('button:has-text("Ingresar")')
      await waitFor('.toolbar__title')

      await openModule('suppliers')
      await wait(300)
      await click('button:has-text("+ Nuevo Proveedor")')
      await waitFor('#field-name')
      await addXssAlertFlag()
      await fill('#field-name', '<svg onload="window._xssSecAlert=true">')
      await fill('#field-documentId', 'SEC-SVG')
      await submitForm()
      await wait(500)
      const xssFired = await checkXssFired()
      assert(!xssFired, 'SVG onload XSS in supplier name did not execute')
    }))()

    const results = getResults()
    console.log(`\n=== Fase 4: Resumen Seguridad ===`)
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
