import { Table } from '../components/Table.js'
import { Form } from '../components/Form.js'
import { Modal } from '../components/Modal.js'
import { ConfirmDialog } from '../components/ConfirmDialog.js'
import { Toast } from '../components/Toast.js'
import { Loader } from '../components/Loader.js'
import { formatCurrency } from '../utils/formatters.js'
import { APP_CONFIG } from '../config/app.js'

export class ProductView {
  constructor() {
    this._container = null
    this._table = null
    this._formModal = null
    this._loader = new Loader({ message: 'Cargando productos...' })
    this._onSearchCb = null
    this._onCreateCb = null
    this._onEditCb = null
    this._onDeleteCb = null
    this._searchTimeout = null
    this._currentData = []
  }

  render(container) {
    this._container = container
    container.innerHTML = ''

    const toolbar = this._createToolbar()
    container.appendChild(toolbar)

    const tableWrapper = document.createElement('div')
    tableWrapper.className = 'product-table-wrapper'
    container.appendChild(tableWrapper)

    this._table = new Table({
      columns: this._getColumns(),
      emptyMessage: 'No hay productos registrados'
    })

    tableWrapper.appendChild(this._table.render())
  }

  _createToolbar() {
    const toolbar = document.createElement('div')
    toolbar.className = 'toolbar'

    const title = document.createElement('h2')
    title.className = 'toolbar__title'
    title.textContent = 'Productos'

    const searchGroup = document.createElement('div')
    searchGroup.className = 'toolbar__search'

    const searchInput = document.createElement('input')
    searchInput.className = 'toolbar__input'
    searchInput.type = 'text'
    searchInput.placeholder = 'Buscar por código, nombre o categoría...'
    searchInput.setAttribute('aria-label', 'Buscar productos')

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
    createBtn.textContent = '+ Nuevo Producto'
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
      { key: 'code', label: 'Código', width: '120px' },
      { key: 'name', label: 'Nombre' },
      { key: 'category', label: 'Categoría', width: '130px' },
      {
        key: 'salePrice',
        label: 'Precio Venta',
        width: '120px',
        render: (value) => formatCurrency(value)
      },
      {
        key: 'stock',
        label: 'Stock',
        width: '90px',
        render: (value, row) => {
          const span = document.createElement('span')
          span.textContent = value
          if (row.stockMin && value <= row.stockMin) {
            span.className = 'stock-warning'
          }
          return span
        }
      },
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

  renderProducts(products) {
    this._currentData = products
    this._table.setData(products)
  }

  showForm(product, onSubmit, onCancel) {
    const isEditing = !!product
    const form = new Form({
      fields: [
        { name: 'code', label: 'Código', type: 'text', required: true, readonly: true, value: this.nextCode || '', placeholder: 'Ej: PROD-001' },
        { name: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Nombre del producto' },
        { name: 'description', label: 'Descripción', type: 'textarea', placeholder: 'Descripción opcional', rows: 3 },
        { name: 'category', label: 'Categoría', type: 'text', placeholder: 'Ej: Electrónica' },
        { name: 'purchasePrice', label: 'Precio de Compra', type: 'number', placeholder: '0.00', min: 0 },
        { name: 'salePrice', label: 'Precio de Venta', type: 'number', placeholder: '0.00', min: 0 },
        { name: 'stock', label: 'Stock Actual', type: 'number', placeholder: '0', min: 0 },
        { name: 'stockMin', label: 'Stock Mínimo', type: 'number', placeholder: '0', min: 0 }
      ],
      onSubmit: (data) => {
        const parsed = {
          ...data,
          purchasePrice: Number(data.purchasePrice ?? 0),
          salePrice: Number(data.salePrice ?? 0),
          stock: Number(data.stock ?? 0),
          stockMin: Number(data.stockMin ?? 0)
        }
        onSubmit(parsed)
      },
      submitText: isEditing ? 'Actualizar' : 'Guardar',
      cancelText: 'Cancelar',
      onCancel
    })

    form.render()

    if (isEditing) {
      form.setValues({
        code: product.code,
        name: product.name,
        description: product.description,
        category: product.category,
        purchasePrice: product.purchasePrice,
        salePrice: product.salePrice,
        stock: product.stock,
        stockMin: product.stockMin
      })
    }

    this._formModal = new Modal({
      title: isEditing ? 'Editar Producto' : 'Nuevo Producto',
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
      title: 'Eliminar Producto',
      message: '¿Está seguro de eliminar este producto? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true
    })

    return dialog.confirm()
  }
}
