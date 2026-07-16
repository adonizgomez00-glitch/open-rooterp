import { User } from '../models/User.js'

export class UserRepository {
  constructor(db) {
    this._db = db
    this._table = db.users
  }

  async findAll() {
    const data = await this._table.orderBy('username').toArray()
    return data.map(User.fromDB)
  }

  async findById(id) {
    const data = await this._table.get(id)
    return data ? User.fromDB(data) : null
  }

  async findByUsername(username) {
    const data = await this._table.where('username').equals(username).first()
    return data ? User.fromDB(data) : null
  }

  async findByRole(roleId) {
    const data = await this._table.where('roleId').equals(roleId).toArray()
    return data.map(User.fromDB)
  }

  async create(userData) {
    const existing = await this.findByUsername(userData.username)
    if (existing) {
      throw new Error(`Ya existe un usuario con el nombre ${userData.username}`)
    }
    const { id, ...data } = { ...userData }
    delete data.id
    const newId = await this._table.add(data)
    return this.findById(newId)
  }

  async update(id, userData) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Usuario con id ${id} no encontrado`)
    }
    if (userData.username && userData.username !== existing.username) {
      const duplicate = await this.findByUsername(userData.username)
      if (duplicate) {
        throw new Error(`Ya existe otro usuario con el nombre ${userData.username}`)
      }
    }
    const updated = { ...existing.toJSON(), ...userData, id, updatedAt: new Date().toISOString() }
    await this._table.put(updated)
    return this.findById(id)
  }

  async delete(id) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Usuario con id ${id} no encontrado`)
    }
    await this._table.delete(id)
    return true
  }

  async count() {
    return this._table.count()
  }

  async countAdmins() {
    const all = await this._table.toArray()
    return all.length
  }
}
