import { chromium } from 'playwright'
import { spawn } from 'child_process'
import { createRequire } from 'module'
import http from 'http'
import fs from 'fs'
import path from 'path'

const PORT = 3099
const BASE = `http://localhost:${PORT}`
const DB_NAME = 'ERPLigero'

let server = null
let browser = null
let context = null
let page = null
let serverReady = false

export async function startServer() {
  return new Promise((resolve, reject) => {
    const cwd = path.resolve(import.meta.dirname, '../..')
    server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe']
    })
    let started = false
    const timeout = setTimeout(() => {
      if (!started) reject(new Error('Server start timeout'))
    }, 15000)

    const tryConnect = () => {
      const req = http.get(`http://127.0.0.1:${PORT}`, (res) => {
        started = true
        serverReady = true
        clearTimeout(timeout)
        res.resume()
        setTimeout(resolve, 300)
      })
      req.on('error', () => {
        if (!started) setTimeout(tryConnect, 200)
      })
      req.setTimeout(1000, () => { req.destroy(); if (!started) setTimeout(tryConnect, 200) })
    }
    setTimeout(tryConnect, 300)

    server.on('error', (err) => { if (!started) { clearTimeout(timeout); reject(err) } })
  })
}

export async function stopServer() {
  if (server) { server.kill(); server = null; serverReady = false }
}

export async function launchBrowser() {
  browser = await chromium.launch({ headless: true })
  context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  page = await context.newPage()

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`  [console.error] ${msg.text()}`)
    }
  })
  page.on('pageerror', (err) => {
    console.log(`  [page error] ${err.message}`)
  })

  return page
}

export async function closeBrowser() {
  if (context) await context.close()
  if (browser) await browser.close()
  browser = null; context = null; page = null
}

export function getPage() { return page }

export function getBaseUrl() { return BASE }

export async function navigateTo(url) {
  await page.goto(url || BASE, { waitUntil: 'networkidle', timeout: 20000 })
}

export async function clearDatabase() {
  await page.evaluate((dbName) => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase(dbName)
      req.onsuccess = resolve
      req.onerror = () => reject(new Error('Failed to delete DB'))
      req.onblocked = resolve
    })
  }, DB_NAME)
  await page.reload({ waitUntil: 'networkidle', timeout: 15000 })
}

export async function reload() {
  await page.reload({ waitUntil: 'networkidle', timeout: 15000 })
}

export async function click(selector) {
  await page.click(selector, { timeout: 5000 })
}

export async function fill(selector, value) {
  try {
    await page.fill(selector, value, { timeout: 5000 })
  } catch {
    await page.evaluate(({ sel, val }) => {
      const el = document.querySelector(sel)
      if (el) { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })) }
    }, { sel: selector, val: value })
  }
}

export async function select(selector, value) {
  await page.selectOption(selector, value)
}

export async function waitFor(selector, timeout = 5000) {
  await page.waitForSelector(selector, { timeout })
}

export async function waitForText(selector, text, timeout = 5000) {
  await page.waitForSelector(selector, { timeout })
  await page.waitForFunction(({ sel, txt }) => {
    const el = document.querySelector(sel)
    return el && el.textContent.includes(txt)
  }, { sel: selector, txt: text }, { timeout })
}

export async function getText(selector) {
  const el = await page.$(selector)
  return el ? el.textContent() : ''
}

export async function clickTab(tabId) {
  await click(`[data-tab="${tabId}"]`)
}

const sidebarMap = {
  dashboard: 'Dashboard',
  products: 'Productos',
  customers: 'Clientes',
  suppliers: 'Proveedores',
  sales: 'Ventas',
  purchases: 'Compras',
  inventory: 'Inventario',
  reports: 'Reportes',
  accounting: 'Contabilidad',
  settings: 'Configuración',
  exports: 'Exportar',
  imports: 'Importar',
  users: 'Usuarios'
}

const moduleSelectors = {
  customers: '.customers-table-wrapper',
  suppliers: '.suppliers-table-wrapper',
  sales: '.sales-table-wrapper',
  purchases: '.purchases-table-wrapper',
  inventory: '.inventory-table-wrapper',
  products: '.product-table-wrapper',
  accounting: '#acct-tabs',
  reports: '#report-tabs',
  settings: '#setting-business_name',
  dashboard: '#dashboard-grid',
  exports: '#export-entity',
  imports: '.import-dropzone',
  users: '.users-table-wrapper'
}

export async function openModule(moduleName) {
  const label = sidebarMap[moduleName]
  if (!label) throw new Error(`Unknown module: ${moduleName}`)
  await page.waitForTimeout(300)
  const sidebarItem = await page.$(`.sidebar__item[data-id="${moduleName}"]`)
  if (sidebarItem) {
    await sidebarItem.click()
  } else {
    await click(`text="${label}"`)
  }
  await page.waitForTimeout(800)
  const selector = moduleSelectors[moduleName]
  if (selector) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 })
    } catch {
      await page.waitForTimeout(1000)
    }
  }
}

export async function getTableRowCount() {
  return page.evaluate(() => {
    const rows = document.querySelectorAll('.table__body .table__row')
    return rows.length
  })
}

export async function getToastMessage() {
  try {
    const toasts = await page.$$('.toast')
    if (toasts.length === 0) return null
    const lastToast = toasts[toasts.length - 1]
    const text = await lastToast.textContent()
    return text.trim()
  } catch {
    return null
  }
}

export async function getModalTitle() {
  try {
    await page.waitForSelector('.modal__title', { timeout: 3000 })
    return await page.textContent('.modal__title')
  } catch {
    return null
  }
}

export async function acceptConfirm() {
  await page.waitForSelector('.confirm-dialog__footer .btn--danger', { timeout: 3000 })
  await click('.confirm-dialog__footer .btn--danger')
}

export async function cancelConfirm() {
  await click('.confirm-dialog__footer .btn--secondary')
}

export async function closeModal() {
  try {
    await page.waitForSelector('.modal__close', { timeout: 2000 })
    await click('.modal__close')
  } catch {}
}

export async function submitForm() {
  await click('.form__actions .btn--primary')
}

export async function waitForLoadComplete() {
  await page.waitForTimeout(1000)
}

let assertCount = 0
let assertFailed = 0

export function assert(condition, message) {
  assertCount++
  if (!condition) {
    assertFailed++
    throw new Error(`ASSERT FAIL: ${message}`)
  }
  return condition
}

export async function assertText(selector, expected, message) {
  const text = await getText(selector)
  assert(text.includes(expected), `${message} — esperado "${expected}", obtenido "${text}"`)
}

export async function assertToast(expected) {
  const msg = await getToastMessage()
  assert(msg && msg.includes(expected), `Toast esperado "${expected}", obtenido "${msg || 'null'}"`)
}

export async function assertTableNotEmpty(message) {
  const count = await getTableRowCount()
  assert(count > 0, `${message} — tabla vacía (0 filas)`)
}

export function getResults() {
  return { total: assertCount, passed: assertCount - assertFailed, failed: assertFailed }
}

export function resetAssertions() {
  assertCount = 0
  assertFailed = 0
}
