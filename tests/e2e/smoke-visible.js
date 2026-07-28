import { chromium } from 'playwright'
import { spawn } from 'child_process'
import http from 'http'
import path from 'path'
import fs from 'fs'

const PORT = 3099
const BASE = `http://localhost:${PORT}`
const VIDEO_DIR = path.resolve(import.meta.dirname, '../../videos')
const DB_NAME = 'ERPLigero'

let server, browser, context, page

async function startServer() {
  return new Promise((resolve, reject) => {
    const cwd = path.resolve(import.meta.dirname, '../..')
    server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
      cwd, stdio: ['ignore', 'pipe', 'pipe']
    })
    let started = false
    const timeout = setTimeout(() => {
      if (!started) reject(new Error('Server start timeout'))
    }, 15000)
    const tryConnect = () => {
      const req = http.get(`http://127.0.0.1:${PORT}`, (res) => {
        started = true; clearTimeout(timeout); res.resume()
        setTimeout(resolve, 300)
      })
      req.on('error', () => { if (!started) setTimeout(tryConnect, 200) })
      req.setTimeout(1000, () => { req.destroy(); if (!started) setTimeout(tryConnect, 200) })
    }
    setTimeout(tryConnect, 300)
    server.on('error', (err) => { if (!started) { clearTimeout(timeout); reject(err) } })
  })
}

function stopServer() {
  if (server) { server.kill(); server = null }
}

async function sleep(ms) {
  await page.waitForTimeout(ms)
}

