import { Session } from '../models/Session.js'

export class SessionRepository {
  constructor(db) {
    this._db = db
    this._table = db.sessions
  }

  async findByToken(token) {
    const data = await this._table.where('token').equals(token).first()
    return data ? Session.fromDB(data) : null
  }

  async findActiveByUser(userId) {
    const data = await this._table.where('userId').equals(userId).toArray()
    const now = new Date()
    return data.filter(s => !s.expiresAt || new Date(s.expiresAt) > now).map(Session.fromDB)
  }

  async create(sessionData) {
    const { id, ...data } = { ...sessionData }
    delete data.id
    const newId = await this._table.add(data)
    const saved = await this._table.get(newId)
    return Session.fromDB(saved)
  }

  async update(id, sessionData) {
    const existing = await this._table.get(id)
    if (!existing) {
      throw new Error(`Sesión con id ${id} no encontrada`)
    }
    const updated = { ...existing, ...sessionData, id }
    await this._table.put(updated)
    const saved = await this._table.get(id)
    return Session.fromDB(saved)
  }

  async delete(id) {
    await this._table.delete(id)
    return true
  }

  async deleteByToken(token) {
    const session = await this.findByToken(token)
    if (!session) return false
    await this._table.delete(session.id)
    return true
  }

  async deleteByUser(userId) {
    const sessions = await this._table.where('userId').equals(userId).toArray()
    const ids = sessions.map(s => s.id)
    await this._table.bulkDelete(ids)
    return ids.length
  }

  async deleteExpired() {
    const now = new Date().toISOString()
    const expired = await this._table.where('expiresAt').below(now).toArray()
    const ids = expired.map(s => s.id)
    if (ids.length > 0) {
      await this._table.bulkDelete(ids)
    }
    return ids.length
  }
}
