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
 * plugins.js — Registro de plugins (módulos)
 *
 * Todos los módulos de la aplicación son plugins instalables/desinstalables
 * desde la UI. Aquí se declara su metadato:
 *
 * - id: identificador único
 * - label: nombre visible en el menú
 * - icon: glifo del menú
 * - group: agrupación para la vista de Plugins
 * - description: texto descriptivo
 * - viewPermission: permiso `modulo.accion` requerido para verlo (null = sin restricción)
 * - adminOnly: visible únicamente para el rol Administrador
 * - required: no puede desinstalarse (núcleo de la app)
 * - defaultEnabled: estado por defecto si no hay configuración guardada
 * - requires: ids de plugins que deben estar instalados para poder usarlo
 * - tables: tablas de datos propias del plugin (se limpian al desinstalar)
 * - permissions: permisos `modulo.accion` que gestiona (se revocan a roles no-admin al desinstalar)
 */

export const PLUGINS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '\u25a0',
    group: 'General',
    description: 'Indicadores principales del negocio.',
    viewPermission: 'dashboard.view',
    adminOnly: false,
    required: true,
    defaultEnabled: true,
    requires: [],
    tables: [],
    permissions: ['dashboard.view']
  },
  {
    id: 'products',
    label: 'Productos',
    icon: '\u2616',
    group: 'Comercial',
    description: 'Inventario comercial: productos, precios, categorías y stock.',
    viewPermission: 'products.view',
    adminOnly: false,
    required: false,
    defaultEnabled: true,
    requires: [],
    tables: ['products'],
    permissions: ['products.view', 'products.create', 'products.edit', 'products.delete']
  },
  {
    id: 'customers',
    label: 'Clientes',
    icon: '\u263a',
    group: 'Comercial',
    description: 'Clientes del negocio: datos personales, documento y estado.',
    viewPermission: 'customers.view',
    adminOnly: false,
    required: false,
    defaultEnabled: true,
    requires: [],
    tables: ['customers'],
    permissions: ['customers.view', 'customers.create', 'customers.edit', 'customers.delete']
  },
  {
    id: 'suppliers',
    label: 'Proveedores',
    icon: '\u2191',
    group: 'Comercial',
    description: 'Proveedores para reabastecer el inventario.',
    viewPermission: 'suppliers.view',
    adminOnly: false,
    required: false,
    defaultEnabled: true,
    requires: [],
    tables: ['suppliers'],
    permissions: ['suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete']
  },
  {
    id: 'sales',
    label: 'Ventas',
    icon: '\u2714',
    group: 'Comercial',
    description: 'Punto de venta: facturas, cobros y anulaciones.',
    viewPermission: 'sales.view',
    adminOnly: false,
    required: false,
    defaultEnabled: true,
    requires: ['products', 'customers'],
    tables: ['sales', 'saleItems'],
    permissions: ['sales.view', 'sales.create', 'sales.cancel', 'sales.delete']
  },
  {
    id: 'purchases',
    label: 'Compras',
    icon: '\u2190',
    group: 'Comercial',
    description: 'Compras a proveedores para reposición de inventario.',
    viewPermission: 'purchases.view',
    adminOnly: false,
    required: false,
    defaultEnabled: true,
    requires: ['products', 'suppliers'],
    tables: ['purchases', 'purchaseItems'],
    permissions: ['purchases.view', 'purchases.create', 'purchases.cancel', 'purchases.delete']
  },
  {
    id: 'inventory',
    label: 'Inventario',
    icon: '\u25a3',
    group: 'Comercial',
    description: 'Movimientos y control de stock del inventario.',
    viewPermission: 'inventory.view',
    adminOnly: false,
    required: false,
    defaultEnabled: true,
    requires: ['products'],
    tables: ['inventoryMovements'],
    permissions: ['inventory.view', 'inventory.adjust']
  },
  {
    id: 'accounting',
    label: 'Contabilidad',
    icon: '\u2630',
    group: 'Finanzas',
    description: 'Plan de cuentas, asientos y reportes financieros.',
    viewPermission: 'accounting.view',
    adminOnly: false,
    required: false,
    defaultEnabled: true,
    requires: [],
    tables: ['accounts', 'accountingEntries'],
    permissions: ['accounting.view', 'accounting.create', 'accounting.edit']
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: '\u2261',
    group: 'General',
    description: 'Reportes de ventas, compras y stock del negocio.',
    viewPermission: 'reports.view',
    adminOnly: false,
    required: true,
    defaultEnabled: true,
    requires: ['products', 'customers', 'suppliers', 'sales', 'purchases'],
    tables: [],
    permissions: ['reports.view']
  },
  {
    id: 'exports',
    label: 'Exportar',
    icon: '\u2197',
    group: 'General',
    description: 'Exportación de datos en CSV y JSON.',
    viewPermission: 'exports.view',
    adminOnly: false,
    required: true,
    defaultEnabled: true,
    requires: [],
    tables: [],
    permissions: ['exports.view', 'exports.create']
  },
  {
    id: 'imports',
    label: 'Importar',
    icon: '\u2193',
    group: 'General',
    description: 'Importación de datos con auto-detección de formato.',
    viewPermission: null,
    adminOnly: false,
    required: true,
    defaultEnabled: true,
    requires: [],
    tables: [],
    permissions: ['imports.view', 'imports.create']
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: '\u2699',
    group: 'Sistema',
    description: 'Configuración general del negocio y del sistema.',
    viewPermission: 'settings.view',
    adminOnly: false,
    required: true,
    defaultEnabled: true,
    requires: [],
    tables: [],
    permissions: ['settings.view', 'settings.edit']
  },
  {
    id: 'users',
    label: 'Usuarios',
    icon: '\u263c',
    group: 'Sistema',
    description: 'Administración de usuarios, roles y permisos.',
    viewPermission: 'users.view',
    adminOnly: false,
    required: true,
    defaultEnabled: true,
    requires: [],
    tables: ['users'],
    permissions: ['users.view', 'users.create', 'users.edit', 'users.delete']
  },
  {
    id: 'plugins',
    label: 'Plugins',
    icon: '\u2299',
    group: 'Sistema',
    description: 'Instalar y desinstalar los módulos de la aplicación.',
    viewPermission: null,
    adminOnly: true,
    required: true,
    defaultEnabled: true,
    requires: [],
    tables: [],
    permissions: ['plugins.manage']
  }
]
