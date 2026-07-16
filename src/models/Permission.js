export class Permission {
  constructor(data = {}) {
    this.id = data.id ?? undefined
    this.name = data.name ?? ''
    this.description = data.description ?? ''
    this.createdAt = data.createdAt ?? new Date().toISOString()
  }

  toJSON() {
    return { ...this }
  }

  static fromDB(data) {
    return new Permission(data)
  }
}
