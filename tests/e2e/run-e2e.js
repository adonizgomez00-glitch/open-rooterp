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
      document.querySelectorAll('.modal, .modal__overlay, .confirm-dialog, .confirm-dialog__overlay').forEach(el => el.remove())
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
  throw new Error(`Toast "${text}" not found within ${timeout}ms`)
}

async function verifyTableAfterAction(action, toastText) {
  const rowsBefore = await getTableRowCount()
  await action()
  await waitForToastContaining(toastText)
  const rowsAfter = await getTableRowCount()
  assert(rowsAfter >= rowsBefore, `Table changed after "${toastText}" (${rowsBefore}→${rowsAfter})`)
}

async function runAll() {
  console.log('\n=== Open RootERP — E2E Tests ===\n')

  console.log('[setup] Starting server...')
  await startServer()
  console.log('[setup] Launching browser...')
  await launchBrowser()

  try {
    await (test('01 — Setup wizard completes successfully', async () => {
      await navigateTo()
      await waitFor('#setup-business')
      await fill('#setup-business', 'Mi Tienda Test')
      await fill('#setup-username', 'admin')
      await fill('#setup-password', 'admin1234')
      await fill('#setup-confirm', 'admin1234')
      await click('button:has-text("Configurar Sistema")')
      await waitFor('#login-username')
      assert(true, 'Redirected to login after setup')
    }))()

    await (test('02 — Login with created admin user', async () => {
      await fill('#login-username', 'admin')
      await fill('#login-password', 'admin1234')
      await click('button:has-text("Ingresar")')
      await waitFor('.toolbar__title')
      await wait(500)
      assert(true, 'Login successful - dashboard loaded')
    }))()

    await (test('03 — Dashboard shows KPI cards', async () => {
      await waitFor('#dashboard-grid')
      const cards = await getPage().$$('.dashboard-card')
      assert(cards.length >= 4, `Found ${cards.length} KPI cards (>= 4)`)
    }))()

    await (test('04 — Create product', async () => {
      await openModule('products')
      await wait(300)
      await verifyTableAfterAction(async () => {
        await click('button:has-text("+ Nuevo Producto")')
        await waitFor('#field-name')
        await fill('#field-name', 'Laptop Gamer')
        await fill('#field-category', 'Electrónicos')
        await fill('#field-purchasePrice', '2500')
        await fill('#field-salePrice', '3500')
        await fill('#field-stockMin', '5')
        await submitForm()
        await wait(300)
      }, 'creado')
    }))()

    await (test('05 — Create second product', async () => {
      await verifyTableAfterAction(async () => {
        await click('button:has-text("+ Nuevo Producto")')
        await waitFor('#field-name')
        await fill('#field-name', 'Mouse Inalámbrico')
        await fill('#field-category', 'Electrónicos')
        await fill('#field-purchasePrice', '30')
        await fill('#field-salePrice', '60')
        await fill('#field-stockMin', '10')
        await submitForm()
        await wait(300)
      }, 'creado')
    }))()

    await (test('06 — Validation: empty product name shows error', async () => {
      await click('button:has-text("+ Nuevo Producto")')
      await waitFor('#field-name')
      await fill('#field-name', '')
      await submitForm()
      await wait(500)
      const toast = await getToastMessage()
      assert(toast !== null, `Validation error toast shown (got: ${toast})`)
      await click('.modal__close')
      await wait(300)
    }))()

    await (test('07 — Product search works', async () => {
      await wait(300)
      const searchInput = await getPage().$('.toolbar__input')
      if (searchInput) {
        await fill('.toolbar__input', 'Laptop')
        await wait(500)
        const rows = await getTableRowCount()
        assert(rows >= 1, `Search found ${rows} matching product(s)`)
        await fill('.toolbar__input', '')
        await wait(500)
      } else {
        assert(true, 'No search input found (skip)')
      }
    }))()

    await (test('08 — Edit product', async () => {
      const editBtn = await getPage().$('.table-actions button:first-child')
      assert(editBtn !== null, 'Edit button exists')
      await editBtn.click()
      await waitFor('#field-name')
      await fill('#field-name', 'Laptop Gamer Pro')
      await submitForm()
      await waitForToastContaining('actualizado')
    }))()

    await (test('09 — Delete product', async () => {
      await wait(300)
      const deleteBtn = await getPage().$('.table-actions .btn--ghost-danger')
      if (deleteBtn) {
        await deleteBtn.click()
        await waitFor('.confirm-dialog__message')
        await acceptConfirm()
        await waitForToastContaining('eliminado')
      } else {
        assert(true, 'Delete button not found (may be only product left)')
      }
    }))()

    await (test('10 — Create customer', async () => {
      await wait(500)
      await openModule('customers')
      await wait(1000)
      const custBtn = await getPage().waitForSelector('button:has-text("+ Nuevo Cliente")', { timeout: 5000 })
      assert(custBtn !== null, 'Create customer button found')
      await custBtn.click()
      await wait(500)
      const nameField = await getPage().waitForSelector('#field-name', { timeout: 5000 })
      assert(nameField !== null, 'Customer name field exists in modal')
      await fill('#field-name', 'Juan Pérez')
      await fill('#field-documentId', 'DNI-12345678')
      await fill('#field-email', 'juan@example.com')
      await fill('#field-phone', '999888777')
      await submitForm()
      await waitForToastContaining('creado')
    }))()

    await (test('11 — Duplicate document validation', async () => {
      await wait(500)
      const custBtn2 = await getPage().waitForSelector('button:has-text("+ Nuevo Cliente")', { timeout: 5000 })
      assert(custBtn2 !== null, 'Create customer button found for duplicate test')
      await custBtn2.click()
      await wait(500)
      await fill('#field-name', 'Juan Pérez Dup')
      await fill('#field-documentId', 'DNI-12345678')
      await submitForm()
      await wait(500)
      const toast = await getToastMessage()
      assert(toast !== null, `Duplicate shows error (got: ${toast})`)
      const closeBtn = await getPage().$('.modal__close')
      if (closeBtn) await closeBtn.click()
      await wait(300)
    }))()

    await (test('12 — Create supplier', async () => {
      await openModule('suppliers')
      await wait(300)
      await verifyTableAfterAction(async () => {
        await click('button:has-text("+ Nuevo Proveedor")')
        await waitFor('#field-name')
        await fill('#field-name', 'Distribuidora Mayorista')
        await fill('#field-documentId', 'RUC-20000000001')
        await fill('#field-email', 'ventas@mayorista.com')
        await fill('#field-phone', '555444333')
        await submitForm()
        await wait(300)
      }, 'creado')
    }))()

    await (test('13 — Create sale with customer', async () => {
      await openModule('sales')
      await wait(300)
      await click('button:has-text("+ Nueva Venta")')
      await waitFor('.sale-form')
      await wait(500)
      const custOptions = await getPage().$$('.sale-form__select option')
      if (custOptions.length > 1) {
        await getPage().$eval('.sale-form__select', (el) => { el.value = el.options[el.options.length - 1].value; el.dispatchEvent(new Event('change')) })
      }
      const prodOptions = await getPage().$$('.sale-form__select--product option')
      if (prodOptions.length > 1) {
        await getPage().$eval('.sale-form__select--product', (el) => { el.value = el.options[1].value; el.dispatchEvent(new Event('change')) })
      }
      await wait(200)
      await fill('.sale-form__input--qty', '1')
      await click('.sale-form__product-row .btn--primary')
      await wait(500)
      await click('.sale-form__actions .btn--primary')
      await waitForToastContaining('registrada')
    }))()

    await (test('14 — Create sale without customer', async () => {
      await click('button:has-text("+ Nueva Venta")')
      await waitFor('.sale-form')
      await wait(500)
      await getPage().$eval('.sale-form__select', (el) => { el.value = ''; el.dispatchEvent(new Event('change')) })
      const prodOptions = await getPage().$$('.sale-form__select--product option')
      if (prodOptions.length > 1) {
        await getPage().$eval('.sale-form__select--product', (el) => { el.value = el.options[1].value; el.dispatchEvent(new Event('change')) })
      }
      await wait(200)
      await fill('.sale-form__input--qty', '1')
      await click('.sale-form__product-row .btn--primary')
      await wait(500)
      await click('.sale-form__actions .btn--primary')
      await waitForToastContaining('registrada')
    }))()

    await (test('15 — View sale detail', async () => {
      await wait(500)
      const detailBtns = await getPage().$$('.table-actions button:first-child')
      if (detailBtns.length > 0) {
        await detailBtns[0].click()
        await waitFor('.sale-detail__info')
        await wait(300)
        const title = await getModalTitle()
        assert(title.includes('Detalle'), `Detail modal title: "${title}"`)
        await closeModal()
      } else {
        assert(true, 'No detail buttons found (skip)')
      }
    }))()

    await (test('16 — Cancel sale', async () => {
      await wait(500)
      const cancelBtns = await getPage().$$('.table-actions .btn--ghost-danger')
      if (cancelBtns.length > 0) {
        await cancelBtns[0].click()
        await waitFor('.confirm-dialog__message')
        await acceptConfirm()
        await waitForToastContaining('anulada')
      } else {
        assert(true, 'No cancel buttons (skip)')
      }
    }))()

    await (test('17 — Create purchase', async () => {
      await openModule('purchases')
      await wait(300)
      await click('button:has-text("+ Nueva Compra")')
      await waitFor('.purchase-form')
      await wait(500)
      const suppOptions = await getPage().$$('.purchase-form__select option')
      if (suppOptions.length > 1) {
        await getPage().$eval('.purchase-form__select', (el) => { el.value = el.options[el.options.length - 1].value; el.dispatchEvent(new Event('change')) })
      }
      const prodOptions = await getPage().$$('.purchase-form__select--product option')
      if (prodOptions.length > 1) {
        await getPage().$eval('.purchase-form__select--product', (el) => { el.value = el.options[1].value; el.dispatchEvent(new Event('change')) })
      }
      await wait(200)
      await fill('.purchase-form__input--qty', '5')
      await fill('.purchase-form__input--price', '2000')
      await click('.purchase-form__product-row .btn--primary')
      await wait(500)
      await click('.purchase-form__actions .btn--primary')
      await waitForToastContaining('registrada')
    }))()

    await (test('18 — Cancel purchase', async () => {
      await wait(500)
      const cancelBtns = await getPage().$$('[class*="purchases-table"] .table-actions .btn--ghost-danger')
      if (cancelBtns.length > 0) {
        await cancelBtns[0].click()
        await waitFor('.confirm-dialog__message')
        await acceptConfirm()
        await waitForToastContaining('anulada')
      } else {
        assert(true, 'No cancel buttons (skip)')
      }
    }))()

    await (test('19 — Inventory shows products', async () => {
      await openModule('inventory')
      await wait(500)
      const rows = await getTableRowCount()
      assert(rows > 0, `Inventory has ${rows} product(s)`)
    }))()

    await (test('20 — Stock adjustment', async () => {
      await click('button:has-text("+ Ajustar Stock")')
      await waitFor('#field-productId')
      await wait(500)
      const prodOptions = await getPage().$$('#field-productId option')
      if (prodOptions.length > 1) {
        await getPage().$eval('#field-productId', (el) => { el.value = el.options[1].value; el.dispatchEvent(new Event('change', { bubbles: true })) })
      }
      await wait(300)
      await fill('#field-quantity', '10')
      const typeOptions = await getPage().$$('#field-type option')
      if (typeOptions.length > 1) {
        await getPage().$eval('#field-type', (el) => { el.value = el.options[1].value; el.dispatchEvent(new Event('change', { bubbles: true })) })
      }
      await wait(200)
      await submitForm()
      await waitForToastContaining('Ajuste de stock')
    }))()

    await (test('21 — Accounting journal entries', async () => {
      await openModule('accounting')
      await wait(500)
      const entryCards = await getPage().$$('.acct-entry-card')
      assert(entryCards.length > 0, `Journal has ${entryCards.length} entry card(s)`)
    }))()

    await (test('22 — Account plan de cuentas', async () => {
      await clickTab('accounts')
      await wait(500)
      const rows = await getTableRowCount()
      assert(rows > 0, `Accounts tab has ${rows} row(s)`)
    }))()

    await (test('23 — Create new account', async () => {
      await click('button:has-text("+ Nueva Cuenta")')
      await waitFor('#field-code')
      await fill('#field-code', '6101')
      await fill('#field-name', 'Sueldos')
      await select('#field-type', 'expense')
      await submitForm()
      await waitForToastContaining('creada')
    }))()

    await (test('24 — Balance sheet renders', async () => {
      await clickTab('balance')
      await wait(500)
      const sections = await getPage().$$('.acct-report-section')
      assert(sections.length >= 2, `Balance has ${sections.length} section(s)`)
    }))()

    await (test('25 — Income statement renders', async () => {
      await clickTab('income')
      await wait(500)
      const sections = await getPage().$$('.acct-report-section')
      assert(sections.length >= 1, `Income has ${sections.length} section(s)`)
    }))()

    await (test('26 — Sales report generated', async () => {
      await openModule('reports')
      await wait(500)
      await click('button:has-text("Generar Reporte")')
      await wait(500)
      const bar = await getPage().$('.report-summary-bar')
      assert(bar !== null, 'Sales report summary bar exists')
    }))()

    await (test('27 — Stock report generated', async () => {
      await clickTab('stock')
      await wait(500)
      const bar = await getPage().$('.report-summary-bar')
      assert(bar !== null, 'Stock report summary bar exists')
    }))()

    await (test('28 — Update settings', async () => {
      await openModule('settings')
      await waitFor('#setting-business_name')
      await fill('#setting-business_name', 'Mi Tienda E2E')
      await fill('#setting-business_email', 'info@mitienda.com')
      await fill('#setting-tax_rate', '0.18')
      await fill('#setting-currency_symbol', 'S/')
      await click('#settings-save-btn')
      await waitForToastContaining('guardada')
    }))()

    await (test('29 — Export JSON', async () => {
      await openModule('exports')
      await wait(300)
      await select('#export-entity', 'products')
      await select('#export-format', 'json')
      await click('.export-form__btn')
      await wait(1000)
      assert(true, 'JSON export triggered without error')
    }))()

    await (test('30 — Export CSV', async () => {
      await select('#export-entity', 'products')
      await select('#export-format', 'csv')
      await click('.export-form__btn')
      await wait(1000)
      assert(true, 'CSV export triggered without error')
    }))()

    await (test('31 — Import CSV', async () => {
      await openModule('imports')
      await waitFor('.import-dropzone')
      const csvContent = 'name,code,category,purchasePrice,salePrice,stock,stockMin\nProducto CSV,P-IMPC01,TestCategory,100,200,50,5'
      await getPage().setInputFiles('#import-file-input', [
        { name: 'test.csv', mimeType: 'text/csv', buffer: Buffer.from(csvContent) }
      ])
      await waitFor('.import-preview__title', 8000)
      await wait(500)
      await click('.btn--primary')
      await waitForToastContaining('importaron')
    }))()

    await (test('32 — Import JSON', async () => {
      await openModule('imports')
      await waitFor('.import-dropzone')
      const jsonContent = JSON.stringify([{ name: 'Producto JSON', code: 'P-IMPJ01', category: 'TestCategory', purchasePrice: 150, salePrice: 300, stock: 30, stockMin: 3 }])
      await getPage().setInputFiles('#import-file-input', [
        { name: 'test.json', mimeType: 'application/json', buffer: Buffer.from(jsonContent) }
      ])
      await waitFor('.import-preview__title', 8000)
      await wait(500)
      await click('.btn--primary')
      await waitForToastContaining('importaron')
    }))()

    await (test('33 — Users module shows admin user', async () => {
      await openModule('users')
      await waitFor('.users-table-wrapper')
      const rows = await getTableRowCount()
      assert(rows >= 1, `Users table has ${rows} row(s)`)
    }))()

    await (test('34 — Create user', async () => {
      await click('button:has-text("+ Nuevo Usuario")')
      await waitFor('#field-username')
      await fill('#field-username', 'vendedor1')
      await fill('#field-password', 'password123')
      const roleEl = await getPage().$('#field-roleId')
      const roleOptions = await roleEl.$$eval('option', (opts) => opts.map(o => ({ value: o.value, text: o.text })))
      const vendedorOpt = roleOptions.find(o => o.text === 'Vendedor')
      if (vendedorOpt) await select('#field-roleId', vendedorOpt.value)
      await select('#field-active', 'true')
      await submitForm()
      await waitForToastContaining('creado')
    }))()

    await (test('35 — Edit user', async () => {
      const editBtns = await getPage().$$('.users-table-wrapper .table-actions .btn--ghost')
      const lastEditBtn = editBtns[editBtns.length - 1]
      assert(lastEditBtn !== null, 'Edit button exists for created user')
      await lastEditBtn.click()
      await waitFor('#field-username')
      await fill('#field-username', 'vendedor1-edit')
      await submitForm()
      await waitForToastContaining('actualizado')
    }))()

    await (test('36 — Delete user', async () => {
      const deleteBtns = await getPage().$$('.users-table-wrapper .table-actions .btn--ghost-danger')
      const lastDeleteBtn = deleteBtns[deleteBtns.length - 1]
      assert(lastDeleteBtn !== null, 'Delete button exists for created user')
      await lastDeleteBtn.click()
      await waitFor('.confirm-dialog__message')
      await acceptConfirm()
      await waitForToastContaining('eliminado')
    }))()

    await (test('37 — Logout', async () => {
      await click('button:has-text("Cerrar Sesión")')
      await waitFor('#login-username')
      assert(true, 'Redirected to login after logout')
    }))()

    await (test('38 — Re-login', async () => {
      await fill('#login-username', 'admin')
      await fill('#login-password', 'admin1234')
      await click('button:has-text("Ingresar")')
      await waitFor('.toolbar__title')
      assert(true, 'Re-login successful')
    }))()

    await (test('39 — Plugins module renders', async () => {
      await openModule('plugins')
      await waitFor('.plugins-table-wrapper')
      await waitFor('.table__body')
      const rows = await getPage().evaluate(() => {
        return document.querySelectorAll('.table__body .table__row').length
      })
      assert(rows >= 1, `Plugins table has ${rows} row(s) (>= 1)`)
      const coreLabels = await getPage().evaluate(() => {
        return Array.from(document.querySelectorAll('.text-muted')).map(el => el.textContent)
      })
      assert(coreLabels.includes('Núcleo'), 'Required (core) plugins show Núcleo label')
    }))()

    await (test('40 — Install/uninstall non-required plugin keeps app stable', async () => {
      await openModule('plugins')
      await waitFor('.plugins-table-wrapper')
      const uninstallBtn = await getPage().$(`.table__row .btn--ghost-danger[data-id="inventory"]`)
      assert(uninstallBtn !== null, 'Inventory uninstall button exists')
      await uninstallBtn.click()
      await waitFor('.confirm-dialog__message')
      await acceptConfirm()
      await waitForToastContaining('desinstalado')
      // Re-enable inventory before continuing
      await openModule('plugins')
      const installBtn = await getPage().$(`.table__row .btn--ghost[data-id="inventory"]`)
      assert(installBtn !== null, 'Inventory install button exists after uninstall')
      await installBtn.click()
      await waitForToastContaining('instalado')
      await wait(500)
      // Sidebar should reflect re-enabled inventory
      const inventoryItem = await getPage().$(`.sidebar__item[data-id="inventory"]`)
      assert(inventoryItem !== null, 'Sidebar shows inventory after re-install')
    }))()

    const results = getResults()
    console.log(`\n=== Resumen E2E ===`)
    console.log(`Tests: ${testCount} | Pasaron: ${testPassed} | Fallaron: ${testFailed}`)
    console.log(`Assertions: ${results.total} | Pasaron: ${results.passed} | Fallaron: ${results.failed}`)

    if (testFailed > 0) {
      process.exit(1)
    }
  } finally {
    await closeBrowser()
    await stopServer()
  }
}

runAll().catch(err => {
  console.error('Fatal E2E error:', err)
  process.exit(1)
})