async function main() {
  if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const videoPath = path.join(VIDEO_DIR, `smoke-${timestamp}.webm`)

  console.log('=== Smoke Test — Open RootERP (Visible) ===\n')

  console.log('[1/9] Iniciando servidor...')
  await startServer()

  console.log('[2/9] Abriendo navegador (headed, slowMo)...')
  browser = await chromium.launch({
    headless: false,
    slowMo: 200
  })
  context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 800 } }
  })
  page = await context.newPage()

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`  [console.error] ${msg.text()}`)
  })
  page.on('pageerror', (err) => console.log(`  [page error] ${err.message}`))

  try {
    console.log('[3/9] Setup inicial — configurando negocio y admin...')
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 })
    await page.waitForSelector('#setup-business', { timeout: 10000 })

    await page.fill('#setup-business', 'Mi Tienda Smoke Test')
    await sleep(400)
    await page.fill('#setup-username', 'admin')
    await sleep(400)
    await page.fill('#setup-password', 'admin1234')
    await sleep(400)
    await page.fill('#setup-confirm', 'admin1234')
    await sleep(400)
    await page.click('button:has-text("Configurar Sistema")')
    await page.waitForSelector('#login-username', { timeout: 10000 })
    console.log('  ✓ Setup completado, redirigido al login')
    await sleep(800)

    console.log('[4/9] Login...')
    await page.fill('#login-username', 'admin')
    await sleep(400)
    await page.fill('#login-password', 'admin1234')
    await sleep(400)
    await page.click('button:has-text("Ingresar")')
    await page.waitForSelector('.toolbar__title', { timeout: 10000 })
    await sleep(1000)
    console.log('  ✓ Login exitoso — Dashboard visible')

    console.log('[5/9] Dashboard — verificando KPIs...')
    await page.waitForSelector('#dashboard-grid', { timeout: 5000 })
    const cards = await page.$$('.dashboard-card')
    console.log(`  ✓ Dashboard con ${cards.length} tarjetas KPI`)
    await sleep(1500)

    console.log('[6/9] Módulo Productos — creando productos...')
    await sleep(500)
    await page.click('.sidebar__item[data-id="products"]')
    await sleep(1000)

    await page.waitForSelector('button:has-text("+ Nuevo Producto")', { timeout: 5000 })
    await page.click('button:has-text("+ Nuevo Producto")')
    await page.waitForSelector('#field-name', { timeout: 5000 })
    await sleep(400)
    await page.fill('#field-name', 'Laptop Gamer')
    await sleep(300)
    await page.fill('#field-category', 'Electrónicos')
    await sleep(300)
    await page.fill('#field-purchasePrice', '2500')
    await sleep(300)
    await page.fill('#field-salePrice', '3500')
    await sleep(300)
    await page.fill('#field-stockMin', '5')
    await sleep(300)
    await page.click('.form__actions .btn--primary')
    await sleep(1000)
    console.log('  ✓ Producto "Laptop Gamer" creado')

    await page.click('button:has-text("+ Nuevo Producto")')
    await page.waitForSelector('#field-name', { timeout: 5000 })
    await sleep(400)
    await page.fill('#field-name', 'Mouse Inalámbrico')
    await sleep(300)
    await page.fill('#field-category', 'Electrónicos')
    await sleep(300)
    await page.fill('#field-purchasePrice', '30')
    await sleep(300)
    await page.fill('#field-salePrice', '60')
    await sleep(300)
    await page.fill('#field-stockMin', '10')
    await sleep(300)
    await page.click('.form__actions .btn--primary')
    await sleep(1000)
    console.log('  ✓ Producto "Mouse Inalámbrico" creado')
    await sleep(1000)

    console.log('[7/9] Módulo Clientes...')
    await sleep(500)
    await page.click('.sidebar__item[data-id="customers"]')
    await sleep(1000)
    await page.waitForSelector('button:has-text("+ Nuevo Cliente")', { timeout: 5000 })
    await page.click('button:has-text("+ Nuevo Cliente")')
    await page.waitForSelector('#field-name', { timeout: 5000 })
    await sleep(400)
    await page.fill('#field-name', 'Juan Pérez')
    await sleep(300)
    await page.fill('#field-email', 'juan@example.com')
    await sleep(300)
    await page.fill('#field-phone', '999888777')
    await sleep(300)
    await page.fill('#field-address', 'Av. Principal 123')
    await sleep(300)
    await page.click('.form__actions .btn--primary')
    await sleep(1200)
    console.log('  ✓ Cliente "Juan Pérez" creado')

    await page.click('button:has-text("+ Nuevo Cliente")')
    await page.waitForSelector('#field-name', { timeout: 5000 })
    await sleep(400)
    await page.fill('#field-name', 'María García')
    await sleep(300)
    await page.fill('#field-email', 'maria@example.com')
    await sleep(300)
    await page.fill('#field-phone', '111222333')
    await sleep(300)
    await page.fill('#field-address', 'Calle Secundaria 456')
    await sleep(300)
    await page.click('.form__actions .btn--primary')
    await sleep(1200)
    console.log('  ✓ Cliente "María García" creado')
    await sleep(1000)

    console.log('[8/9] Módulo Ventas — creando una venta...')
    await sleep(500)
    await page.click('.sidebar__item[data-id="sales"]')
    await sleep(1000)

    await page.waitForSelector('button:has-text("+ Nueva Venta")', { timeout: 5000 })
    await page.click('button:has-text("+ Nueva Venta")')
    await page.waitForSelector('.sale-form', { timeout: 5000 })
    await sleep(600)

    const custSelect = await page.$('.sale-form__select')
    if (custSelect) {
      const custOptions = await custSelect.$$eval('option', (opts) => opts.map(o => ({ value: o.value, text: o.text })))
      if (custOptions.length > 1) {
        const lastOpt = custOptions[custOptions.length - 1]
        await custSelect.selectOption(lastOpt.value)
        await sleep(400)
      }
    }

    const prodSelect = await page.$('.sale-form__select--product')
    if (prodSelect) {
      const prodOptions = await prodSelect.$$eval('option', (opts) => opts.map(o => ({ value: o.value, text: o.text })))
      if (prodOptions.length > 1) {
        await prodSelect.selectOption(prodOptions[1].value)
        await sleep(400)
      }
    }

    await page.fill('.sale-form__input--qty', '1')
    await sleep(300)
    await page.click('.sale-form__product-row .btn--primary')
    await sleep(800)
    await page.click('.sale-form__actions .btn--primary')
    await sleep(1500)
    console.log('  ✓ Venta registrada')
    await sleep(1000)

    console.log('[9/9] Cerrando sesión...')
    await sleep(500)
    await page.click('button:has-text("Cerrar Sesión")')
    await page.waitForSelector('#login-username', { timeout: 10000 })
    await sleep(800)
    console.log('  ✓ Sesión cerrada, redirigido al login')

    console.log('\n=== Smoke Test Completado con Éxito ===')

    const videoPathResult = await page.video().path()
    console.log(`\n📹 Video guardado en: ${videoPathResult}`)
  } catch (err) {
    console.error(`\n✗ Error durante smoke test: ${err.message}`)
    if (page) {
      try {
        const screenshotPath = path.join(VIDEO_DIR, `smoke-error-${timestamp}.png`)
        await page.screenshot({ path: screenshotPath })
        console.log(`📸 Screenshot guardado: ${screenshotPath}`)
      } catch {}
    }
  } finally {
    if (context) await context.close()
    if (browser) await browser.close()
    stopServer()
  }
}

main().catch((err) => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
