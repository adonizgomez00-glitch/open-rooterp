import { PermissionService } from '../../src/services/PermissionService.js'

function createMockPermissionRepo() {
  const perms = []
  const rps = []
  let nextPermId = 1
  let nextRpId = 1

  return {
    async findAll() { return [...perms] },

    async findByName(name) {
      const p = perms.find(x => x.name === name)
      return p ? { ...p } : null
    },

    async create(data) {
      const p = { id: nextPermId++, ...data, createdAt: new Date().toISOString() }
      perms.push(p)
      return { ...p }
    },

    async getPermissionsForRole(roleId) {
      const relations = rps.filter(x => x.roleId === roleId)
      return relations.map(r => {
        const p = perms.find(x => x.id === r.permissionId)
        return p ? { ...p } : null
      }).filter(Boolean)
    },

    async assignPermission(roleId, permissionId) {
      const existing = rps.find(x => x.roleId === roleId && x.permissionId === permissionId)
      if (existing) return { ...existing }
      const rp = { id: nextRpId++, roleId, permissionId }
      rps.push(rp)
      return { ...rp }
    },

    async removePermission(roleId, permissionId) {
      const idx = rps.findIndex(x => x.roleId === roleId && x.permissionId === permissionId)
      if (idx === -1) return false
      rps.splice(idx, 1)
      return true
    },

    async hasPermission(roleId, permissionName) {
      const perm = perms.find(x => x.name === permissionName)
      if (!perm) return false
      return rps.some(x => x.roleId === roleId && x.permissionId === perm.id)
    }
  }
}

function createMockRoleRepo() {
  const roles = []
  let nextId = 1

  return {
    async findById(id) {
      const r = roles.find(x => x.id === id)
      return r ? { ...r } : null
    },

    async findByName(name) {
      const r = roles.find(x => x.name === name)
      return r ? { ...r } : null
    },

    async create(data) {
      const r = { id: nextId++, ...data, createdAt: new Date().toISOString() }
      roles.push(r)
      return { ...r }
    }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testHasPermission() {
  const permRepo = createMockPermissionRepo()
  const roleRepo = createMockRoleRepo()
  const service = new PermissionService(permRepo, roleRepo)

  const perm = await permRepo.create({ name: 'products.view', description: 'Ver productos' })
  const role = await roleRepo.create({ name: 'Vendedor' })

  const result1 = await service.hasPermission(role.id, 'products.view')
  assert(result1 === false, 'hasPermission debe retornar false sin asignación')

  await permRepo.assignPermission(role.id, perm.id)
  const result2 = await service.hasPermission(role.id, 'products.view')
  assert(result2 === true, 'hasPermission debe retornar true después de asignar')

  console.log('  ✓ testHasPermission')
}

async function testHasPermissionNoRole() {
  const permRepo = createMockPermissionRepo()
  const roleRepo = createMockRoleRepo()
  const service = new PermissionService(permRepo, roleRepo)

  const result = await service.hasPermission(null, 'products.view')
  assert(result === false, 'hasPermission(null) debe retornar false')

  console.log('  ✓ testHasPermissionNoRole')
}

async function testHasRole() {
  const permRepo = createMockPermissionRepo()
  const roleRepo = createMockRoleRepo()
  const service = new PermissionService(permRepo, roleRepo)

  const role = await roleRepo.create({ name: 'Administrador' })

  const result1 = await service.hasRole({ roleId: role.id }, 'Administrador')
  assert(result1 === true, 'hasRole debe retornar true si coincide')

  const result2 = await service.hasRole({ roleId: role.id }, 'Vendedor')
  assert(result2 === false, 'hasRole debe retornar false si no coincide')

  const result3 = await service.hasRole(null, 'Administrador')
  assert(result3 === false, 'hasRole(null) debe retornar false')

  console.log('  ✓ testHasRole')
}

async function testRequirePermission() {
  const permRepo = createMockPermissionRepo()
  const roleRepo = createMockRoleRepo()
  const service = new PermissionService(permRepo, roleRepo)

  const perm = await permRepo.create({ name: 'products.edit' })
  const role = await roleRepo.create({ name: 'Editor' })
  await permRepo.assignPermission(role.id, perm.id)

  const result = await service.requirePermission(role.id, 'products.edit')
  assert(result === true, 'requirePermission debe retornar true si tiene permiso')

  try {
    await service.requirePermission(role.id, 'products.delete')
    assert(false, 'requirePermission debe lanzar error si no tiene permiso')
  } catch {
    // Expected
  }

  console.log('  ✓ testRequirePermission')
}

async function testIsAdmin() {
  const permRepo = createMockPermissionRepo()
  const roleRepo = createMockRoleRepo()
  const service = new PermissionService(permRepo, roleRepo)

  const adminRole = await roleRepo.create({ name: 'Administrador' })
  const userRole = await roleRepo.create({ name: 'Vendedor' })

  const result1 = await service.isAdmin(adminRole.id)
  assert(result1 === true, 'isAdmin debe retornar true para Administrador')

  const result2 = await service.isAdmin(userRole.id)
  assert(result2 === false, 'isAdmin debe retornar false para otro rol')

  const result3 = await service.isAdmin(null)
  assert(result3 === false, 'isAdmin(null) debe retornar false')

  console.log('  ✓ testIsAdmin')
}

async function testAssignAndRemovePermission() {
  const permRepo = createMockPermissionRepo()
  const roleRepo = createMockRoleRepo()
  const service = new PermissionService(permRepo, roleRepo)

  const perm = await permRepo.create({ name: 'test.perm' })
  const role = await roleRepo.create({ name: 'TestRole' })

  await service.assignPermission(role.id, perm.id)
  const hasAfterAssign = await service.hasPermission(role.id, 'test.perm')
  assert(hasAfterAssign === true, 'assignPermission debe otorgar permiso')

  await service.removePermission(role.id, perm.id)
  const hasAfterRemove = await service.hasPermission(role.id, 'test.perm')
  assert(hasAfterRemove === false, 'removePermission debe quitar permiso')

  console.log('  ✓ testAssignAndRemovePermission')
}

export async function runPermissionServiceTests() {
  console.log('\n--- PermissionService Tests ---\n')

  await testHasPermission()
  await testHasPermissionNoRole()
  await testHasRole()
  await testRequirePermission()
  await testIsAdmin()
  await testAssignAndRemovePermission()

  console.log('\n✓ Todos los tests de PermissionService pasaron\n')
}
