export class RolePermission {
  constructor(data = {}) {
    this.id = data.id ?? undefined
    this.roleId = data.roleId ?? null
    this.permissionId = data.permissionId ?? null
  }

  toJSON() {
    return { ...this }
  }

  static fromDB(data) {
    return new RolePermission(data)
  }
}
