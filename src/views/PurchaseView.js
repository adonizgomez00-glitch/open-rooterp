import { Table } from '../components/Table.js'
import { Modal } from '../components/Modal.js'
import { ConfirmDialog } from '../components/ConfirmDialog.js'
import { Toast } from '../components/Toast.js'
import { Loader } from '../components/Loader.js'
import { PurchaseFormView } from './PurchaseFormView.js'
import { formatCurrency, formatDateTime } from '../utils/formatters.js'

export class PurchaseView {
  constructor() {
    this._container = null
    this._purchasesTable = null
    this._detailModal = null
    this._formView = new PurchaseFormView()
    this._loader = new Loader({ message: 'Cargando compras...' })
    this._onNewPurchaseCb = null
    this._onViewDetailCb = null
    this._onCancelPurchaseCb = null
    this._onDeletePurchaseCb = null
    this._canCancelPurchases = true
    this._canDeletePurchases = true
  }

  render(container, permissions = {}) {
    this._canCancelPurchases = permissions.canCancelPurchases !== false
    this._canDeletePurchases = permissions.canDeletePurchases !== false
    this._container = container
    container.innerHTML = ''
    container.appendChild(this._createToolbar())
    container.appendChild(this._createPurchasesTable())
  }

  _createToolbar() {
    const toolbar = document.createElement('div')
    toolbar.className = 'toolbar'

    const title = document.createElement('h2')
    title.className = 'toolbar__title'
    title.textContent = 'Compras'

    const createBtn = document.createElement('button')
    createBtn.className = 'btn btn--primary'
    createBtn.textContent = '+ Nueva Compra'
    createBtn.addEventListener('click', () => {
      if (this._onNewPurchaseCb) this._onNewPurchaseCb()
    })

    toolbar.appendChild(title)
    toolbar.appendChild(createBtn)
    return toolbar
  }

