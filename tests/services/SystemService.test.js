import { SystemService } from '../../src/services/SystemService.js'

function createMockUserRepo() {
  const users = []
  let nextId = 1

  return {
    async count() { return users.length },
    async countAdmins() { return users.length },

    async findByUsername(username) {
      return users.find(x => x.username === username) || null
    },

    async create(data) {
      const u = { id: nextId++, ...data }
      users.push(u)
      return { ...u }
    },

    _addUser(user) {
      const u = { id: nextId++, ...user }
      users.push(u)
      return u
    }
  }
}

function createMockRoleRepo() {
  const roles = []
  let nextId = 1

  return {
    async findAll() { return [...roles] },

    async findByName(name) {
      return roles.find(x => x.name === name) || null
    },

    async findById(id) {
      return roles.find(x => x.id === id) || null
    },

    async create(data) {
      const r = { id: nextId++, ...data, createdAt: new Date().toISOString() }
      roles.push(r)
      return { ...r }
    },

    _addRole(role) {
      const r = { id: nextId++, ...role }
      roles.push(r)
      return r
    }
  }
}

function createMockPermissionRepo() {
  const perms = []
  const rps = []
  let nextPermId = 1
  let nextRpId = 1

  return {
    async findAll() { return [...perms] },

    async findByName(name) {
      return perms.find(x => x.name === name) || null
    },

    async create(data) {
      const p = { id: nextPermId++, ...data, createdAt: new Date().toISOString() }
      perms.push(p)
      return { ...p }
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
      const perm = perms.find(p => p.name === permissionName)
      if (!perm) return false
      return rps.some(rp => rp.roleId === roleId && rp.permissionId === perm.id)
    },

    _addPerm(perm) {
      const p = { id: nextPermId++, ...perm }
      perms.push(p)
      return p
    }
  }
}

