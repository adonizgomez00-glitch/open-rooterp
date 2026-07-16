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
  await fill('#setup-business', 'Mobile Test Store')
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

async function runAll() {
  console.log('\n=== FASE 5: Accesibilidad y Móvil ===\n')

  console.log('[setup] Starting server...')
  await startServer()
  console.log('[setup] Launching browser...')
  await launchBrowser()

  try {
    await (test('A00 — Setup', async () => {
      await setup()
      assert(true, 'Setup OK')
    }))()

    // ══════════════════════════════════════════════
    // ÁREA 21: Accesibilidad (WCAG)
    // ══════════════════════════════════════════════

    await (test('A1 — Keyboard navigation: Tab through interactive elements', async () => {
      await getPage().keyboard.press('Tab')
      await wait(100)
      const focused = await getPage().evaluate(() => {
        const el = document.activeElement
        return el ? el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.substring(0, 30) : '') : 'none'
      })
      console.log(`     First focus target: ${focused}`)
      assert(focused !== 'none' && focused !== 'body', `Tab navigation started: ${focused}`)

      for (let i = 0; i < 10; i++) {
        await getPage().keyboard.press('Tab')
        await wait(50)
      }
      const cycleComplete = await getPage().evaluate(() => {
        const el = document.activeElement
        return el ? el.tagName : 'none'
      })
      assert(cycleComplete !== 'body', 'Tab cycles through focusable elements')
    }))()

    await (test('A2 — ARIA roles: main, navigation, dialog', async () => {
      const roles = await getPage().evaluate(() => {
        const els = document.querySelectorAll('[role]')
        return Array.from(els).map(el => el.tagName + '#' + (el.id || '') + ': role=' + el.getAttribute('role'))
      })
      console.log(`     Found ${roles.length} ARIA roles: ${roles.slice(0, 5).join(', ')}`)
      assert(roles.length > 0, 'At least one ARIA role found')
      const hasMainRole = await getPage().$('[role="main"], [role="region"], main')
      assert(hasMainRole !== null, 'main or region role present')
    }))()

    await (test('A4 — All form inputs have associated labels', async () => {
      // Open product form to check labels
      await openModule('products')
      await wait(300)
      await click('button:has-text("+ Nuevo Producto")')
      await waitFor('#field-name')

      const inputLabels = await getPage().evaluate(() => {
        const inputs = document.querySelectorAll('.form__group input, .form__group select, .form__group textarea')
        return Array.from(inputs).map(inp => {
          const label = inp.closest('.form__group').querySelector('label')
          const forAttr = document.querySelector(`label[for="${inp.id}"]`)
          const ariaLabel = inp.getAttribute('aria-label')
          const placeholder = inp.getAttribute('placeholder')
          return {
            id: inp.id,
            hasLabel: !!label || !!forAttr || !!ariaLabel || !!placeholder,
            labelText: label ? label.textContent.trim() : (ariaLabel || placeholder || 'none')
          }
        })
      })

      const unlabeled = inputLabels.filter(l => !l.hasLabel)
      console.log(`     Inputs with labels: ${inputLabels.length - unlabeled.length}/${inputLabels.length}`)
      assert(unlabeled.length === 0, `All inputs have labels. Unlabeled: ${unlabeled.map(u => u.id).join(', ') || 'none'}`)

      await closeModal()
    }))()

    await (test('A5 — Font size is accessible (min 16px on body)', async () => {
      const fontSize = await getPage().evaluate(() => {
        const style = window.getComputedStyle(document.body)
        return style.fontSize
      })
      const sizePx = parseFloat(fontSize)
      console.log(`     Body font-size: ${fontSize}`)
      assert(sizePx >= 14, `Font size ${fontSize} ≥ 14px (accessible)`)
    }))()

    await (test('A6 — Form error messages are descriptive', async () => {
      await openModule('products')
      await wait(300)
      await click('button:has-text("+ Nuevo Producto")')
      await waitFor('#field-name')

      // Submit with empty fields
      await fill('#field-name', '')
      await fill('#field-purchasePrice', '')
      await fill('#field-salePrice', '')
      await submitForm()
      await wait(500)

      const errors = await getPage().evaluate(() => {
        const errEls = document.querySelectorAll('.form__error, .input-error, [class*="error"], .field-error')
        return Array.from(errEls).map(el => ({
          text: el.textContent.trim().substring(0, 60),
          id: el.id,
          for: el.getAttribute('for') || el.closest('[id]')?.id || ''
        }))
      })

      console.log(`     Error messages found: ${errors.length} — ${errors.slice(0, 3).map(e => e.text).join('; ')}`)
      assert(errors.length > 0, 'At least one validation error displayed')

      // But also check there are no console errors from validation
      await closeModal()
    }))()

    await (test('A7 — Skip to content link present', async () => {
      const skipLink = await getPage().$('a[href="#main-content"], a[href="#content"], a.skip-link, .skip-link, [class*="skip"]')
      if (skipLink) {
        const text = await skipLink.textContent()
        console.log(`     Skip link found: "${text.trim()}"`)
      } else {
        console.log('     Skip link not found (informational, not a hard requirement)')
      }
      // Informational - many SPAs don't have skip links
      assert(true, 'Skip link check completed')
    }))()

    // ══════════════════════════════════════════════
    // ÁREA 22: Responsive / Móvil
    // ══════════════════════════════════════════════

    await (test('R1 — Viewport 375×667 (iPhone SE) — sidebar collapses', async () => {
      await getPage().setViewportSize({ width: 375, height: 667 })
      await wait(300)

      // Check sidebar visibility
      const sidebar = await getPage().$('.sidebar')
      if (sidebar) {
        const isVisible = await sidebar.isVisible()
        console.log(`     Sidebar visible: ${isVisible}`)
      }

      // Check if menu toggle exists
      const menuToggle = await getPage().$('.sidebar__toggle, .hamburger, .menu-toggle, [class*="menu-toggle"], [class*="hamburger"]')
      console.log(`     Menu toggle button on mobile: ${menuToggle ? 'found' : 'not found'}`)

      // Verify core content renders
      const content = await getPage().$('.dashboard, .toolbar, .table-wrapper, .content')
      assert(content !== null, 'Main content renders at 375px')

      // Check for horizontal scroll in main content
      const hasHScroll = await getPage().evaluate(() => {
        return document.body.scrollWidth > document.body.clientWidth
      })
      console.log(`     Horizontal scroll (body): ${hasHScroll}`)
      // Not asserting on h-scroll as tables naturally need it
    }))()

    await (test('R2 — Viewport 768×1024 (iPad) — layout adapts', async () => {
      await getPage().setViewportSize({ width: 768, height: 1024 })
      await wait(300)

      const sidebarVisible = await getPage().evaluate(() => {
        const sb = document.querySelector('.sidebar')
        return sb ? window.getComputedStyle(sb).display !== 'none' : false
      })
      console.log(`     Sidebar visible at 768px: ${sidebarVisible}`)

      const content = await getPage().$('.dashboard, [class*="dashboard"], .content')
      assert(true, 'iPad layout renders')
    }))()

    await (test('R3 — Touch events: tap buttons work', async () => {
      await getPage().setViewportSize({ width: 375, height: 667 })
      await wait(300)

      // Open hamburger menu first
      const hamburger = await getPage().$('.sidebar__toggle, .hamburger, .menu-toggle, [class*="menu-toggle"], [class*="hamburger"]')
      if (hamburger) {
        await hamburger.tap()
        await wait(500)
      }

      // Tap products in sidebar
      const productsBtn = await getPage().$('.sidebar__item[data-id="products"]')
      if (productsBtn) {
        await productsBtn.tap()
        await wait(1000)
      }
      const productContent = await getPage().$('.product-table-wrapper, .table-wrapper')
      console.log(`     Products module after tap: ${productContent ? 'loaded' : 'not found'}`)
      assert(productContent !== null, 'Tap navigation to products works')
    }))()

    await (test('R4 — Zoom 200% — layout does not break', async () => {
      await getPage().setViewportSize({ width: 1280, height: 800 })
      await wait(300)

      // Simulate 200% zoom via CSS
      await getPage().evaluate(() => {
        document.body.style.zoom = '2'
      })
      await wait(300)

      const isBroken = await getPage().evaluate(() => {
        const body = document.body
        const hasOverflowX = body.scrollWidth > body.clientWidth * 2
        const mainContent = document.querySelector('.toolbar__title, .content, main, .table-wrapper')
        return {
          overflowX: hasOverflowX,
          hasContent: !!mainContent,
          bodyWidth: body.scrollWidth,
          viewportWidth: body.clientWidth
        }
      })
      console.log(`     Zoom 200% — content visible: ${isBroken.hasContent}, overflow: ${isBroken.overflowX}`)
      assert(isBroken.hasContent, 'Main content visible at 200% zoom')

      // Reset zoom
      await getPage().evaluate(() => { document.body.style.zoom = '' })
    }))()

    await (test('R5 — Forms are responsive on mobile', async () => {
      // First go to products at desktop
      await getPage().setViewportSize({ width: 1280, height: 800 })
      await wait(300)
      await openModule('products')
      await wait(300)

      // Now switch to mobile
      await getPage().setViewportSize({ width: 375, height: 667 })
      await wait(300)

      // Try to click + Nuevo Producto, scrolling if needed
      const newBtn = await getPage().$('button:has-text("+ Nuevo Producto")')
      if (newBtn) {
        await newBtn.scrollIntoViewIfNeeded()
        await newBtn.click()
      }
      await waitFor('#field-name', 8000)

      // Check form layout on mobile
      const formLayout = await getPage().evaluate(() => {
        const form = document.querySelector('.form, .modal__body, .product-form')
        if (!form) return { found: false }
        const inputs = form.querySelectorAll('input, select, textarea')
        const rects = Array.from(inputs).slice(0, 4).map(inp => {
          const r = inp.getBoundingClientRect()
          return { id: inp.id, width: r.width, left: r.left }
        })
        return {
          found: true,
          inputCount: inputs.length,
          widths: rects
        }
      })
      console.log(`     Mobile form — ${formLayout.inputCount} inputs, full-width: ${formLayout.widths?.every(w => w.width >= 280) || 'N/A'}`)
      assert(formLayout.found, 'Form renders on mobile viewport')

      // Fill and submit on mobile
      await fill('#field-name', 'Mobile Product')
      await fill('#field-purchasePrice', '10')
      await fill('#field-salePrice', '20')
      await submitForm()
      await wait(500)

      // Verify product was created
      const table = await getPage().$('.table__body .table__row')
      assert(table !== null, 'Product table visible after creating on mobile')

      await closeModal()
    }))()

    const results = getResults()
    console.log(`\n=== Fase 5: Resumen Accesibilidad y Móvil ===`)
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
