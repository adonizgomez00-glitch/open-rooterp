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

import { Toast } from '../components/Toast.js'
import { PLUGINS } from '../config/plugins.js'

export class PluginsController {
  constructor(pluginService, view, onChange = null) {
    this._service = pluginService
    this._view = view
    this._onChange = onChange
  }

  init(container) {
    this._view.render(container)
    this._view.setInstallCb((id) => this._install(id))
    this._view.setUninstallCb((id) => this._uninstall(id))
    this._load()
  }

  async _load() {
    try {
      const rows = []
      for (const plugin of PLUGINS) {
        const enabled = await this._service.isEnabled(plugin.id)
        rows.push({ ...plugin, enabled })
      }
      this._view.renderPlugins(rows)
    } catch (error) {
      Toast.error(error.message)
    }
  }

  _changed() {
    if (this._onChange) this._onChange()
  }

  async _install(id) {
    try {
      await this._service.install(id)
      Toast.success('Módulo instalado')
      this._changed()
    } catch (error) {
      Toast.error(error.message)
    }
  }

  async _uninstall(id) {
    const plugin = PLUGINS.find(p => p.id === id)
    if (!plugin) return
    const confirmed = await this._view.confirmUninstall(plugin)
    if (!confirmed) return
    try {
      await this._service.uninstall(id)
      Toast.success('Módulo desinstalado')
      this._changed()
    } catch (error) {
      Toast.error(error.message)
    }
  }
}