function createMockSettingRepo() {
  const settings = []

  return {
    async get(key) {
      const found = settings.find(x => x.key === key)
      return found ? found.value : null
    },

    async create(data) {
      settings.push(data)
      return { ...data }
    }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testIsFirstRunTrue() {
  const userRepo = createMockUserRepo()
  const roleRepo = createMockRoleRepo()
  const permRepo = createMockPermissionRepo()
  const settingRepo = createMockSettingRepo()
  const service = new SystemService(userRepo, roleRepo, permRepo, settingRepo)

  const result = await service.isFirstRun()
  assert(result === true, 'isFirstRun debe retornar true sin usuarios')

  console.log('  ✓ testIsFirstRunTrue')
}

async function testIsFirstRunFalse() {
  const userRepo = createMockUserRepo()
  const roleRepo = createMockRoleRepo()
  const permRepo = createMockPermissionRepo()
  const settingRepo = createMockSettingRepo()
  const service = new SystemService(userRepo, roleRepo, permRepo, settingRepo)

  userRepo._addUser({ username: 'admin', roleId: 1, active: true })

  const result = await service.isFirstRun()
  assert(result === false, 'isFirstRun debe retornar false con usuarios existentes')

  console.log('  ✓ testIsFirstRunFalse')
}

async function testSetupInitial() {
  const userRepo = createMockUserRepo()
  const roleRepo = createMockRoleRepo()
  const permRepo = createMockPermissionRepo()
  const settingRepo = createMockSettingRepo()
  const service = new SystemService(userRepo, roleRepo, permRepo, settingRepo)

  permRepo._addPerm({ name: 'products.view', description: 'Ver productos' })
  permRepo._addPerm({ name: 'settings.edit', description: 'Editar configuración' })

  const result = await service.setupInitial({
    username: 'admin',
    passwordHash: 'hashed-password',
    businessName: 'Mi Empresa'
  })

  assert(result.username === 'admin', 'setupInitial debe retornar username')
  assert(result.role !== undefined, 'setupInitial debe crear rol')

  const user = await userRepo.findByUsername('admin')
  assert(user !== null, 'setupInitial debe crear usuario')
  assert(user.passwordHash === 'hashed-password', 'setupInitial debe guardar hash')

  console.log('  ✓ testSetupInitial')
}

async function testSetupInitialTwice() {
  const userRepo = createMockUserRepo()
  const roleRepo = createMockRoleRepo()
  const permRepo = createMockPermissionRepo()
  const settingRepo = createMockSettingRepo()
  const service = new SystemService(userRepo, roleRepo, permRepo, settingRepo)

  userRepo._addUser({ username: 'admin', roleId: 1, active: true })

  try {
    await service.setupInitial({
      username: 'otro',
      passwordHash: 'hash',
      businessName: 'Otra Empresa'
    })
    assert(false, 'setupInitial debe lanzar error si ya fue configurado')
  } catch (error) {
    assert(error.message.includes('configurado'), 'Error debe indicar que ya fue configurado')
  }

  console.log('  ✓ testSetupInitialTwice')
}

async function testEnsureDefaultPermissions() {
  const userRepo = createMockUserRepo()
  const roleRepo = createMockRoleRepo()
  const permRepo = createMockPermissionRepo()
  const settingRepo = createMockSettingRepo()
  const service = new SystemService(userRepo, roleRepo, permRepo, settingRepo)

  await service.ensureDefaultPermissions()

  const allPerms = await permRepo.findAll()
  assert(allPerms.length > 0, 'ensureDefaultPermissions debe crear permisos')
  assert(allPerms.some(p => p.name === 'products.view'), 'Debe incluir products.view')
  assert(allPerms.some(p => p.name === 'users.create'), 'Debe incluir users.create')

  console.log('  ✓ testEnsureDefaultPermissions')
}

async function testSetupInitialPartialRetry() {
  const userRepo = createMockUserRepo()
  const roleRepo = createMockRoleRepo()
  const permRepo = createMockPermissionRepo()
  const settingRepo = createMockSettingRepo()
  const service = new SystemService(userRepo, roleRepo, permRepo, settingRepo)

  // Simulate partial setup: role exists but user doesn't
  roleRepo._addRole({ name: 'Administrador', description: 'Acceso completo al sistema' })
  permRepo._addPerm({ name: 'products.view', description: 'Ver productos' })
  permRepo._addPerm({ name: 'settings.edit', description: 'Editar configuración' })

  const result = await service.setupInitial({
    username: 'admin',
    passwordHash: 'hashed-password',
    businessName: 'Mi Empresa'
  })

  assert(result.username === 'admin', 'setupInitial debe retornar username')
  assert(result.role !== undefined, 'setupInitial debe usar rol existente')

  const user = await userRepo.findByUsername('admin')
  assert(user !== null, 'setupInitial debe crear usuario')
  assert(user.passwordHash === 'hashed-password', 'setupInitial debe guardar hash')

  console.log('  ✓ testSetupInitialPartialRetry')
}

async function testSetupInitialUserUpdate() {
  const userRepo = createMockUserRepo()
  const roleRepo = createMockRoleRepo()
  const permRepo = createMockPermissionRepo()
  const settingRepo = createMockSettingRepo()
  const service = new SystemService(userRepo, roleRepo, permRepo, settingRepo)

  // Simulate partial setup: role exists, user doesn't exist yet
  // (user was deleted or setup failed after role creation)
  roleRepo._addRole({ name: 'Administrador', description: 'Acceso completo al sistema' })
  permRepo._addPerm({ name: 'products.view', description: 'Ver productos' })

  const result = await service.setupInitial({
    username: 'admin',
    passwordHash: 'new-hash',
    businessName: 'Mi Empresa'
  })

  assert(result.username === 'admin', 'setupInitial debe retornar username')

  const user = await userRepo.findByUsername('admin')
  assert(user !== null, 'setupInitial debe crear usuario')
  assert(user.passwordHash === 'new-hash', 'setupInitial debe guardar hash')

  console.log('  ✓ testSetupInitialUserUpdate')
}

async function testGetSystemInfo() {
  const userRepo = createMockUserRepo()
  const roleRepo = createMockRoleRepo()
  const permRepo = createMockPermissionRepo()
  const settingRepo = createMockSettingRepo()
  const service = new SystemService(userRepo, roleRepo, permRepo, settingRepo)

  userRepo._addUser({ username: 'admin', roleId: 1 })
  roleRepo._addRole({ name: 'Administrador' })
  permRepo._addPerm({ name: 'test.perm' })

  const info = await service.getSystemInfo()
  assert(info.userCount === 1, 'getSystemInfo debe contar usuarios')
  assert(info.roleCount === 1, 'getSystemInfo debe contar roles')
  assert(info.permCount === 1, 'getSystemInfo debe contar permisos')

  console.log('  ✓ testGetSystemInfo')
}

export async function runSystemServiceTests() {
  console.log('\n--- SystemService Tests ---\n')

  await testIsFirstRunTrue()
  await testIsFirstRunFalse()
  await testSetupInitial()
  await testSetupInitialTwice()
  await testSetupInitialPartialRetry()
  await testSetupInitialUserUpdate()
  await testEnsureDefaultPermissions()
  await testGetSystemInfo()

  console.log('\n✓ Todos los tests de SystemService pasaron\n')
}
