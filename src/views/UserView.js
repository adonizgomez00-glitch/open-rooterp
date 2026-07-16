import { Table } from '../components/Table.js'
import { Modal } from '../components/Modal.js'
import { Form } from '../components/Form.js'
import { ConfirmDialog } from '../components/ConfirmDialog.js'
import { Toast } from '../components/Toast.js'
import { Loader } from '../components/Loader.js'

export class UserView {
  constructor() {
    this._container = null
    this._usersTable = null
    this._formModal = null
    this._loader = new Loader({ message: 'Cargando usuarios...' })
    this._onCreateCb = null
    this._onEditCb = null
    this._onDeleteCb = null
    this._permissions = null
    this._roles = []
  }

  render(container, permissions) {
    this._container = container
    this._permissions = permissions
    container.innerHTML = ''

    const toolbar = document.createElement('div')
    toolbar.className = 'toolbar'
    const title = document.createElement('h2')
    title.className = 'toolbar__title'
    title.textContent = 'Usuarios'
    toolbar.appendChild(title)

    if (permissions.canCreateUsers) {
      const createBtn = document.createElement('button')
      createBtn.className = 'btn btn--primary'
      createBtn.textContent = '+ Nuevo Usuario'
      createBtn.addEventListener('click', () => {
        if (this._onCreateCb) this._onCreateCb(null)
      })
      toolbar.appendChild(createBtn)
    }

    container.appendChild(toolbar)

    const wrapper = document.createElement('div')
    wrapper.className = 'users-table-wrapper'

    this._usersTable = new Table({
      columns: [
        { key: 'id', label: 'ID', width: '60px' },
        { key: 'username', label: 'Usuario' },
        { key: 'roleName', label: 'Rol' },
        {
          key: 'active', label: 'Estado', width: '100px',
          render: (v) => {
            const span = document.createElement('span')
            span.className = `status-badge ${v ? 'status--ok' : 'status--critical'}`
            span.textContent = v ? 'Activo' : 'Inactivo'
            return span
          }
        },
        {
          key: 'lastLogin', label: 'Último Acceso', width: '160px',
          render: (v) => v ? new Date(v).toLocaleString('es-GT') : '—'
        },
        {
          key: 'id', label: 'Acciones', width: '160px', sortable: false,
          render: (value, row) => {
            const group = document.createElement('div')
            group.className = 'table-actions'

            if (permissions.canEditUsers) {
              const editBtn = document.createElement('button')
              editBtn.className = 'btn btn--sm btn--ghost'
              editBtn.textContent = 'Editar'
              editBtn.addEventListener('click', (e) => {
                e.stopPropagation()
                if (this._onEditCb) this._onEditCb(row.id)
              })
              group.appendChild(editBtn)
            }

            if (permissions.canDeleteUsers) {
              const deleteBtn = document.createElement('button')
              deleteBtn.className = 'btn btn--sm btn--ghost-danger'
              deleteBtn.textContent = 'Eliminar'
              deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation()
                if (this._onDeleteCb) this._onDeleteCb(row.id)
              })
              group.appendChild(deleteBtn)
            }

            return group
          }
        }
      ],
      emptyMessage: 'No hay usuarios registrados'
    })

    wrapper.appendChild(this._usersTable.render())
    container.appendChild(wrapper)
  }

  renderUsers(users, roles) {
    this._roles = roles
    const data = users.map(u => {
      const role = roles.find(r => r.id === u.roleId)
      return { ...u, roleName: role ? role.name : '—', passwordHash: undefined }
    })
    this._usersTable.setData(data)
  }

  showForm(user, onSave) {
    const isEdit = !!user
    const roleOptions = this._roles.map(r => ({ value: r.id, label: r.name }))

    const fields = [
      {
        name: 'username', label: 'Nombre de Usuario', type: 'text',
        placeholder: 'Ej: jperez', required: true
      },
      {
        name: 'password', label: isEdit ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña',
        type: 'password', placeholder: isEdit ? '••••••••' : 'Mínimo 8 caracteres',
        minlength: 8, required: !isEdit
      },
      {
        name: 'roleId', label: 'Rol', type: 'select',
        options: roleOptions, required: true
      },
      {
        name: 'active', label: 'Activo', type: 'select',
        options: [{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }],
        required: true
      }
    ]

    if (isEdit) {
      const activeField = fields.find(f => f.name === 'active')
      if (activeField) activeField.value = user.active ? 'true' : 'false'
      const roleField = fields.find(f => f.name === 'roleId')
      if (roleField) roleField.value = user.roleId
    }

    const form = new Form({
      fields,
      submitText: isEdit ? 'Actualizar Usuario' : 'Crear Usuario',
      cancelText: 'Cancelar',
      onCancel: () => this.closeForm(),
      onSubmit: (data) => {
        const parsed = { ...data }
        if (parsed.active === 'true' || parsed.active === true) parsed.active = true
        else parsed.active = false
        parsed.roleId = Number(parsed.roleId)
        if (onSave) onSave(parsed)
      }
    })

    const content = document.createElement('div')
    content.appendChild(form.render())

    this._formModal = new Modal({
      title: isEdit ? 'Editar Usuario' : 'Nuevo Usuario',
      content,
      size: 'sm',
      closable: true
    })

    this._formModal.open()
  }

  closeForm() {
    if (this._formModal) { this._formModal.close(); this._formModal = null }
  }

  async confirmDelete() {
    const dialog = new ConfirmDialog({
      title: 'Eliminar Usuario',
      message: '¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true
    })
    return dialog.confirm()
  }

  onCreate(cb) { this._onCreateCb = cb }
  onEdit(cb) { this._onEditCb = cb }
  onDelete(cb) { this._onDeleteCb = cb }

  showLoading() { this._loader.show() }
  hideLoading() { this._loader.hide() }
  showSaving() { this._loader.show() }
  hideSaving() { this._loader.hide() }
  showSuccess(m) { Toast.success(m) }
  showError(m) { Toast.error(m) }
}
