export class User {
  constructor(data = {}) {
    this.id = data.id ?? undefined
    this.username = data.username ?? ''
    this.passwordHash = data.passwordHash ?? ''
    this.roleId = data.roleId ?? null
    this.active = data.active ?? true
    this.createdAt = data.createdAt ?? new Date().toISOString()
    this.updatedAt = data.updatedAt ?? new Date().toISOString()
    this.lastLogin = data.lastLogin ?? null
  }

  toJSON() {
    return { ...this }
  }

  toPublicJSON() {
    const { passwordHash, ...rest } = this
    return rest
  }

  static fromDB(data) {
    return new User(data)
  }
}
