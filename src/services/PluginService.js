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
 * PluginService — Gestión de plugins (módulos instalables/desinstalables)
 *
 * El estado habilitado se persiste en la tabla `settings` con la clave
 * `module.<id>.enabled` ('1'/'0'). La ausencia de configuración se resuelve
 * con `defaultEnabled` del plugin.
 *
 * Desinstalar un plugin:
 *   1. Verifica que no sea del núcleo (`required`).
 *   2. Verifica que ningún otro plugin habilitado lo requiera.
 *   3. Limpia las filas de sus tablas propias (transacción Dexie).
 *   4. Revoca sus permisos a los roles no administradores.
 *   5. Lo deshabilita.
 */

export class PluginService {
  constructor({ settingRepository, permissionRepository, roleRepository, db, plugins }) {
    this._settingRepo = settingRepository
    this._permissionRepo = permissionRepository
    this._roleRepo = roleRepository
    this._db = db
    this._plugins = plugins || []
  }

  _get(pluginId) {
    const plugin = this._plugins.find(p => p.id === pluginId)
    if (!plugin) throw new Error(`Plugin ${pluginId} no encontrado`)
    return plugin
  }

  async isEnabled(pluginId) {
    const plugin = this._get(pluginId)
    const raw = await this._settingRepo.get(`module.${pluginId}.enabled`)
    if (raw === null || raw === undefined) {
      return plugin.defaultEnabled !== false
    }
    return raw === '1' || raw === true
  }

  async setEnabled(pluginId, enabled) {
    await this._settingRepo.set(`module.${pluginId}.enabled`, enabled ? '1' : '0')
  }

  async install(pluginId) {
    const plugin = this._get(pluginId)
    await this.setEnabled(pluginId, true)
    return plugin
  }

  async uninstall(pluginId) {
    const plugin = this._get(pluginId)

    if (plugin.required) {
      throw new Error(`El módulo "${plugin.label}" es parte del núcleo y no puede desinstalarse`)
    }

    const blockers = []
    for (const candidate of this._plugins) {
      if (candidate.id === pluginId) continue
      if ((candidate.requires || []).includes(pluginId) && await this.isEnabled(candidate.id)) {
        blockers.push(candidate)
      }
    }
    if (blockers.length > 0) {
      const names = blockers.map(b => b.label).join(', ')
      throw new Error(`No se puede desinstalar "${plugin.label}": lo requieren ${names}`)
    }

    const tables = plugin.tables || []
    const existingTables = tables.filter(t => this._db && this._db[t])
    if (existingTables.length > 0) {
      await this._db.transaction('rw', existingTables.map(t => this._db[t]), async () => {
        for (const t of existingTables) {
          await this._db[t].clear()
        }
      })
    }

    await this._revokePermissions(plugin)
    await this.setEnabled(pluginId, false)
    return plugin
  }

  async _revokePermissions(plugin) {
    const permNames = plugin.permissions || []
    if (permNames.length === 0 || !this._permissionRepo || !this._roleRepo) return

    const roles = await this._roleRepo.findAll()
    for (const permName of permNames) {
      const perm = await this._permissionRepo.findByName(permName)
      if (!perm) continue
      for (const role of roles) {
        if (role.name === 'Administrador') continue
        await this._permissionRepo.removePermission(role.id, perm.id)
      }
    }
  }
}
