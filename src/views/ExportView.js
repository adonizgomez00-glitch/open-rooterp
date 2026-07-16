import { Toast } from '../components/Toast.js'
import { Loader } from '../components/Loader.js'

export class ExportView {
  constructor() {
    this._container = null
    this._loader = new Loader({ message: 'Exportando datos...' })
    this._onExportCb = null
  }

  render(container) {
    this._container = container
    container.innerHTML = ''

    const toolbar = document.createElement('div')
    toolbar.className = 'toolbar'

    const title = document.createElement('h2')
    title.className = 'toolbar__title'
    title.textContent = 'Exportar Datos'

    toolbar.appendChild(title)
    container.appendChild(toolbar)

    const card = document.createElement('div')
    card.className = 'export-card'

    const desc = document.createElement('p')
    desc.className = 'export-card__desc'
    desc.textContent = 'Selecciona los datos que deseas exportar y el formato de salida.'
    card.appendChild(desc)

    const form = document.createElement('div')
    form.className = 'export-form'

    const entityGroup = document.createElement('div')
    entityGroup.className = 'export-form__group'

    const entityLabel = document.createElement('label')
    entityLabel.className = 'export-form__label'
    entityLabel.textContent = 'Entidad:'
    entityLabel.htmlFor = 'export-entity'

    this._entitySelect = document.createElement('select')
    this._entitySelect.id = 'export-entity'
    this._entitySelect.className = 'export-form__select'

    const entities = [
      { value: 'products', label: 'Productos' },
      { value: 'customers', label: 'Clientes' },
      { value: 'suppliers', label: 'Proveedores' },
      { value: 'sales', label: 'Ventas' },
      { value: 'purchases', label: 'Compras' },
      { value: 'movements', label: 'Movimientos de Inventario' },
      { value: 'settings', label: 'Configuración' },
      { value: 'all', label: 'Todos los datos' },
    ]

    for (const entity of entities) {
      const opt = document.createElement('option')
      opt.value = entity.value
      opt.textContent = entity.label
      this._entitySelect.appendChild(opt)
    }

    entityGroup.appendChild(entityLabel)
    entityGroup.appendChild(this._entitySelect)
    form.appendChild(entityGroup)

    const formatGroup = document.createElement('div')
    formatGroup.className = 'export-form__group'

    const formatLabel = document.createElement('label')
    formatLabel.className = 'export-form__label'
    formatLabel.textContent = 'Formato:'
    formatLabel.htmlFor = 'export-format'

    this._formatSelect = document.createElement('select')
    this._formatSelect.id = 'export-format'
    this._formatSelect.className = 'export-form__select'

    const formats = [
      { value: 'csv', label: 'CSV' },
      { value: 'json', label: 'JSON' },
    ]

    for (const fmt of formats) {
      const opt = document.createElement('option')
      opt.value = fmt.value
      opt.textContent = fmt.label
      this._formatSelect.appendChild(opt)
    }

    formatGroup.appendChild(formatLabel)
    formatGroup.appendChild(this._formatSelect)
    form.appendChild(formatGroup)

    card.appendChild(form)

    const exportBtn = document.createElement('button')
    exportBtn.className = 'btn btn--primary export-form__btn'
    exportBtn.textContent = 'Exportar'
    exportBtn.addEventListener('click', () => this._export())
    card.appendChild(exportBtn)

    container.appendChild(card)
  }

  onExport(cb) {
    this._onExportCb = cb
  }

  showSuccess(message) {
    Toast.success(message)
  }

  showLoading() {
    this._loader.show()
  }

  hideLoading() {
    this._loader.hide()
  }

  showError(message) {
    Toast.error(message)
  }

  _export() {
    if (this._onExportCb) {
      this._onExportCb(this._entitySelect.value, this._formatSelect.value)
    }
  }
}
