import { Permission } from '../models/Permission.js'
import { RolePermission } from '../models/RolePermission.js'

export class PermissionRepository {
  constructor(db) {
    this._db = db
    this._table = db.permissions
    this._rpTable = db.rolePermissions
  }

  async findAll() {
    const data = await this._table.orderBy('name').toArray()
    return data.map(Permission.fromDB)
  }

  async findById(id) {
    const data = await this._table.get(id)
    return data ? Permission.fromDB(data) : null
  }

  async findByName(name) {
    const data = await this._table.where('name').equals(name).first()
    return data ? Permission.fromDB(data) : null
  }

  async create(permData) {
    const existing = await this.findByName(permData.name)
    if (existing) {
      throw new Error(`Ya existe un permiso con el nombre ${permData.name}`)
    }
    const { id, ...data } = { ...permData }
    delete data.id
    const newId = await this._table.add(data)
    return this.findById(newId)
  }

  async getPermissionsForRole(roleId) {
    const rps = await this._rpTable.where('roleId').equals(roleId).toArray()
    if (rps.length === 0) return []
    const permIds = rps.map(rp => rp.permissionId)
    const perms = await this._table.where('id').anyOf(permIds).toArray()
    return perms.map(Permission.fromDB)
  }

  async assignPermission(roleId, permissionId) {
    const existing = await this._rpTable
      .where('[roleId+permissionId]')
      .equals([roleId, permissionId])
      .first()
    if (existing) return RolePermission.fromDB(existing)
    const id = await this._rpTable.add({ roleId, permissionId })
    const data = await this._rpTable.get(id)
    return RolePermission.fromDB(data)
  }

  async removePermission(roleId, permissionId) {
    const existing = await this._rpTable
      .where('[roleId+permissionId]')
      .equals([roleId, permissionId])
      .first()
    if (!existing) return false
    await this._rpTable.delete(existing.id)
    return true
  }

  async hasPermission(roleId, permissionName) {
    const perm = await this.findByName(permissionName)
    if (!perm) return false
    const rp = await this._rpTable
      .where('[roleId+permissionId]')
      .equals([roleId, perm.id])
      .first()
    return !!rp
  }
}
