import { Setting } from '../models/Setting.js'

export class SettingRepository {
  constructor(db) {
    this.db = db
    this.table = db.settings
  }

  async findAll() {
    const data = await this.table.toArray()
    return data.map(Setting.fromDB)
  }

  async get(key) {
    const data = await this.table.where('key').equals(key).first()
    return data ? data.value : null
  }

  async set(key, value) {
    const existing = await this.table.where('key').equals(key).first()
    const setting = new Setting({
      id: existing?.id,
      key,
      value,
      updatedAt: new Date().toISOString()
    })

    if (existing) {
      await this.table.put(setting.toJSON())
    } else {
      const { id, ...data } = setting.toJSON()
      delete data.id
      await this.table.add(data)
    }
    return setting
  }

  async delete(key) {
    const existing = await this.table.where('key').equals(key).first()
    if (!existing) {
      throw new Error(`Configuración con key ${key} no encontrada`)
    }
    await this.table.delete(existing.id)
    return true
  }

  async getMany(keys) {
    const data = await this.table.where('key').anyOf(keys).toArray()
    return data.reduce((acc, s) => {
      acc[s.key] = s.value
      return acc
    }, {})
  }

  async setMany(entries) {
    for (const { key, value } of entries) {
      await this.set(key, value)
    }
  }
}