  _createPurchasesTable() {
    const wrapper = document.createElement('div')
    wrapper.className = 'purchases-table-wrapper'

    this._purchasesTable = new Table({
      columns: [
        { key: 'id', label: 'N°', width: '60px' },
        { key: 'date', label: 'Fecha', width: '160px', render: (v) => formatDateTime(v) },
        { key: 'supplierName', label: 'Proveedor' },
        { key: 'total', label: 'Total', width: '120px', render: (v) => formatCurrency(v) },
        {
          key: 'status', label: 'Estado', width: '100px', sortable: false,
          render: (v) => {
            const span = document.createElement('span')
            const isCancelled = v === 'cancelled'
            span.className = `status-badge ${isCancelled ? 'status--critical' : 'status--ok'}`
            span.textContent = isCancelled ? 'Anulada' : 'Completada'
            return span
          }
        },
        {
          key: 'id', label: 'Acciones', width: '160px', sortable: false,
          render: (value, row) => {
            const group = document.createElement('div')
            group.className = 'table-actions'

            const detailBtn = document.createElement('button')
            detailBtn.className = 'btn btn--sm btn--ghost'
            detailBtn.textContent = 'Detalle'
            detailBtn.addEventListener('click', (e) => {
              e.stopPropagation()
              if (this._onViewDetailCb) this._onViewDetailCb(row.id)
            })
            group.appendChild(detailBtn)

            if (row.status !== 'cancelled' && this._canCancelPurchases) {
              const cancelBtn = document.createElement('button')
              cancelBtn.className = 'btn btn--sm btn--ghost-danger'
              cancelBtn.textContent = 'Anular'
              cancelBtn.addEventListener('click', (e) => {
                e.stopPropagation()
                if (this._onCancelPurchaseCb) this._onCancelPurchaseCb(row.id)
              })
              group.appendChild(cancelBtn)
            }

            if (this._canDeletePurchases) {
              const deleteBtn = document.createElement('button')
              deleteBtn.className = 'btn btn--sm btn--ghost'
              deleteBtn.textContent = 'Eliminar'
              deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation()
                if (this._onDeletePurchaseCb) this._onDeletePurchaseCb(row.id)
              })
              group.appendChild(deleteBtn)
            }

            return group
          }
        }
      ],
      emptyMessage: 'No hay compras registradas'
    })

    wrapper.appendChild(this._purchasesTable.render())
    return wrapper
  }

  renderPurchases(purchases) {
    this._purchasesTable.setData(purchases)
  }

  showNewPurchaseForm(suppliers, products, { onSubmit, onCancel }) {
    this._formView.open(suppliers, products, { onSubmit, onCancel })
  }

  closeForm() {
    this._formView.close()
  }

  showDetailModal(purchase, onClose) {
    const body = document.createElement('div')
    const statusClass = purchase.status === 'cancelled' ? 'status--critical' : 'status--ok'
    const statusLabel = purchase.status === 'cancelled' ? 'Anulada' : 'Completada'

    const info = document.createElement('div')
    info.className = 'purchase-detail__info'
    const addRow = (label, value) => {
      const row = document.createElement('div')
      row.className = 'purchase-detail__row'
      const strong = document.createElement('strong')
      strong.textContent = label
      row.appendChild(strong)
      row.appendChild(document.createTextNode(' ' + value))
      return row
    }
    info.appendChild(addRow('Compra N°:', String(purchase.id)))
    info.appendChild(addRow('Fecha:', formatDateTime(purchase.date)))
    info.appendChild(addRow('Proveedor:', purchase.supplierName || '—'))

    const statusRow = document.createElement('div')
    statusRow.className = 'purchase-detail__row'
    const strong = document.createElement('strong')
    strong.textContent = 'Estado:'
    statusRow.appendChild(strong)
    statusRow.appendChild(document.createTextNode(' '))
    const badge = document.createElement('span')
    badge.className = `status-badge ${statusClass}`
    badge.textContent = statusLabel
    statusRow.appendChild(badge)
    info.appendChild(statusRow)

    if (purchase.notes) info.appendChild(addRow('Notas:', purchase.notes))
    body.appendChild(info)

    if (purchase.items?.length > 0) {
      const table = document.createElement('table')
      table.className = 'table purchase-detail__table'
      const thead = document.createElement('thead')
      thead.className = 'table__head'
      const htr = document.createElement('tr')
      ;['Producto', 'Cant.', 'Precio', 'Subtotal'].forEach((t, i) => {
        const th = document.createElement('th')
        th.className = 'table__th'
        const widthCls = i === 1 ? ' table__th--w80' : i >= 2 ? ' table__th--w100' : ''
        th.className = 'table__th' + widthCls
        th.textContent = t
        htr.appendChild(th)
      })
      thead.appendChild(htr)
      table.appendChild(thead)

      const tbody = document.createElement('tbody')
      for (const item of purchase.items) {
        const tr = document.createElement('tr')
        tr.className = 'table__row'
        const vals = [item.productName, String(item.quantity), formatCurrency(item.unitPrice), formatCurrency(item.subtotal)]
        vals.forEach((v, ci) => {
          const td = document.createElement('td')
          td.className = 'table__td'
          if (ci === 3) td.className = 'table__td text-semibold'
          td.textContent = v
          tr.appendChild(td)
        })
        tbody.appendChild(tr)
      }
      table.appendChild(tbody)
      body.appendChild(table)

      const totals = document.createElement('div')
      totals.className = 'purchase-detail__totals'
      const createRow = (label, value, cls) => {
        const row = document.createElement('div')
        row.className = cls || 'purchase-detail__total-row'
        const s1 = document.createElement('span'); s1.textContent = label
        const s2 = document.createElement('span'); s2.textContent = value
        row.append(s1, s2)
        return row
      }
      totals.append(
        createRow('Subtotal:', formatCurrency(purchase.subtotal)),
        createRow('Impuesto:', formatCurrency(purchase.tax)),
        createRow('Total:', formatCurrency(purchase.total), 'purchase-detail__total-row purchase-detail__total-row--grand')
      )
      body.appendChild(totals)
    }

    this._detailModal = new Modal({ title: 'Detalle de Compra', content: body, size: 'lg', closable: true })
    this._detailModal.onClose = () => { this._detailModal = null; if (onClose) onClose() }
    this._detailModal.open()
  }

  closeDetailModal() {
    if (this._detailModal) { this._detailModal.close(); this._detailModal = null }
  }

  onNewPurchase(cb) { this._onNewPurchaseCb = cb }
  onViewDetail(cb) { this._onViewDetailCb = cb }
  onCancelPurchase(cb) { this._onCancelPurchaseCb = cb }
  onDeletePurchase(cb) { this._onDeletePurchaseCb = cb }

  showLoading() { this._loader.show() }
  hideLoading() { this._loader.hide() }

  showSaving() { this._formView.showSaving() }
  hideSaving() { this._formView.hideSaving() }

  showSuccess(m) { Toast.success(m) }
  showError(m) { Toast.error(m) }

  async confirmCancel() {
    const dialog = new ConfirmDialog({
      title: 'Anular Compra',
      message: '¿Está seguro de anular esta compra? Se revertirá el stock de los productos.',
      confirmText: 'Anular Compra',
      cancelText: 'Cancelar',
      danger: true
    })
    return dialog.confirm()
  }

  async confirmDelete() {
    const dialog = new ConfirmDialog({
      title: 'Eliminar Compra',
      message: '¿Está seguro de eliminar esta compra? Se revertirá el stock y se eliminarán los registros contables asociados. Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true
    })
    return dialog.confirm()
  }
}
