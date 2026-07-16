/**
 * app.js — Configuración
 *
 * Constantes y configuración global de la aplicación.
 * Define nombres de módulos, rutas, límites y defaults.
 */

export const APP_CONFIG = Object.freeze({
  APP_NAME: 'ERP Ligero Offline',
  VERSION: '1.0.0',
  ITEMS_PER_PAGE: 20,
  DEBOUNCE_MS: 300,
  STOCK_LOW_THRESHOLD: 10,
  STOCK_CRITICAL_THRESHOLD: 3
})
