import { Modal } from '../components/Modal.js'
import { Toast } from '../components/Toast.js'
import { formatCurrency, getTaxRate } from '../utils/formatters.js'

export class SaleFormView {
  constructor() {
    this._modal = null
    this._onSubmit = null
    this._onCancel = null
  }
  open(customers, products, { onSubmit, onCancel }) {
    this._onSubmit = onSubmit
    this._onCancel = onCancel
    const body = document.createElement('div')
    body.className = 'sale-form'
    body.append(
      this._createCustomerSection(customers),
      this._createProductSection(products),
      this._createCartSection(),
      this._createNotesSection(),
      this._createActionsSection()
    )
    this._modal = new Modal({ title: 'Nueva Venta', content: body, size: 'xl' })
    this._modal.open()
  }
  close() {
    if (this._modal) { this._modal.close(); this._modal = null }
  }

  _createCustomerSection(customers) {
    const group = document.createElement('div')
    group.className = 'sale-form__section'
    const label = document.createElement('label')
    label.className = 'sale-form__label'
    label.textContent = 'Cliente'
    this._customerSelect = document.createElement('select')
    this._customerSelect.className = 'sale-form__select'
    const empty = document.createElement('option')
    empty.value = ''
    empty.textContent = 'Cliente ocasional (sin registro)'
    this._customerSelect.appendChild(empty)
    customers.forEach(c => {
      const opt = document.createElement('option')
      opt.value = c.id
      opt.textContent = `${c.name} (${c.documentId})`
      this._customerSelect.appendChild(opt)
    })
    group.append(label, this._customerSelect)
    return group
  }
  _createProductSection(products) {
    this._products = products
    this._cart = []
    const group = document.createElement('div')
    group.className = 'sale-form__section'
    const label = document.createElement('label')
    label.className = 'sale-form__label'
    label.textContent = 'Agregar Productos'
    const row = document.createElement('div')
    row.className = 'sale-form__product-row'
    this._productSelect = document.createElement('select')
    this._productSelect.className = 'sale-form__select sale-form__select--product'
    const placeholder = document.createElement('option')
    placeholder.value = ''
    placeholder.textContent = 'Seleccione un producto...'
    this._productSelect.appendChild(placeholder)
    products.forEach(p => {
      const opt = document.createElement('option')
      opt.value = p.id
      opt.textContent = `[${p.code}] ${p.name} — Stock: ${p.stock} — ${formatCurrency(p.salePrice)}`
      this._productSelect.appendChild(opt)
    })
    this._qtyInput = document.createElement('input')
    Object.assign(this._qtyInput, { className: 'sale-form__input sale-form__input--qty', type: 'number', min: 1, step: 1, value: '1', placeholder: 'Cant.' })
    const addBtn = document.createElement('button')
    addBtn.className = 'btn btn--primary btn--sm'
    addBtn.textContent = 'Agregar'
    addBtn.addEventListener('click', () => this._addProduct())
    row.append(this._productSelect, this._qtyInput, addBtn)
    group.append(label, row)
    return group
  }

  _createCartSection() {
    const wrapper = document.createElement('div')
    wrapper.className = 'sale-form__cart-wrapper'
    const thead = document.createElement('thead')
    thead.className = 'table__head'
    const htr = document.createElement('tr')
    ;['Producto', 'Cant.', 'Precio', 'Subtotal', ''].forEach((t, i) => {
      const th = document.createElement('th')
      const widthCls = i === 1 ? ' table__th--w80' : i === 2 || i === 3 ? ' table__th--w100' : i === 4 ? ' table__th--w60' : ''
      th.className = 'table__th' + widthCls
      th.textContent = t
      htr.append(th)
    })
    thead.append(htr)
    this._cartBody = document.createElement('tbody')
    this._cartBody.id = 'sale-cart-body'
    const et = document.createElement('tr')
    const etd = document.createElement('td')
    etd.className = 'table__empty'
    etd.colSpan = 5
    etd.textContent = 'Agregue productos a la venta'
    et.append(etd)
    this._cartBody.append(et)
    this._cartTable = document.createElement('table')
    this._cartTable.className = 'table sale-form__cart'
    this._cartTable.append(thead, this._cartBody)
    wrapper.append(this._cartTable)
    const cr = (l, id, cls) => {
      const row = document.createElement('div')
      row.className = cls || 'sale-form__total-row'
      const a = document.createElement('span'); a.textContent = l
      const b = document.createElement('span'); b.id = id; b.textContent = formatCurrency(0)
      row.append(a, b)
      return row
    }
    this._totalsDiv = document.createElement('div')
    this._totalsDiv.className = 'sale-form__totals'
    const taxPct = (getTaxRate() * 100).toFixed(0)
    this._totalsDiv.append(cr('Subtotal:', 'sale-subtotal'), cr(`Impuesto (${taxPct}%):`, 'sale-tax'), cr('Total:', 'sale-total', 'sale-form__total-row sale-form__total-row--grand'))
    wrapper.append(this._totalsDiv)
    return wrapper
  }
  _createNotesSection() {
    const group = document.createElement('div')
    group.className = 'sale-form__section'
    const label = document.createElement('label')
    label.className = 'sale-form__label'
    label.textContent = 'Notas'
    this._notesInput = document.createElement('textarea')
    this._notesInput.className = 'sale-form__textarea'
    this._notesInput.placeholder = 'Notas opcionales...'
    this._notesInput.rows = 2
    group.append(label, this._notesInput)
    return group
  }
  _createActionsSection() {
    const actions = document.createElement('div')
    actions.className = 'sale-form__actions'
    const cancelBtn = document.createElement('button')
    cancelBtn.className = 'btn btn--secondary'
    cancelBtn.textContent = 'Cancelar'
    cancelBtn.addEventListener('click', () => this._onCancel?.())
    this._saveBtn = document.createElement('button')
    this._saveBtn.className = 'btn btn--primary'
    this._saveBtn.textContent = 'Guardar Venta'
    this._saveBtn.addEventListener('click', () => this._submit())
    actions.append(cancelBtn, this._saveBtn)
    return actions
  }

