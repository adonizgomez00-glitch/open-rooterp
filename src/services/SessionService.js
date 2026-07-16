import { generateId } from '../utils/helpers.js'

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000
const STORAGE_KEY = 'erp_session_token'

export class SessionService {
  constructor(sessionRepository) {
    this._repository = sessionRepository
    this._currentToken = null
  }

  async create(userId) {
    const token = generateId() + '-' + generateId()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS).toISOString()
    const session = await this._repository.create({
      userId,
      token,
      createdAt: now.toISOString(),
      expiresAt,
      lastAccess: now.toISOString()
    })
    this._currentToken = token
    this._persistToken(token)
    return session
  }

  async getByToken(token) {
    if (!token) return null
    const session = await this._repository.findByToken(token)
    if (!session) return null
    if (session.isExpired()) {
      await this._repository.delete(session.id)
      return null
    }
    await this._repository.update(session.id, { lastAccess: new Date().toISOString() })
    return session
  }

  async destroy(token) {
    if (!token) return false
    const result = await this._repository.deleteByToken(token)
    if (this._currentToken === token) {
      this._currentToken = null
    }
    this._removePersistedToken()
    return result
  }

  async destroyByUser(userId) {
    await this._repository.deleteByUser(userId)
    this._currentToken = null
    this._removePersistedToken()
  }

  getStoredToken() {
    try {
      return localStorage.getItem(STORAGE_KEY)
    } catch {
      return null
    }
  }

  _persistToken(token) {
    try {
      localStorage.setItem(STORAGE_KEY, token)
    } catch {
    }
  }

  _removePersistedToken() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
    }
  }

  async cleanExpired() {
    return this._repository.deleteExpired()
  }
}
