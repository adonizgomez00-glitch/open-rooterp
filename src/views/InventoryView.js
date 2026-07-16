import { Table } from '../components/Table.js'
import { Form } from '../components/Form.js'
import { Modal } from '../components/Modal.js'
import { Toast } from '../components/Toast.js'
import { Loader } from '../components/Loader.js'
import { APP_CONFIG } from '../config/app.js'
import { formatDate } from '../utils/formatters.js'

const STOCK_STATUS = {
  critical: { label: 'Crítico', class: 'status--critical' },
  low: { label: 'Bajo', class: 'status--low' },
  ok: { label: 'OK', class: 'status--ok' }
}

export class InventoryView {
  constructor() {
    this._container = null
    this._stockTable = null
    this._formModal = null
    this._movementsModal = null
    this._loader = new Loader({ message: 'Cargando inventario...' })
    this._onSearchCb = null
    this._onAdjustCb = null
    this._onViewMovementsCb = null
    this._searchTimeout = null
    this._products = []
  }

  render(container) {
    this._container = container
    container.innerHTML = ''

    container.appendChild(this._createToolbar())
    container.appendChild(this._createStockTable())
  }

  _createToolbar() {
    const toolbar = document.createElement('div')
    toolbar.className = 'toolbar'

    const title = document.createElement('h2')
    title.className = 'toolbar__title'
    title.textContent = 'Inventario'

    const searchGroup = document.createElement('div')
    searchGroup.className = 'toolbar__search'

    const searchInput = document.createElement('input')
    searchInput.className = 'toolbar__input'
    searchInput.type = 'text'
    searchInput.placeholder = 'Buscar producto...'
    searchInput.setAttribute('aria-label', 'Buscar en inventario')

    searchInput.addEventListener('input', () => {
      clearTimeout(this._searchTimeout)
      this._searchTimeout = setTimeout(() => {
        if (this._onSearchCb) this._onSearchCb(searchInput.value)
      }, APP_CONFIG.DEBOUNCE_MS)
    })

    searchGroup.appendChild(searchInput)

    const adjustBtn = document.createElement('button')
    adjustBtn.className = 'btn btn--primary'
    adjustBtn.textContent = '+ Ajustar Stock'
    adjustBtn.addEventListener('click', () => {
      if (this._onAdjustCb) this._onAdjustCb()
    })

    toolbar.appendChild(title)
    toolbar.appendChild(searchGroup)
    toolbar.appendChild(adjustBtn)

    return toolbar
  }

  _createStockTable() {
    const wrapper = document.createElement('div')
    wrapper.className = 'inventory-table-wrapper'

    this._stockTable = new Table({
      columns: [
        { key: 'code', label: 'Código', width: '120px' },
        { key: 'name', label: 'Producto' },
        { key: 'category', label: 'Categoría', width: '130px' },
        { key: 'stock', label: 'Stock', width: '90px' },
        { key: 'stockMin', label: 'Stock Mín.', width: '100px' },
        {
          key: 'status',
          label: 'Estado',
          width: '100px',
          sortable: false,
          render: (value) => {
            const info = STOCK_STATUS[value] || STOCK_STATUS.ok
            const span = document.createElement('span')
            span.className = `status-badge ${info.class}`
            span.textContent = info.label
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

            const movementsBtn = document.createElement('button')
            movementsBtn.className = 'btn btn--sm btn--ghost'
            movementsBtn.textContent = 'Movimientos'
            movementsBtn.addEventListener('click', (e) => {
              e.stopPropagation()
              if (this._onViewMovementsCb) this._onViewMovementsCb(row.id)
            })

            group.appendChild(movementsBtn)
            return group
          }
        }
      ],
      emptyMessage: 'No hay productos en el inventario'
    })

    wrapper.appendChild(this._stockTable.render())
    return wrapper
  }

  renderStock(data) {
    this._products = data
    this._stockTable.setData(data)
  }

