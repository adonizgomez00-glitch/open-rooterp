import { PluginService } from '../../src/services/PluginService.js'
import { PLUGINS } from '../../src/config/plugins.js'

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

function createMockSettingRepo() {
  const settings = new Map()

  return {
    async get(key) {
      return settings.has(key) ? settings.get(key) : null
    },

    async set(key, value) {
      settings.set(key, value)
      return settings.get(key)
    },

    _set(key, value) { settings.set(key, value) }
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

    async removePermission(roleId, permissionId) {
      const idx = rps.findIndex(x => x.roleId === roleId && x.permissionId === permissionId)
      if (idx === -1) return false
      rps.splice(idx, 1)
      return true
    },

    _addPerm(perm) {
      const p = { id: nextPermId++, ...perm }
      perms.push(p)
      return p
    },

    _addRolePermission(roleId, permissionId) {
      rps.push({ id: nextRpId++, roleId, permissionId })
    },

    _rolePermCount() { return rps.length }
  }
}

function createMockRoleRepo() {
  return {
    async findAll() {
      return [
        { id: 1, name: 'Administrador' },
        { id: 2, name: 'Vendedor' }
      ]
    }
  }
}

function createMockTable(name) {
  const data = [
    { id: 1, name: 'p1' },
    { id: 2, name: 'p2' },
    { id: 3, name: 'p3' }
  ]
  return {
    async clear() { data.length = 0 },
    async toArray() { return [...data] },
    _count() { return data.length }
  }
}

function createMockDb() {
  const products = createMockTable('products')
  const customers = createMockTable('customers')
  const sales = createMockTable('sales')
  const saleItems = createMockTable('saleItems')
  const suppliers = createMockTable('suppliers')
  const purchases = createMockTable('purchases')
  const purchaseItems = createMockTable('purchaseItems')
  const inventoryMovements = createMockTable('inventoryMovements')
  const accounts = createMockTable('accounts')
  const accountingEntries = createMockTable('accountingEntries')
  const users = createMockTable('users')

  const tables = { products, customers, sales, saleItems, suppliers, purchases, purchaseItems, inventoryMovements, accounts, accountingEntries, users }

  const db = {
    products,
    customers,
    sales,
    saleItems,
    suppliers,
    purchases,
    purchaseItems,
    inventoryMovements,
    accounts,
    accountingEntries,
    users,
    transaction(scope, tables, fn) {
      return fn(...tables.filter(t => typeof t === 'object'))
    },
    _tables: tables
  }

  return db
}

async function testIsEnabledDefaultsToTrue() {
  const settingRepo = createMockSettingRepo()
  const db = createMockDb()
  const service = new PluginService({
    settingRepository: settingRepo,
    permissionRepository: createMockPermissionRepo(),
    roleRepository: createMockRoleRepo(),
    db,
    plugins: PLUGINS
  })

  const enabled = await service.isEnabled('products')
  assert(enabled === true, 'isEnabled debe retornar true cuando no hay setting (defaultEnabled: true)')

  console.log('  ✓ testIsEnabledDefaultsToTrue')
}

async function testIsEnabledExplicitlyFalse() {
  const settingRepo = createMockSettingRepo()
  settingRepo._set('module.products.enabled', '0')
  const db = createMockDb()
  const service = new PluginService({
    settingRepository: settingRepo,
    permissionRepository: createMockPermissionRepo(),
    roleRepository: createMockRoleRepo(),
    db,
    plugins: PLUGINS
  })

  const enabled = await service.isEnabled('products')
  assert(enabled === false, 'isEnabled debe retornar false cuando setting es 0')

  console.log('  ✓ testIsEnabledExplicitlyFalse')
}

async function testSetEnabled() {
  const settingRepo = createMockSettingRepo()
  const db = createMockDb()
  const service = new PluginService({
    settingRepository: settingRepo,
    permissionRepository: createMockPermissionRepo(),
    roleRepository: createMockRoleRepo(),
    db,
    plugins: PLUGINS
  })

  await service.setEnabled('products', false)
  assert(await service.isEnabled('products') === false, 'setEnabled(false) deshabilita')

  await service.setEnabled('products', true)
  assert(await service.isEnabled('products') === true, 'setEnabled(true) habilita')

  console.log('  ✓ testSetEnabled')
}

