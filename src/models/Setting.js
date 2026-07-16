export class Setting {
  constructor(data = {}) {
    this.id = data.id ?? undefined
    this.key = data.key ?? ''
    this.value = data.value ?? ''
    this.updatedAt = data.updatedAt ?? new Date().toISOString()
  }

  toJSON() {
    return { ...this }
  }

  static fromDB(data) {
    return new Setting(data)
  }

  validate() {
    const errors = []
    if (!this.key?.trim()) errors.push('La clave es requerida')
    return { valid: errors.length === 0, errors }
  }
}