  showAdjustForm(onSubmit, onCancel) {
    const form = new Form({
      fields: [
        {
          name: 'productId',
          label: 'Producto',
          type: 'select',
          required: true,
          placeholder: 'Seleccione un producto...',
          options: this._products.map(p => ({ value: p.id, label: `[${p.code}] ${p.name} (Stock: ${p.stock})` }))
        },
        {
          name: 'type',
          label: 'Tipo de Ajuste',
          type: 'select',
          required: true,
          placeholder: 'Seleccione tipo...',
          options: [
            { value: 'entry', label: 'Entrada' },
            { value: 'exit', label: 'Salida' },
            { value: 'adjustment', label: 'Ajuste' }
          ]
        },
        { name: 'quantity', label: 'Cantidad', type: 'number', required: true, placeholder: '0', min: 0, step: 1 },
        { name: 'notes', label: 'Notas', type: 'textarea', placeholder: 'Motivo del ajuste (opcional)', rows: 2 }
      ],
      onSubmit: (data) => {
        onSubmit({
          productId: Number(data.productId),
          type: data.type,
          quantity: Number(data.quantity),
          notes: data.notes
        })
      },
      submitText: 'Registrar Ajuste',
      cancelText: 'Cancelar',
      onCancel
    })

    form.render()

    this._formModal = new Modal({
      title: 'Ajuste de Stock',
      content: form._element,
      size: 'sm'
    })

    this._formModal.open()
  }

  closeForm() {
    if (this._formModal) {
      this._formModal.close()
      this._formModal = null
    }
  }

  showMovementsModal(product, movements, onClose) {
    const body = document.createElement('div')

    const productInfo = document.createElement('div')
    productInfo.className = 'movements-product-info'
    const name = document.createElement('h3')
    name.textContent = `${product.code} - ${product.name}`
    productInfo.appendChild(name)
    body.appendChild(productInfo)

    if (!movements || movements.length === 0) {
      const empty = document.createElement('p')
      empty.className = 'table__empty'
      empty.textContent = 'No hay movimientos registrados para este producto'
      body.appendChild(empty)
    } else {
      const wrapper = document.createElement('div')
      wrapper.className = 'movements-table-wrapper'
      const table = document.createElement('table')
      table.className = 'table'

      const thead = document.createElement('thead')
      thead.className = 'table__head'
      const htr = document.createElement('tr')
      ;['Fecha', 'Tipo', 'Cantidad', 'Stock Anterior', 'Stock Nuevo', 'Notas'].forEach(t => {
        const th = document.createElement('th')
        th.className = 'table__th'
        th.textContent = t
        htr.appendChild(th)
      })
      thead.appendChild(htr)
      table.appendChild(thead)

      const typeLabels = { entry: 'Entrada', exit: 'Salida', adjustment: 'Ajuste', sale: 'Venta', purchase: 'Compra' }
      const tbody = document.createElement('tbody')
      for (const m of movements) {
        const row = document.createElement('tr')
        row.className = 'table__row'
        const cells = [formatDate(m.date), '', String(m.quantity > 0 ? '+' : '') + m.quantity, String(m.stockBefore), String(m.stockAfter), m.notes || '-']
        cells.forEach((text, ci) => {
          const td = document.createElement('td')
          td.className = 'table__td'
          if (ci === 1) {
            const span = document.createElement('span')
            span.className = `movement-type movement-type--${m.type}`
            span.textContent = typeLabels[m.type] || m.type
            td.appendChild(span)
          } else if (ci === 2) {
            td.className = `table__td movement-qty movement-qty--${m.quantity > 0 ? 'positive' : 'negative'}`
            td.textContent = text
          } else {
            td.textContent = text
          }
          row.appendChild(td)
        })
        tbody.appendChild(row)
      }
      table.appendChild(tbody)
      wrapper.appendChild(table)
      body.appendChild(wrapper)
    }

    this._movementsModal = new Modal({
      title: 'Historial de Movimientos',
      content: body,
      size: 'lg',
      closable: true
    })
    this._movementsModal.onClose = () => { this._movementsModal = null; if (onClose) onClose() }
    this._movementsModal.open()
  }

  closeMovementsModal() {
    if (this._movementsModal) {
      this._movementsModal.close()
      this._movementsModal = null
    }
  }

  onSearch(callback) { this._onSearchCb = callback }
  onAdjust(callback) { this._onAdjustCb = callback }
  onViewMovements(callback) { this._onViewMovementsCb = callback }

  showLoading() { this._loader.show() }
  hideLoading() { this._loader.hide() }

  showSaving() {
    const btn = document.querySelector('.modal .btn--primary')
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...' }
  }

  hideSaving() {
    const btn = document.querySelector('.modal .btn--primary')
    if (btn) { btn.disabled = false; btn.textContent = 'Registrar Ajuste' }
  }

  showSuccess(message) { Toast.success(message) }
  showError(message) { Toast.error(message) }
}
