export class Role {
  constructor(data = {}) {
    this.id = data.id ?? undefined
    this.name = data.name ?? ''
    this.description = data.description ?? ''
    this.active = data.active ?? true
    this.createdAt = data.createdAt ?? new Date().toISOString()
    this.updatedAt = data.updatedAt ?? new Date().toISOString()
  }

  toJSON() {
    return { ...this }
  }

  static fromDB(data) {
    return new Role(data)
  }
}