  _addProduct() {
    const productId = Number(this._productSelect.value)
    if (!productId) { Toast.warning('Seleccione un producto'); return }
    const product = this._products.find(p => p.id === productId)
    const quantity = Number(this._qtyInput.value) || 1
    const existing = this._cart.find(c => c.productId === productId)
    if (existing) {
      existing.quantity += quantity
    } else {
      this._cart.push({ productId: product.id, productCode: product.code, productName: product.name, quantity, unitPrice: product.salePrice, subtotal: quantity * product.salePrice })
    }
    this._renderCart()
    this._productSelect.value = ''
    this._qtyInput.value = '1'
  }
  _renderCart() {
    this._cartBody.innerHTML = ''
    if (this._cart.length === 0) {
      const tr = document.createElement('tr')
      const td = document.createElement('td')
      td.className = 'table__empty'; td.colSpan = 5; td.textContent = 'Agregue productos a la venta'
      tr.append(td); this._cartBody.append(tr); this._updateTotals()
      return
    }
    const fragment = document.createDocumentFragment()
    for (let i = 0; i < this._cart.length; i++) {
      const item = this._cart[i]
      const row = document.createElement('tr')
      row.className = 'table__row'
      ;[1,2,3,4,5].forEach(() => { const c = document.createElement('td'); c.className = 'table__td'; row.append(c) })
      row.children[0].textContent = item.productName
      const qtyInput = document.createElement('input')
      Object.assign(qtyInput, { type: 'number', className: 'sale-form__input--cart-qty', value: item.quantity, min: 1 })
      qtyInput.addEventListener('change', () => { item.quantity = Number(qtyInput.value) || 1; item.subtotal = item.quantity * item.unitPrice; this._renderCart() })
      row.children[1].append(qtyInput)
      row.children[2].textContent = formatCurrency(item.unitPrice)
      row.children[3].textContent = formatCurrency(item.subtotal); row.children[3].className = 'table__td text-semibold'
      const removeBtn = document.createElement('button')
      removeBtn.className = 'btn btn--sm btn--ghost-danger'
      removeBtn.textContent = '\u2715'
      removeBtn.addEventListener('click', () => { this._cart.splice(i, 1); this._renderCart() })
      row.children[4].append(removeBtn)
      fragment.append(row)
    }
    this._cartBody.append(fragment)
    this._updateTotals()
  }
  _updateTotals() {
    const subtotal = this._cart.reduce((s, i) => s + i.subtotal, 0)
    const taxRate = getTaxRate()
    const tax = subtotal * taxRate
    const total = subtotal + tax
    document.getElementById('sale-subtotal').textContent = formatCurrency(subtotal)
    document.getElementById('sale-tax').textContent = formatCurrency(tax)
    document.getElementById('sale-total').textContent = formatCurrency(total)
  }
  _submit() {
    if (this._cart.length === 0) { Toast.warning('Agregue al menos un producto'); return }
    const customerId = this._customerSelect.value ? Number(this._customerSelect.value) : null
    let customerName = 'Cliente ocasional'
    if (customerId && this._customerSelect.selectedOptions[0]) customerName = this._customerSelect.selectedOptions[0].textContent.split(' (')[0]
    if (this._onSubmit) this._onSubmit({ saleData: { customerId, customerName, notes: this._notesInput.value }, items: this._cart.map(i => ({ ...i })) })
  }

  showSaving() { if (this._saveBtn) { this._saveBtn.disabled = true; this._saveBtn.textContent = 'Guardando...' } }
  hideSaving() { if (this._saveBtn) { this._saveBtn.disabled = false; this._saveBtn.textContent = 'Guardar Venta' } }
}
