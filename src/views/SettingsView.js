import { Toast } from '../components/Toast.js'
import { Loader } from '../components/Loader.js'

const SECTIONS = [
  {
    title: 'Información del Negocio',
    description: 'Datos principales de tu empresa para facturación y reportes',
    fields: [
      { key: 'business_name', label: 'Nombre del Negocio', type: 'text', placeholder: 'Ej: Mi Empresa S.A.' },
      { key: 'business_document', label: 'NIT / Documento', type: 'text', placeholder: 'Ej: 12345678-9' },
      { key: 'business_address', label: 'Dirección', type: 'text', placeholder: 'Ej: 6a. Avenida 1-23, Zona 4' },
      { key: 'business_phone', label: 'Teléfono', type: 'text', placeholder: 'Ej: 5555-0000' },
      { key: 'business_email', label: 'Correo Electrónico', type: 'email', placeholder: 'Ej: info@miempresa.com' }
    ]
  },
  {
    title: 'Configuración Financiera',
    description: 'Parámetros financieros que afectan cálculos en ventas y compras',
    fields: [
      { key: 'tax_rate', label: 'Tasa de Impuesto (%)', type: 'number', step: '0.01', min: '0', max: '100', placeholder: 'Ej: 12' },
      { key: 'currency_symbol', label: 'Símbolo de Moneda', type: 'text', placeholder: 'Ej: Q  o  $' }
    ]
  }
]

export class SettingsView {
  constructor() {
    this._container = null
    this._loader = new Loader({ message: 'Cargando configuración...' })
    this._onSaveCb = null
    this._form = null
  }

  render(container) {
    this._container = container
    container.innerHTML = ''

    const toolbar = document.createElement('div')
    toolbar.className = 'toolbar'

    const title = document.createElement('h2')
    title.className = 'toolbar__title'
    title.textContent = 'Configuración'

    toolbar.appendChild(title)
    container.appendChild(toolbar)

    const wrapper = document.createElement('div')
    wrapper.className = 'settings-form'

    this._form = document.createElement('form')
    this._form.className = 'form'
    this._form.addEventListener('submit', (e) => {
      e.preventDefault()
      this._handleSubmit()
    })

    wrapper.appendChild(this._form)
    container.appendChild(wrapper)
  }

  renderForm(settings) {
    if (!this._form) return
    this._form.innerHTML = ''

    const fieldMap = {}
    for (const setting of settings) {
      fieldMap[setting.key] = setting
    }

    for (const section of SECTIONS) {
      const sectionEl = document.createElement('div')
      sectionEl.className = 'settings-section'

      const header = document.createElement('div')
      header.className = 'settings-section__header'

      const title = document.createElement('h3')
      title.className = 'settings-section__title'
      title.textContent = section.title

      const desc = document.createElement('p')
      desc.className = 'settings-section__desc'
      desc.textContent = section.description

      header.appendChild(title)
      header.appendChild(desc)
      sectionEl.appendChild(header)

      const grid = document.createElement('div')
      grid.className = 'settings-grid'

      for (const field of section.fields) {
        const setting = fieldMap[field.key]
        const value = setting ? setting.value : ''

        const group = document.createElement('div')
        group.className = 'settings-field'

        const label = document.createElement('label')
        label.className = 'settings-field__label'
        label.setAttribute('for', `setting-${field.key}`)
        label.textContent = field.label

        let input
        if (field.type === 'number') {
          input = document.createElement('input')
          input.type = 'number'
          if (field.step) input.step = field.step
          if (field.min) input.min = field.min
          if (field.max) input.max = field.max
        } else {
          input = document.createElement('input')
          input.type = field.type
        }

        input.className = 'settings-field__input'
        input.id = `setting-${field.key}`
        input.name = field.key
        input.value = field.key === 'tax_rate' ? String(Number(value) * 100) : value
        if (field.placeholder) input.placeholder = field.placeholder
        if (field.type === 'email') input.autocomplete = 'email'

        group.appendChild(label)
        group.appendChild(input)
        grid.appendChild(group)
      }

      sectionEl.appendChild(grid)
      this._form.appendChild(sectionEl)
    }

    const actions = document.createElement('div')
    actions.className = 'settings-actions'

    const saveBtn = document.createElement('button')
    saveBtn.className = 'btn btn--primary btn--lg'
    saveBtn.type = 'submit'
    saveBtn.id = 'settings-save-btn'
    saveBtn.textContent = 'Guardar Configuración'

    const hint = document.createElement('span')
    hint.className = 'settings-actions__hint'
    hint.textContent = 'Los cambios se aplicarán inmediatamente'

    actions.appendChild(saveBtn)
    actions.appendChild(hint)
    this._form.appendChild(actions)
  }

  onSave(callback) {
    this._onSaveCb = callback
  }

  showSaving() {
    const btn = document.getElementById('settings-save-btn')
    if (btn) {
      btn.disabled = true
      btn.textContent = 'Guardando...'
    }
  }

  hideSaving() {
    const btn = document.getElementById('settings-save-btn')
    if (btn) {
      btn.disabled = false
      btn.textContent = 'Guardar Configuración'
    }
  }

  showLoading() {
    this._loader.show()
  }

  hideLoading() {
    this._loader.hide()
  }

  showSuccess(message) {
    Toast.success(message)
  }

  showError(message) {
    Toast.error(message)
  }

  _handleSubmit() {
    if (!this._form || !this._onSaveCb) return

    const formData = new FormData(this._form)
    const entries = []

    for (const [key, value] of formData.entries()) {
      const processedValue = key === 'tax_rate' ? String(Number(value) / 100) : value
      entries.push({ key, value: processedValue })
    }

    this._onSaveCb(entries)
  }
}