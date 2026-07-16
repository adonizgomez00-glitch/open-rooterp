export class PermissionService {
  constructor(permissionRepository, roleRepository) {
    this._permissionRepo = permissionRepository
    this._roleRepo = roleRepository
  }

  async hasPermission(roleId, permissionName) {
    if (!roleId) return false
    return this._permissionRepo.hasPermission(roleId, permissionName)
  }

  async hasRole(user, roleName) {
    if (!user || !user.roleId) return false
    const role = await this._roleRepo.findById(user.roleId)
    return role ? role.name === roleName : false
  }

  async requirePermission(roleId, permissionName) {
    const has = await this.hasPermission(roleId, permissionName)
    if (!has) {
      throw new Error(`Permiso denegado: ${permissionName}`)
    }
    return true
  }

  async requireRole(user, roleName) {
    const has = await this.hasRole(user, roleName)
    if (!has) {
      throw new Error(`Rol requerido: ${roleName}`)
    }
    return true
  }

  async getPermissionsForRole(roleId) {
    return this._permissionRepo.getPermissionsForRole(roleId)
  }

  async getAllPermissions() {
    return this._permissionRepo.findAll()
  }

  async assignPermission(roleId, permissionId) {
    return this._permissionRepo.assignPermission(roleId, permissionId)
  }

  async removePermission(roleId, permissionId) {
    return this._permissionRepo.removePermission(roleId, permissionId)
  }

  async isAdmin(roleId) {
    if (!roleId) return false
    const role = await this._roleRepo.findById(roleId)
    return role ? role.name === 'Administrador' : false
  }
}
