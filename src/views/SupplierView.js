import { Table } from '../components/Table.js'
import { Form } from '../components/Form.js'
import { Modal } from '../components/Modal.js'
import { ConfirmDialog } from '../components/ConfirmDialog.js'
import { Toast } from '../components/Toast.js'
import { Loader } from '../components/Loader.js'
import { APP_CONFIG } from '../config/app.js'

export class SupplierView {
  constructor() {
    this._container = null
    this._table = null
    this._formModal = null
    this._loader = new Loader({ message: 'Cargando proveedores...' })
    this._onSearchCb = null
    this._onCreateCb = null
    this._onEditCb = null
    this._onDeleteCb = null
    this._searchTimeout = null
  }

  render(container) {
    this._container = container
    container.innerHTML = ''

    const toolbar = this._createToolbar()
    container.appendChild(toolbar)

    const tableWrapper = document.createElement('div')
    tableWrapper.className = 'supplier-table-wrapper'
    container.appendChild(tableWrapper)

    this._table = new Table({
      columns: this._getColumns(),
      emptyMessage: 'No hay proveedores registrados'
    })

    tableWrapper.appendChild(this._table.render())
  }

  _createToolbar() {
    const toolbar = document.createElement('div')
    toolbar.className = 'toolbar'

    const title = document.createElement('h2')
    title.className = 'toolbar__title'
    title.textContent = 'Proveedores'

    const searchGroup = document.createElement('div')
    searchGroup.className = 'toolbar__search'

    const searchInput = document.createElement('input')
    searchInput.className = 'toolbar__input'
    searchInput.type = 'text'
    searchInput.placeholder = 'Buscar por nombre, documento o email...'
    searchInput.setAttribute('aria-label', 'Buscar proveedores')

    searchInput.addEventListener('input', () => {
      clearTimeout(this._searchTimeout)
      this._searchTimeout = setTimeout(() => {
        if (this._onSearchCb) {
          this._onSearchCb(searchInput.value)
        }
      }, APP_CONFIG.DEBOUNCE_MS)
    })

    searchGroup.appendChild(searchInput)

    const createBtn = document.createElement('button')
    createBtn.className = 'btn btn--primary'
    createBtn.textContent = '+ Nuevo Proveedor'
    createBtn.addEventListener('click', () => {
      if (this._onCreateCb) this._onCreateCb()
    })

    toolbar.appendChild(title)
    toolbar.appendChild(searchGroup)
    toolbar.appendChild(createBtn)

    return toolbar
  }

  _getColumns() {
    return [
      { key: 'documentId', label: 'Documento', width: '130px' },
      { key: 'name', label: 'Nombre' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Teléfono', width: '130px' },
      {
        key: 'id',
        label: 'Acciones',
        width: '140px',
        sortable: false,
        render: (value, row) => {
          const group = document.createElement('div')
          group.className = 'table-actions'

          const editBtn = document.createElement('button')
          editBtn.className = 'btn btn--sm btn--ghost'
          editBtn.textContent = 'Editar'
          editBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            if (this._onEditCb) this._onEditCb(row.id)
          })

          const deleteBtn = document.createElement('button')
          deleteBtn.className = 'btn btn--sm btn--ghost'
          deleteBtn.textContent = 'Eliminar'
          deleteBtn.className = 'btn btn--sm btn--ghost-danger'
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            if (this._onDeleteCb) this._onDeleteCb(row.id)
          })

          group.appendChild(editBtn)
          group.appendChild(deleteBtn)
          return group
        }
      }
    ]
  }

  renderSuppliers(suppliers) {
    this._table.setData(suppliers)
  }

  showForm(supplier, onSubmit, onCancel) {
    const isEditing = !!supplier
    const form = new Form({
      fields: [
        { name: 'documentId', label: 'Documento', type: 'text', required: true, readonly: true, value: this.nextDocId || '', placeholder: 'Ej: PROV-001' },
        { name: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Razón social o nombre' },
        { name: 'email', label: 'Email', type: 'email', placeholder: 'proveedor@email.com' },
        { name: 'phone', label: 'Teléfono', type: 'text', placeholder: 'Ej: 5555-0101' },
        { name: 'address', label: 'Dirección', type: 'textarea', placeholder: 'Dirección completa', rows: 3 }
      ],
      onSubmit,
      submitText: isEditing ? 'Actualizar' : 'Guardar',
      cancelText: 'Cancelar',
      onCancel
    })

    form.render()

    if (isEditing) {
      form.setValues({
        documentId: supplier.documentId,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address
      })
    }

    this._formModal = new Modal({
      title: isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor',
      content: form._element,
      size: 'md'
    })

    this._formModal.open()
  }

  closeForm() {
    if (this._formModal) {
      this._formModal.close()
      this._formModal = null
    }
  }

  onSearch(callback) {
    this._onSearchCb = callback
  }

  onCreate(callback) {
    this._onCreateCb = callback
  }

  onEdit(callback) {
    this._onEditCb = callback
  }

  onDelete(callback) {
    this._onDeleteCb = callback
  }

  showLoading() {
    this._loader.show()
  }

  hideLoading() {
    this._loader.hide()
  }

  showSaving() {
    const btn = document.querySelector('.modal .btn--primary')
    if (btn) {
      btn.disabled = true
      btn.textContent = 'Guardando...'
    }
  }

  hideSaving() {
    const btn = document.querySelector('.modal .btn--primary')
    if (btn) {
      btn.disabled = false
      btn.textContent = this._formModal?._title?.includes('Editar') ? 'Actualizar' : 'Guardar'
    }
  }

  showSuccess(message) {
    Toast.success(message)
  }

  showError(message) {
    Toast.error(message)
  }

  async confirmDelete() {
    const dialog = new ConfirmDialog({
      title: 'Eliminar Proveedor',
      message: '¿Está seguro de eliminar este proveedor? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true
    })

    return dialog.confirm()
  }
}