async function testInstall() {
  const settingRepo = createMockSettingRepo()
  settingRepo._set('module.inventory.enabled', '0')
  const db = createMockDb()
  const service = new PluginService({
    settingRepository: settingRepo,
    permissionRepository: createMockPermissionRepo(),
    roleRepository: createMockRoleRepo(),
    db,
    plugins: PLUGINS
  })

  const plugin = await service.install('inventory')
  assert(plugin.id === 'inventory', 'install retorna el plugin')
  assert(await service.isEnabled('inventory') === true, 'install habilita el plugin')

  console.log('  ✓ testInstall')
}

async function testUninstallRequiredThrows() {
  const settingRepo = createMockSettingRepo()
  const db = createMockDb()
  const service = new PluginService({
    settingRepository: settingRepo,
    permissionRepository: createMockPermissionRepo(),
    roleRepository: createMockRoleRepo(),
    db,
    plugins: PLUGINS
  })

  try {
    await service.uninstall('dashboard')
    assert(false, 'uninstall de plugin required debe lanzar error')
  } catch (error) {
    assert(error.message.includes('núcleo'), 'Error debe mencionar núcleo')
  }

  console.log('  ✓ testUninstallRequiredThrows')
}

async function testUninstallBlockedByRequiredPlugin() {
  const settingRepo = createMockSettingRepo()
  settingRepo._set('module.sales.enabled', '1')
  const db = createMockDb()
  const service = new PluginService({
    settingRepository: settingRepo,
    permissionRepository: createMockPermissionRepo(),
    roleRepository: createMockRoleRepo(),
    db,
    plugins: PLUGINS
  })

  try {
    await service.uninstall('products')
    assert(false, 'uninstall debe bloquearse si otro plugin habilitado lo requiere')
  } catch (error) {
    assert(error.message.includes('requieren'), 'Error debe mencionar quienes lo requieren')
    assert(await service.isEnabled('products') === true, 'plugin sigue habilitado tras error')
  }

  console.log('  ✓ testUninstallBlockedByRequiredPlugin')
}

async function testUninstallSuccessClearsTablesAndRevokes() {
  const settingRepo = createMockSettingRepo()
  const permRepo = createMockPermissionRepo()
  const inventoryPerm = permRepo._addPerm({ name: 'inventory.view', description: 'Ver inventario' })
  const roleRepo = createMockRoleRepo()
  const db = createMockDb()
  const service = new PluginService({
    settingRepository: settingRepo,
    permissionRepository: permRepo,
    roleRepository: roleRepo,
    db,
    plugins: PLUGINS
  })

  // 'inventory' is not required and no other enabled plugin requires it
  permRepo._addRolePermission(2, inventoryPerm.id)
  permRepo._addRolePermission(1, inventoryPerm.id)

  const tableCountBefore = db._tables.inventoryMovements._count()
  const rpCountBefore = permRepo._rolePermCount()

  await service.uninstall('inventory')

  assert(await service.isEnabled('inventory') === false, 'plugin deshabilitado tras uninstall')
  assert(db._tables.inventoryMovements._count() === 0, 'tablas del plugin limpiadas')
  assert(tableCountBefore === 3, 'tabla tenía datos antes')
  assert(permRepo._rolePermCount() === rpCountBefore - 1, 'permiso revocado solo al rol no-admin')

  console.log('  ✓ testUninstallSuccessClearsTablesAndRevokes')
}

async function testUninstallNotEnabledDoesNothingSpecial() {
  const settingRepo = createMockSettingRepo()
  const service = new PluginService({
    settingRepository: settingRepo,
    permissionRepository: createMockPermissionRepo(),
    roleRepository: createMockRoleRepo(),
    db: createMockDb(),
    plugins: PLUGINS
  })

  const plugin = await service.uninstall('inventory')
  assert(plugin.id === 'inventory', 'uninstall retorna el plugin')
  assert(await service.isEnabled('inventory') === false, 'plugin deshabilitado')

  console.log('  ✓ testUninstallNotEnabledDoesNothingSpecial')
}

export async function runPluginServiceTests() {
  console.log('\n--- PluginService Tests ---\n')

  await testIsEnabledDefaultsToTrue()
  await testIsEnabledExplicitlyFalse()
  await testSetEnabled()
  await testInstall()
  await testUninstallRequiredThrows()
  await testUninstallBlockedByRequiredPlugin()
  await testUninstallSuccessClearsTablesAndRevokes()
  await testUninstallNotEnabledDoesNothingSpecial()

  console.log('\n✓ Todos los tests de PluginService pasaron\n')
}
