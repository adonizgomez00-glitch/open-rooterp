import { UserController } from '../../src/controllers/UserController.js'

function createMockUserRepo() {
  const users = []
  let nextId = 1

  return {
    async findAll() { return users.map(u => ({ ...u, passwordHash: undefined })) },

    async findById(id) {
      const u = users.find(x => x.id === id)
      return u ? { ...u } : null
    },

    async findByUsername(username) {
      return users.find(x => x.username === username) || null
    },

    async create(data) {
      const u = { id: nextId++, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      users.push(u)
      return { ...u }
    },

    async update(id, data) {
      const idx = users.findIndex(x => x.id === id)
      if (idx === -1) throw new Error('No encontrado')
      users[idx] = { ...users[idx], ...data }
      return { ...users[idx] }
    },

    async delete(id) {
      const idx = users.findIndex(x => x.id === id)
      if (idx === -1) throw new Error('No encontrado')
      users.splice(idx, 1)
      return true
    },

    _add(data) {
      const u = { id: nextId++, ...data }
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

    async findById(id) {
      return roles.find(x => x.id === id) || null
    },

    _add(data) {
      const r = { id: nextId++, ...data }
      roles.push(r)
      return r
    }
  }
}

function createMockPasswordService() {
  return {
    async hash(password) { return 'hashed:' + password },
    async verify(password, stored) { return stored === 'hashed:' + password },
    needsRehash() { return false }
  }
}

function createMockView() {
  let saveCb = null

  return {
    rendered: false,
    usersData: null,
    rolesData: null,
    errorMessage: null,
    successMessage: null,
    formOpened: false,
    formClosed: false,
    savingState: false,
    loadingState: false,
    confirmed: false,
    _permissions: null,
    lastFormUser: null,

    reset() {
      this.rendered = false
      this.usersData = null
      this.rolesData = null
      this.errorMessage = null
      this.successMessage = null
      this.formOpened = false
      this.formClosed = false
      this.savingState = false
      this.loadingState = false
    },

    render(container, permissions) {
      this.rendered = true
      this._permissions = permissions
      this._container = container
    },

    renderUsers(users, roles) {
      this.usersData = users
      this.rolesData = roles
    },

    showForm(user, onSave) {
      this.formOpened = true
      this.lastFormUser = user
      saveCb = onSave
    },

    closeForm() { this.formClosed = true },

    showLoading() { this.loadingState = true },
    hideLoading() { this.loadingState = false },
    showSaving() { this.savingState = true },
    hideSaving() { this.savingState = false },

    showSuccess(msg) { this.successMessage = msg },
    showError(msg) { this.errorMessage = msg },

    async confirmDelete() { return this.confirmed },

    triggerSave(data) { if (saveCb) saveCb(data) },

    onCreate(cb) { this._createCb = cb },
    onEdit(cb) { this._editCb = cb },
    onDelete(cb) { this._deleteCb = cb }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

const fullPermissions = {
  canCreateUsers: true,
  canEditUsers: true,
  canDeleteUsers: true,
  canViewUsers: true,
  isAdmin: true
}

const restrictedPermissions = {
  canCreateUsers: false,
  canEditUsers: false,
  canDeleteUsers: false,
  canViewUsers: false,
  isAdmin: false
}

async function testInitLoadsUsers() {
  const userRepo = createMockUserRepo()
  const roleRepo = createMockRoleRepo()
  const passwordService = createMockPasswordService()
  const view = createMockView()
  const controller = new UserController(userRepo, roleRepo, passwordService, view, fullPermissions)

  roleRepo._add({ name: 'Administrador' })
  roleRepo._add({ name: 'Vendedor' })
  userRepo._add({ username: 'admin', roleId: 1, active: true })
  userRepo._add({ username: 'jperez', roleId: 2, active: true })

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.rendered, 'init debería hacer render')
  assert(view.usersData !== null, 'init debería cargar usuarios')
  assert(view.usersData.length === 2, 'init debería cargar 2 usuarios')

  console.log('  ✓ testInitLoadsUsers')
}

async function testHandleSaveCreate() {
  const userRepo = createMockUserRepo()
  const roleRepo = createMockRoleRepo()
  const passwordService = createMockPasswordService()
  const view = createMockView()
  const controller = new UserController(userRepo, roleRepo, passwordService, view, fullPermissions)

  roleRepo._add({ name: 'Administrador' })

  const container = document.createElement('div')
  await controller.init(container)

  controller._editingId = null
  await controller.handleSave({ username: 'nuevo', password: 'pass123', roleId: 1, active: true })

  assert(view.successMessage !== null, 'handleSave debería mostrar éxito para creación')
  assert(view.formClosed, 'handleSave debería cerrar formulario')
  const users = await userRepo.findAll()
  assert(users.length === 1, 'handleSave debería crear usuario')

  console.log('  ✓ testHandleSaveCreate')
}

async function testHandleSaveCreateRestricted() {
  const userRepo = createMockUserRepo()
  const roleRepo = createMockRoleRepo()
  const passwordService = createMockPasswordService()
  const view = createMockView()
  const controller = new UserController(userRepo, roleRepo, passwordService, view, restrictedPermissions)

  const container = document.createElement('div')
  await controller.init(container)

  controller._editingId = null
  await controller.handleSave({ username: 'nuevo', password: 'pass123', roleId: 1, active: true })

  assert(view.errorMessage !== null, 'handleSave debería mostrar error de permiso')
  assert(view.errorMessage.includes('permiso'), 'El error debe mencionar permiso')

  console.log('  ✓ testHandleSaveCreateRestricted')
}

async function testShowEditForm() {
  const userRepo = createMockUserRepo()
  const roleRepo = createMockRoleRepo()
  const passwordService = createMockPasswordService()
  const view = createMockView()
  const controller = new UserController(userRepo, roleRepo, passwordService, view, fullPermissions)

  roleRepo._add({ name: 'Administrador' })
  userRepo._add({ username: 'admin', roleId: 1, active: true })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.showEditForm(1)

  assert(view.formOpened, 'showEditForm debería abrir el formulario')
  assert(view.lastFormUser !== null, 'showEditForm debería pasar el usuario')

  console.log('  ✓ testShowEditForm')
}

async function testHandleSaveEdit() {
  const userRepo = createMockUserRepo()
  const roleRepo = createMockRoleRepo()
  const passwordService = createMockPasswordService()
  const view = createMockView()
  const controller = new UserController(userRepo, roleRepo, passwordService, view, fullPermissions)

  roleRepo._add({ name: 'Administrador' })
  userRepo._add({ username: 'admin', roleId: 1, active: true })

  const container = document.createElement('div')
  await controller.init(container)

  controller._editingId = 1
  await controller.handleSave({ roleId: 1, active: true, password: '' })

  assert(view.successMessage !== null, 'handleSave debería mostrar éxito para edición')
  assert(view.formClosed, 'handleSave debería cerrar formulario')

  console.log('  ✓ testHandleSaveEdit')
}

async function testHandleDelete() {
  const userRepo = createMockUserRepo()
  const roleRepo = createMockRoleRepo()
  const passwordService = createMockPasswordService()
  const view = createMockView()
  const controller = new UserController(userRepo, roleRepo, passwordService, view, fullPermissions)

  userRepo._add({ username: 'admin', roleId: 1, active: true })

  const container = document.createElement('div')
  await controller.init(container)

  view.confirmed = true
  await controller.handleDelete(1)

  assert(view.successMessage !== null, 'handleDelete debería mostrar éxito')
  const users = await userRepo.findAll()
  assert(users.length === 0, 'handleDelete debería eliminar usuario')

  console.log('  ✓ testHandleDelete')
}

async function testHandleDeleteRestricted() {
  const userRepo = createMockUserRepo()
  const roleRepo = createMockRoleRepo()
  const passwordService = createMockPasswordService()
  const view = createMockView()
  const controller = new UserController(userRepo, roleRepo, passwordService, view, restrictedPermissions)

  userRepo._add({ username: 'admin', roleId: 1, active: true })

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleDelete(1)

  assert(view.errorMessage !== null, 'handleDelete debería mostrar error de permiso')
  assert(view.errorMessage.includes('permiso'), 'El error debe mencionar permiso')

  console.log('  ✓ testHandleDeleteRestricted')
}

export async function runUserControllerTests() {
  console.log('\n--- UserController Tests ---\n')

  await testInitLoadsUsers()
  await testHandleSaveCreate()
  await testHandleSaveCreateRestricted()
  await testShowEditForm()
  await testHandleSaveEdit()
  await testHandleDelete()
  await testHandleDeleteRestricted()

  console.log('\n✓ Todos los tests de UserController pasaron\n')
}
