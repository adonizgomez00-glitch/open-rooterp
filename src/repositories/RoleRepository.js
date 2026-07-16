import { Role } from '../models/Role.js'

export class RoleRepository {
  constructor(db) {
    this._db = db
    this._table = db.roles
  }

  async findAll() {
    const data = await this._table.orderBy('name').toArray()
    return data.map(Role.fromDB)
  }

  async findById(id) {
    const data = await this._table.get(id)
    return data ? Role.fromDB(data) : null
  }

  async findByName(name) {
    const data = await this._table.where('name').equals(name).first()
    return data ? Role.fromDB(data) : null
  }

  async create(roleData) {
    const existing = await this.findByName(roleData.name)
    if (existing) {
      throw new Error(`Ya existe un rol con el nombre ${roleData.name}`)
    }
    const { id, ...data } = { ...roleData }
    delete data.id
    const newId = await this._table.add(data)
    return this.findById(newId)
  }

  async update(id, roleData) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Rol con id ${id} no encontrado`)
    }
    if (roleData.name && roleData.name !== existing.name) {
      const duplicate = await this.findByName(roleData.name)
      if (duplicate) {
        throw new Error(`Ya existe otro rol con el nombre ${roleData.name}`)
      }
    }
    const updated = { ...existing.toJSON(), ...roleData, id, updatedAt: new Date().toISOString() }
    await this._table.put(updated)
    return this.findById(id)
  }

  async delete(id) {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`Rol con id ${id} no encontrado`)
    }
    await this._table.delete(id)
    return true
  }
}
