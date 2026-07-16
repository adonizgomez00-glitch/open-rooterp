export class Session {
  constructor(data = {}) {
    this.id = data.id ?? undefined
    this.userId = data.userId ?? null
    this.token = data.token ?? ''
    this.createdAt = data.createdAt ?? new Date().toISOString()
    this.expiresAt = data.expiresAt ?? null
    this.lastAccess = data.lastAccess ?? null
  }

  isExpired() {
    if (!this.expiresAt) return false
    return new Date(this.expiresAt) < new Date()
  }

  toJSON() {
    return { ...this }
  }

  static fromDB(data) {
    return new Session(data)
  }
}
