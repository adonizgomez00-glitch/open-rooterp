export class SettingService {
  constructor(settingRepository) {
    this._repository = settingRepository
  }

  async getAll() {
    return this._repository.findAll()
  }

  async get(key) {
    if (!key) throw new Error('La clave es requerida')
    return this._repository.get(key)
  }

  async update(key, value) {
    if (!key?.trim()) throw new Error('La clave es requerida')
    if (value == null) throw new Error('El valor es requerido')
    return this._repository.set(key, String(value))
  }

  async updateMany(entries) {
    for (const { key, value } of entries) {
      await this.update(key, value)
    }
  }
}