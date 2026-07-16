/*
 * Open RootERP — ERP 100% offline, open source, libre y gratuito
 * Copyright (C) 2024 Adónis Adonai Gómez Martínez <adonizgomez00@gmail.com>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

/**
 * app.js — Configuración
 *
 * Constantes y configuración global de la aplicación.
 * Define nombres de módulos, rutas, límites y defaults.
 */

export const APP_CONFIG = Object.freeze({
  APP_NAME: 'Open RootERP',
  VERSION: '1.0.0',
  ITEMS_PER_PAGE: 20,
  DEBOUNCE_MS: 300,
  STOCK_LOW_THRESHOLD: 10,
  STOCK_CRITICAL_THRESHOLD: 3
})
