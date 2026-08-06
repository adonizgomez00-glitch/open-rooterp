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

import { Table } from '../components/Table.js'
import { ConfirmDialog } from '../components/ConfirmDialog.js'

export class PluginsView {
  constructor() {
    this._container = null
    this._table = null
    this._onInstallCb = null
    this._onUninstallCb = null
  }

  render(container) {
    this._container = container
    container.innerHTML = ''

    const toolbar = document.createElement('div')
    toolbar.className = 'toolbar'
    const title = document.createElement('h2')
    title.className = 'toolbar__title'
    title.textContent = 'Plugins'
    toolbar.appendChild(title)

    const subtitle = document.createElement('p')
    subtitle.className = 'toolbar__subtitle'
    subtitle.textContent = 'Administra los módulos de la aplicación: instala o desinstala según las necesidades del negocio.'
    toolbar.appendChild(subtitle)

    container.appendChild(toolbar)

    const wrapper = document.createElement('div')
    wrapper.className = 'plugins-table-wrapper'

    this._table = new Table({
      columns: [
        { key: 'label', label: 'Módulo', width: '180px' },
        { key: 'group', label: 'Grupo', width: '120px' },
        { key: 'description', label: 'Descripción' },
        {
          key: 'enabled', label: 'Estado', width: '130px', sortable: false,
          render: (v) => {
            const span = document.createElement('span')
            span.className = `status-badge ${v ? 'status--ok' : 'status--muted'}`
            span.textContent = v ? 'Instalado' : 'Desinstalado'
            return span
          }
        },
        {
          key: 'id', label: 'Acciones', width: '160px', sortable: false,
          render: (value, row) => {
            const group = document.createElement('div')
            group.className = 'table-actions'

            if (row.required) {
              const label = document.createElement('span')
              label.className = 'text-muted'
              label.textContent = 'Núcleo'
              group.appendChild(label)
            } else if (row.enabled) {
              const btn = document.createElement('button')
              btn.className = 'btn btn--sm btn--ghost-danger'
              btn.textContent = 'Desinstalar'
              btn.dataset.id = row.id
              btn.addEventListener('click', (e) => {
                e.stopPropagation()
                if (this._onUninstallCb) this._onUninstallCb(row.id)
              })
              group.appendChild(btn)
            } else {
              const btn = document.createElement('button')
              btn.className = 'btn btn--sm btn--ghost'
              btn.textContent = 'Instalar'
              btn.dataset.id = row.id
              btn.addEventListener('click', (e) => {
                e.stopPropagation()
                if (this._onInstallCb) this._onInstallCb(row.id)
              })
              group.appendChild(btn)
            }

            return group
          }
        }
      ],
      emptyMessage: 'No hay plugins registrados'
    })

    wrapper.appendChild(this._table.render())
    container.appendChild(wrapper)
  }

  renderPlugins(plugins) {
    this._table.setData(plugins.map(p => ({ ...p, id: p.id })))
  }

  confirmUninstall(plugin) {
    return new ConfirmDialog({
      title: 'Desinstalar módulo',
      message: `¿Seguro que deseas desinstalar "${plugin.label}"? Se ocultará del menú y se eliminarán los datos de sus tablas (${(plugin.tables || []).length} tablas).`,
      confirmText: 'Desinstalar',
      cancelText: 'Cancelar',
      danger: true
    }).confirm()
  }

  setInstallCb(cb) { this._onInstallCb = cb }
  setUninstallCb(cb) { this._onUninstallCb = cb }
}