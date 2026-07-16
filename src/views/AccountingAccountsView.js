import { Table } from '../components/Table.js'
import { Form } from '../components/Form.js'
import { Modal } from '../components/Modal.js'
import { ConfirmDialog } from '../components/ConfirmDialog.js'

const ACCOUNT_TYPE_LABELS = {
  asset: 'Activo',
  liability: 'Pasivo',
  equity: 'Patrimonio',
  income: 'Ingreso',
  expense: 'Gasto'
}

export class AccountingAccountsView {
  constructor() {
    this._accountFormModal = null
  }

  render(container, accounts, { onCreate, onEdit, onDelete }) {
    container.innerHTML = ''

    const toolbar = document.createElement('div')
    toolbar.className = 'toolbar mb-1'

    const createBtn = document.createElement('button')
    createBtn.className = 'btn btn--primary'
    createBtn.textContent = '+ Nueva Cuenta'
    createBtn.addEventListener('click', () => {
      if (onCreate) onCreate()
    })

    toolbar.appendChild(createBtn)
    container.appendChild(toolbar)

    const table = new Table({
      columns: [
        { key: 'code', label: 'Código', width: '80px' },
        { key: 'name', label: 'Nombre' },
        {
          key: 'type', label: 'Tipo', width: '120px',
          render: (v) => ACCOUNT_TYPE_LABELS[v] || v
        },
        { key: 'description', label: 'Descripción' },
        {
          key: 'active', label: 'Activo', width: '80px',
          render: (v) => {
            const span = document.createElement('span')
            span.className = `status-badge ${v ? 'status--ok' : 'status--critical'}`
            span.textContent = v ? 'Sí' : 'No'
            return span
          }
        },
        {
          key: 'id', label: 'Acciones', width: '140px', sortable: false,
          render: (value, row) => {
            const group = document.createElement('div')
            group.className = 'table-actions'

            const editBtn = document.createElement('button')
            editBtn.className = 'btn btn--sm btn--ghost'
            editBtn.textContent = 'Editar'
            editBtn.addEventListener('click', (e) => {
              e.stopPropagation()
              if (onEdit) onEdit(row.id)
            })

            const deleteBtn = document.createElement('button')
            deleteBtn.className = 'btn btn--sm btn--ghost-danger'
            deleteBtn.textContent = 'Eliminar'
            deleteBtn.addEventListener('click', (e) => {
              e.stopPropagation()
              if (onDelete) onDelete(row.id)
            })

            group.appendChild(editBtn)
            group.appendChild(deleteBtn)
            return group
          }
        }
      ],
      emptyMessage: 'No hay cuentas contables registradas'
    })

    table.setData(accounts)
    container.appendChild(table.render())
  }

  showForm(container, account, onSubmit, onCancel) {
    const isEditing = !!account

    const form = new Form({
      fields: [
        { name: 'code', label: 'Código', type: 'text', required: true, readonly: isEditing, placeholder: 'Ej: 1101', minlength: 4, maxlength: 4 },
        { name: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Ej: Caja y Bancos' },
        {
          name: 'type', label: 'Tipo', type: 'select', required: true,
          placeholder: 'Seleccione un tipo',
          options: [
            { value: 'asset', label: 'Activo' },
            { value: 'liability', label: 'Pasivo' },
            { value: 'equity', label: 'Patrimonio' },
            { value: 'income', label: 'Ingreso' },
            { value: 'expense', label: 'Gasto' }
          ]
        },
        { name: 'description', label: 'Descripción', type: 'textarea', placeholder: 'Descripción opcional', rows: 3 }
      ],
      onSubmit: (data) => onSubmit(data),
      submitText: isEditing ? 'Actualizar' : 'Guardar',
      cancelText: 'Cancelar',
      onCancel
    })

    form.render()

    if (isEditing) {
      form.setValues({
        code: account.code,
        name: account.name,
        type: account.type,
        description: account.description
      })
    }

    this._accountFormModal = new Modal({
      title: isEditing ? 'Editar Cuenta Contable' : 'Nueva Cuenta Contable',
      content: form._element,
      size: 'md'
    })

    this._accountFormModal.open()
  }

  closeForm() {
    if (this._accountFormModal) {
      this._accountFormModal.close()
      this._accountFormModal = null
    }
  }

  async confirmDelete() {
    const dialog = new ConfirmDialog({
      title: 'Eliminar Cuenta Contable',
      message: '¿Está seguro de eliminar esta cuenta? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true
    })
    return dialog.confirm()
  }
}
