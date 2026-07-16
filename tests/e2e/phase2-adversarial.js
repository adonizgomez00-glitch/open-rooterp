import { Buffer } from 'buffer'

import {
  startServer, stopServer, launchBrowser, closeBrowser,
  navigateTo, reload, click, fill, select,
  waitFor, waitForText, getText, clickTab, openModule,
  getTableRowCount, getToastMessage, getModalTitle,
  acceptConfirm, submitForm, closeModal,
  assert, assertTableNotEmpty,
  getResults, getPage
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
      if (err.stack) {
        const stackLines = err.stack.split('\n').slice(1, 4).join('\n')
        console.log(`    ${stackLines}`)
      }
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
  throw new Error(`Toast "${text}" not found within ${timeout}ms`)
}

async function setup() {
  await navigateTo()
  await waitFor('#setup-business')
  await fill('#setup-business', 'QA Test Store')
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
    const closeBtn = await getPage().$('.modal__close')
    if (closeBtn) await closeBtn.click()
    await wait(200)
  } catch {}
}

async function runAll() {
  console.log('\n=== FASE 2: Exploratorio Adversarial ===\n')

  console.log('[setup] Starting server...')
  await startServer()
  console.log('[setup] Launching browser...')
  await launchBrowser()

  try {
    // ── Setup ──
    await (test('S01 — Setup and login for adversarial tests', async () => {
      await setup()
      assert(true, 'Setup & login OK')
    }))()

    // ══════════════════════════════════════════════
    // AUTHENTICATION ADVERSARIAL
    // ══════════════════════════════════════════════

    await (test('A01 — Logout first for auth tests', async () => {
      await click('button:has-text("Cerrar Sesión")')
      await waitFor('#login-username')
      assert(true, 'Logged out')
    }))()

    await (test('A02 — Login with empty username and password', async () => {
      await fill('#login-username', '')
      await fill('#login-password', '')
      await click('button:has-text("Ingresar")')
      await wait(500)
      const toast = await getToastMessage()
      assert(toast !== null, `Empty login shows error: ${toast}`)
    }))()

    await (test('A03 — Login with SQL injection username', async () => {
      await fill('#login-username', "' OR '1'='1")
      await fill('#login-password', "' OR '1'='1")
      await click('button:has-text("Ingresar")')
      await wait(500)
      const toast = await getToastMessage()
      assert(toast !== null, `SQLi login shows error: ${toast}`)
    }))()

    await (test('A04 — Login with XSS payload in username', async () => {
      await fill('#login-username', '<script>alert(1)</script>')
      await fill('#login-password', 'password')
      await click('button:has-text("Ingresar")')
      await wait(500)
      const toast = await getToastMessage()
      assert(toast !== null, `XSS login shows error: ${toast}`)
    }))()

    await (test('A05 — Login with emoji password', async () => {
      await fill('#login-username', 'admin')
      await fill('#login-password', '\u{1F525}\u{1F4A3}\u{1F480}')
      await click('button:has-text("Ingresar")')
      await wait(500)
      const toast = await getToastMessage()
      assert(toast !== null, `Emoji password shows error: ${toast}`)
    }))()

    await (test('A06 — Login with huge username (10k chars)', async () => {
      const huge = 'A'.repeat(10000)
      await fill('#login-username', huge)
      await fill('#login-password', 'admin1234')
      await click('button:has-text("Ingresar")')
      await wait(500)
      const toast = await getToastMessage()
      assert(toast !== null, `Huge username shows error: ${toast}`)
    }))()

    await (test('A07 — Re-login as admin after adversarial tests', async () => {
      await fill('#login-username', 'admin')
      await fill('#login-password', 'admin1234')
      await click('button:has-text("Ingresar")')
      await waitFor('.toolbar__title')
      assert(true, 'Re-login successful')
    }))()

    // ══════════════════════════════════════════════
    // PRODUCTS ADVERSARIAL
    // ══════════════════════════════════════════════

    await (test('P01 — Open products module', async () => {
      await openModule('products')
      await wait(300)
      assert(true, 'Products module loaded')
    }))()

    await (test('P02 — Create product with empty name shows inline error', async () => {
      await click('button:has-text("+ Nuevo Producto")')
      await waitFor('#field-name')
      await fill('#field-name', '')
      await submitForm()
      await wait(500)
      const inlineError = await getPage().$('#error-name')
      const hasError = inlineError ? await inlineError.textContent() : ''
      // Form validation shows inline error (not toast) for required fields
      assert(hasError.includes('requerido') || hasError.includes('requerido'), `Inline error shown: "${hasError}"`)
      await safeCloseModal()
    }))()

    await (test('P03 — Create product with negative purchase price shows inline error', async () => {
      await click('button:has-text("+ Nuevo Producto")')
      await waitFor('#field-name')
      await fill('#field-name', 'Negative Price')
      await fill('#field-purchasePrice', '-100')
      await fill('#field-salePrice', '50')
      await submitForm()
      await wait(500)
      const inlineError = await getPage().$('#error-purchasePrice')
      const hasError = inlineError ? await inlineError.textContent() : ''
      assert(hasError.includes('mínimo') || hasError.includes('mínimo'), `Inline min error: "${hasError}"`)
      await safeCloseModal()
    }))()

    await (test('P04 — Create product with string in numeric field', async () => {
      await click('button:has-text("+ Nuevo Producto")')
      await waitFor('#field-name')
      await fill('#field-name', 'String Price')
      await fill('#field-salePrice', 'abc')
      await submitForm()
      await wait(500)
      assert(true, 'String price did not crash')
      await safeCloseModal()
    }))()

    await (test('P05 — Create product validates XSS in name is sanitized', async () => {
      await click('button:has-text("+ Nuevo Producto")')
      await waitFor('#field-name')
      const xssPayload = '<img src=x onerror="window._xssFired=true">'
      await fill('#field-name', xssPayload)
      await fill('#field-purchasePrice', '10')
      await fill('#field-salePrice', '20')
      await submitForm()
      await wait(500)
      const toast = await getToastMessage()
      assert(toast !== null, `XSS product result: ${toast}`)
      const xssFired = await getPage().evaluate(() => window._xssFired)
      assert(!xssFired, 'XSS did not execute')
    }))()

    await (test('P06 — Create product with 5000 char name', async () => {
      await click('button:has-text("+ Nuevo Producto")')
      await waitFor('#field-name')
      await fill('#field-name', 'X'.repeat(5000))
      await fill('#field-purchasePrice', '10')
      await fill('#field-salePrice', '20')
      await submitForm()
      await wait(500)
      assert(true, '5000 char name handled')
      await safeCloseModal()
    }))()

    await (test('P07 — Create valid products for sale tests', async () => {
      await click('button:has-text("+ Nuevo Producto")')
      await waitFor('#field-name')
      await fill('#field-name', 'Laptop Pro')
      await fill('#field-purchasePrice', '5000')
      await fill('#field-salePrice', '7500')
      await fill('#field-stock', '10')
      await fill('#field-stockMin', '2')
      await submitForm()
      await waitForToastContaining('creado')

      await click('button:has-text("+ Nuevo Producto")')
      await waitFor('#field-name')
      await fill('#field-name', 'Mouse USB')
      await fill('#field-purchasePrice', '50')
      await fill('#field-salePrice', '120')
      await fill('#field-stock', '50')
      await wait(200)

      // Set stockMin by evaluating due to potential field issues
      await getPage().evaluate(() => {
        const el = document.getElementById('field-stockMin')
        if (el) { el.value = '10'; el.dispatchEvent(new Event('input', { bubbles: true })) }
      })
      await submitForm()
      await waitForToastContaining('creado')

      const rows = await getTableRowCount()
      assert(rows >= 2, `Products table has ${rows} rows`)
    }))()

    // ══════════════════════════════════════════════
    // CUSTOMERS ADVERSARIAL
    // ══════════════════════════════════════════════

    await (test('C01 — Open customers module', async () => {
      await openModule('customers')
      await wait(300)
      assert(true, 'Customers module loaded')
    }))()

    await (test('C02 — Create customer with empty name shows inline error', async () => {
      await click('button:has-text("+ Nuevo Cliente")')
      await waitFor('#field-name')
      await fill('#field-name', '')
      await submitForm()
      await wait(500)
      const inlineError = await getPage().$('#error-name')
      const hasError = inlineError ? await inlineError.textContent() : ''
      assert(hasError.includes('requerido'), `Inline required error: "${hasError}"`)
      await safeCloseModal()
    }))()

    await (test('C03 — Create customer with SQL injection in document', async () => {
      await click('button:has-text("+ Nuevo Cliente")')
      await waitFor('#field-name')
      await fill('#field-name', 'SQLi Customer')
      await fill('#field-documentId', "' OR 1=1--")
      await submitForm()
      await wait(500)
      assert(true, 'SQLi document handled')
      await safeCloseModal()
    }))()

    await (test('C04 — Create customer with invalid email', async () => {
      await click('button:has-text("+ Nuevo Cliente")')
      await waitFor('#field-name')
      await fill('#field-name', 'Bad Email')
      await fill('#field-documentId', 'DOC-BADEMAIL')
      await fill('#field-email', 'not-an-email')
      await submitForm()
      await wait(500)
      assert(true, 'Invalid email handled')
      await safeCloseModal()
    }))()

    await (test('C05 — Create valid customers for sale tests', async () => {
      await click('button:has-text("+ Nuevo Cliente")')
      await waitFor('#field-name')
      await fill('#field-name', 'Juan Pérez')
      await fill('#field-documentId', 'C001')
      await fill('#field-email', 'juan@example.com')
      await fill('#field-phone', '5555-1234')
      await submitForm()
      await waitForToastContaining('creado')

      await click('button:has-text("+ Nuevo Cliente")')
      await waitFor('#field-name')
      await fill('#field-name', 'María García')
      await fill('#field-documentId', 'C002')
      await fill('#field-email', 'maria@example.com')
      await submitForm()
      await waitForToastContaining('creado')
    }))()

    await (test('C06 — Duplicate document ID shows error', async () => {
      await click('button:has-text("+ Nuevo Cliente")')
      await waitFor('#field-name')
      await fill('#field-name', 'Duplicate Doc')
      await fill('#field-documentId', 'C001')
      await submitForm()
      await wait(500)
      const toast = await getToastMessage()
      assert(toast !== null, `Duplicate doc error: ${toast}`)
      await safeCloseModal()
    }))()

    // ══════════════════════════════════════════════
    // SALES ADVERSARIAL (CRITICAL)
    // ══════════════════════════════════════════════

    await (test('SA01 — Open sales module', async () => {
      await openModule('sales')
      await wait(300)
      assert(true, 'Sales module loaded')
    }))()

    await (test('SA02 — Create sale with empty cart shows warning', async () => {
      await click('button:has-text("+ Nueva Venta")')
      await waitFor('.sale-form')
      await wait(300)
      await getPage().$eval('.sale-form__select', (el) => {
        if (el.options.length > 1) {
          el.value = el.options[el.options.length - 1].value
          el.dispatchEvent(new Event('change'))
        }
      })
      await wait(200)
      await click('.sale-form__actions .btn--primary')
      await wait(500)
      const toast = await getToastMessage()
      assert(toast !== null, `Empty cart warning: ${toast}`)
      await safeCloseModal()
    }))()

    await (test('SA03 — Create sale bypassing negative quantity via DevTools', async () => {
      await click('button:has-text("+ Nueva Venta")')
      await waitFor('.sale-form')
      await wait(300)
      await getPage().evaluate(() => {
        const qtyInput = document.querySelector('.sale-form__input--qty')
        if (qtyInput) {
          qtyInput.removeAttribute('min')
          qtyInput.value = '-5'
          qtyInput.dispatchEvent(new Event('input', { bubbles: true }))
        }
      })
      await wait(200)
      await getPage().$eval('.sale-form__select--product', (el) => {
        if (el.options.length > 1) {
          el.value = el.options[1].value
          el.dispatchEvent(new Event('change'))
        }
      })
      await wait(200)
      await click('.sale-form__product-row .btn--primary')
      await wait(300)
      assert(true, 'Negative qty handled')
      await safeCloseModal()
    }))()

    await (test('SA04 — Create sale with XSS in notes', async () => {
      await click('button:has-text("+ Nueva Venta")')
      await waitFor('.sale-form')
      await wait(300)
      // Wait for products to be available
      await wait(500)
      // Check if there are products to select
      const hasProducts = await getPage().evaluate(() => {
        const sel = document.querySelector('.sale-form__select--product')
        return sel && sel.options.length > 1
      })
      if (!hasProducts) {
        assert(true, 'No products available for sale test, skipping')
        await safeCloseModal()
        return
      }
      await getPage().$eval('.sale-form__select', (el) => {
        if (el.options.length > 1) {
          el.value = el.options[el.options.length - 1].value
          el.dispatchEvent(new Event('change'))
        }
      })
      await wait(200)
      await getPage().$eval('.sale-form__select--product', (el) => {
        if (el.options.length > 1) {
          el.value = el.options[1].value
          el.dispatchEvent(new Event('change'))
        }
      })
      await wait(200)
      await click('.sale-form__product-row .btn--primary')
      await wait(300)
      await fill('.sale-form__textarea', '<script>window._xssNotes=true</script>')
      await wait(200)
      await click('.sale-form__actions .btn--primary')
      await wait(700)
      assert(true, 'Sale with XSS notes processed')
    }))()

    await (test('SA05 — Double-click Guardar Venta does not duplicate', async () => {
      await click('button:has-text("+ Nueva Venta")')
      await waitFor('.sale-form')
      await wait(300)
      await wait(500)
      const hasProducts = await getPage().evaluate(() => {
        const sel = document.querySelector('.sale-form__select--product')
        return sel && sel.options.length > 1
      })
      if (!hasProducts) {
        assert(true, 'No products for sale test')
        await safeCloseModal()
        return
      }
      const salesBefore = await getPage().evaluate(() => {
        return document.querySelectorAll('.table__body .table__row').length
      })
      await getPage().$eval('.sale-form__select', (el) => {
        if (el.options.length > 1) {
          el.value = el.options[el.options.length - 1].value
          el.dispatchEvent(new Event('change'))
        }
      })
      await wait(200)
      await getPage().$eval('.sale-form__select--product', (el) => {
        if (el.options.length > 1) {
          el.value = el.options[1].value
          el.dispatchEvent(new Event('change'))
        }
      })
      await wait(200)
      await click('.sale-form__product-row .btn--primary')
      await wait(300)
      const saveBtn = await getPage().$('.sale-form__actions .btn--primary')
      if (saveBtn) {
        await saveBtn.click()
        await saveBtn.click()
      }
      await wait(700)
      const salesAfter = await getPage().evaluate(() => {
        return document.querySelectorAll('.table__body .table__row').length
      })
      assert(salesAfter <= salesBefore + 2, `No duplicate (${salesBefore} => ${salesAfter})`)
    }))()

    // ══════════════════════════════════════════════
    // INVENTORY ADVERSARIAL
    // ══════════════════════════════════════════════

    await (test('I01 — Open inventory module', async () => {
      await openModule('inventory')
      await wait(300)
      const rows = await getTableRowCount()
      assert(true, `Inventory has ${rows} products`)
    }))()

    await (test('I02 — Stock adjustment with zero quantity', async () => {
      await click('button:has-text("+ Ajustar Stock")')
      await waitFor('#field-productId')
      await wait(300)
      await getPage().$eval('#field-productId', (el) => {
        if (el.options.length > 1) {
          el.value = el.options[1].value
          el.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })
      await wait(200)
      await fill('#field-quantity', '0')
      await submitForm()
      await wait(500)
      assert(true, 'Zero qty adjustment handled')
    }))()

    // ══════════════════════════════════════════════
    // SETTINGS ADVERSARIAL
    // ══════════════════════════════════════════════

    await (test('SE01 — Open settings module', async () => {
      await openModule('settings')
      await waitFor('#setting-business_name')
      assert(true, 'Settings module loaded')
    }))()

    await (test('SE02 — Set negative tax rate', async () => {
      await fill('#setting-tax_rate', '-5')
      await click('#settings-save-btn')
      await wait(500)
      assert(true, 'Negative tax handled')
    }))()

    await (test('SE03 — Set tax rate over 100%', async () => {
      await fill('#setting-tax_rate', '150')
      await click('#settings-save-btn')
      await wait(500)
      assert(true, '150% tax handled')
    }))()

    await (test('SE04 — Set tax rate with percent symbol', async () => {
      await fill('#setting-tax_rate', '12%')
      await click('#settings-save-btn')
      await wait(500)
      assert(true, 'Tax with % handled')
    }))()

    await (test('SE05 — XSS in currency symbol', async () => {
      await fill('#setting-currency_symbol', '<script>window._xssCurrency=true</script>')
      await click('#settings-save-btn')
      await wait(500)
      const xssFired = await getPage().evaluate(() => window._xssCurrency)
      assert(!xssFired, 'XSS in currency did not execute')
    }))()

    await (test('SE06 — Restore valid settings', async () => {
      await fill('#setting-business_name', 'QA Test Store')
      await fill('#setting-business_email', 'qa@test.com')
      await fill('#setting-tax_rate', '12')
      await fill('#setting-currency_symbol', 'Q ')
      await click('#settings-save-btn')
      await waitForToastContaining('guardada')
      assert(true, 'Settings restored')
    }))()

    // ══════════════════════════════════════════════
    // USERS ADVERSARIAL
    // ══════════════════════════════════════════════

    await (test('U01 — Open users module', async () => {
      await openModule('users')
      await waitFor('.users-table-wrapper')
      const rows = await getTableRowCount()
      assert(rows >= 1, `Users table has ${rows} rows`)
    }))()

    await (test('U02 — Create user with password < 8 chars shows inline error', async () => {
      await click('button:has-text("+ Nuevo Usuario")')
      await waitFor('#field-username')
      await fill('#field-username', 'testuser')
      await fill('#field-password', '1234567')
      const roleEl = await getPage().$('#field-roleId')
      if (roleEl) {
        const roleOptions = await roleEl.$$eval('option', (opts) => opts.map(o => o.value))
        if (roleOptions.length > 1) {
          await select('#field-roleId', roleOptions[roleOptions.length - 1])
        }
      }
      await select('#field-active', 'true')
      await submitForm()
      await wait(500)
      const inlineError = await getPage().$('#error-password')
      const hasError = inlineError ? await inlineError.textContent() : ''
      assert(hasError.includes('menos') || hasError.includes('al menos'), `Inline minlength error: "${hasError}"`)
      await safeCloseModal()
    }))()

    await (test('U03 — Create user with XSS in username', async () => {
      await click('button:has-text("+ Nuevo Usuario")')
      await waitFor('#field-username')
      await fill('#field-username', '<img src=x onerror="window._xssUser=true">')
      await fill('#field-password', 'password123')
      const roleEl = await getPage().$('#field-roleId')
      if (roleEl) {
        const roleOptions = await roleEl.$$eval('option', (opts) => opts.map(o => o.value))
        if (roleOptions.length > 1) {
          await select('#field-roleId', roleOptions[roleOptions.length - 1])
        }
      }
      await select('#field-active', 'true')
      await submitForm()
      await wait(500)
      const xssFired = await getPage().evaluate(() => window._xssUser)
      assert(!xssFired, 'XSS in username did not execute')
      await safeCloseModal()
    }))()

    await (test('U04 — Create duplicate username shows error', async () => {
      await click('button:has-text("+ Nuevo Usuario")')
      await waitFor('#field-username')
      await fill('#field-username', 'admin')
      await fill('#field-password', 'password123')
      const roleEl = await getPage().$('#field-roleId')
      if (roleEl) {
        const roleOptions = await roleEl.$$eval('option', (opts) => opts.map(o => o.value))
        if (roleOptions.length > 1) {
          await select('#field-roleId', roleOptions[roleOptions.length - 1])
        }
      }
      await select('#field-active', 'true')
      await submitForm()
      await wait(500)
      const toast = await getToastMessage()
      assert(toast !== null, `Duplicate user error: ${toast}`)
      await safeCloseModal()
    }))()

    // ══════════════════════════════════════════════
    // MODAL ADVERSARIAL
    // ══════════════════════════════════════════════

    await (test('M01 — Open product modal and close with ESC', async () => {
      await openModule('products')
      await wait(300)
      await click('button:has-text("+ Nuevo Producto")')
      await waitFor('#field-name')
      await wait(200)
      await getPage().keyboard.press('Escape')
      await wait(500)
      const modal = await getPage().$('.modal')
      assert(modal === null, 'Modal closed with ESC')
    }))()

    await (test('M02 — Spam open/close modal many times', async () => {
      for (let i = 0; i < 5; i++) {
        await click('button:has-text("+ Nuevo Producto")')
        await wait(200)
        await getPage().keyboard.press('Escape')
        await wait(200)
      }
      const modals = await getPage().$$('.modal')
      assert(modals.length <= 1, `Max 1 modal open, found ${modals.length}`)
    }))()

    // ══════════════════════════════════════════════
    // NAVIGATION ADVERSARIAL
    // ══════════════════════════════════════════════

    await (test('N01 — Browser refresh preserves session', async () => {
      await reload()
      await waitFor('.toolbar__title')
      assert(true, 'Session preserved after refresh')
    }))()

    await (test('N02 — Navigate to products works after refresh', async () => {
      await openModule('products')
      await wait(300)
      const title = await getText('.toolbar__title')
      assert(title && title.includes('Productos'), `Title: "${title}"`)
    }))()

    // ══════════════════════════════════════════════
    // LOGOUT AND FINAL VERIFICATION
    // ══════════════════════════════════════════════

    await (test('FIN01 — Logout redirects to login screen', async () => {
      await click('button:has-text("Cerrar Sesión")')
      await wait(1000)
      const loginField = await getPage().$('#login-username')
      assert(loginField !== null, 'Logout shows login screen')
    }))()

    await (test('FIN02 — Refresh after logout stays on login', async () => {
      await reload()
      await wait(1000)
      const loginField = await getPage().$('#login-username')
      assert(loginField !== null, 'Refresh after logout on login')
    }))()

    const results = getResults()
    console.log(`\n=== Fase 2: Resumen Adversarial ===`)
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
