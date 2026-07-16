import { handleError } from '../utils/errors.js'

export class UserController {
  constructor(userRepository, roleRepository, passwordService, userView, permissions) {
    this._userRepo = userRepository
    this._roleRepo = roleRepository
    this._passwordService = passwordService
    this._view = userView
    this._permissions = permissions
    this._editingId = null
  }

  async init(container) {
    this._view.render(container, this._permissions)
    this._view.onCreate(() => this.showCreateForm())
    this._view.onEdit((id) => this.showEditForm(id))
    this._view.onDelete((id) => this.handleDelete(id))
    await this.loadUsers()
  }

  async loadUsers() {
    this._view.showLoading()
    try {
      let roles = await this._roleRepo.findAll()
      if (!roles.find(r => r.name === 'Vendedor')) {
        await this._roleRepo.create({ name: 'Vendedor', description: 'Acceso limitado: ver, crear, editar y exportar. No puede eliminar, anular ventas/compras, importar ni gestionar usuarios.' })
        roles = await this._roleRepo.findAll()
      }
      const [users] = await Promise.all([this._userRepo.findAll()])
      const ALLOWED_ROLES = ['Administrador', 'Vendedor']
      const filtered = roles.filter(r => ALLOWED_ROLES.includes(r.name))
      this._view.renderUsers(users, filtered)
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async showCreateForm() {
    this._editingId = null
    this._view.showForm(null, (data) => this.handleSave(data))
  }

  async showEditForm(id) {
    if (this._permissions.canEditUsers === false) {
      this._view.showError('No tienes permiso para editar usuarios')
      return
    }
    this._view.showLoading()
    try {
      const user = await this._userRepo.findById(id)
      if (!user) {
        this._view.showError('Usuario no encontrado')
        return
      }
      this._editingId = id
      this._view.showForm(user, (data) => this.handleSave(data))
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleSave(data) {
    const isEdit = this._editingId !== null
    if (isEdit && this._permissions.canEditUsers === false) {
      this._view.showError('No tienes permiso para editar usuarios')
      return
    }
    if (!isEdit && this._permissions.canCreateUsers === false) {
      this._view.showError('No tienes permiso para crear usuarios')
      return
    }
    this._view.showSaving()
    try {
      if (isEdit) {
        const updateData = { username: data.username, roleId: data.roleId, active: data.active }
        if (data.password && data.password.trim()) {
          updateData.passwordHash = await this._passwordService.hash(data.password)
        }
        await this._userRepo.update(this._editingId, updateData)
        this._view.showSuccess('Usuario actualizado correctamente')
      } else {
        const passwordHash = await this._passwordService.hash(data.password)
        await this._userRepo.create({
          username: data.username,
          passwordHash,
          roleId: data.roleId,
          active: true
        })
        this._view.showSuccess('Usuario creado correctamente')
      }
      this._view.closeForm()
      await this.loadUsers()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideSaving()
    }
  }

  async handleDelete(id) {
    if (this._permissions.canDeleteUsers === false) {
      this._view.showError('No tienes permiso para eliminar usuarios')
      return
    }
    const confirmed = await this._view.confirmDelete()
    if (!confirmed) return
    this._view.showLoading()
    try {
      await this._userRepo.delete(id)
      this._view.showSuccess('Usuario eliminado correctamente')
      await this.loadUsers()
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }
}
