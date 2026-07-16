export class Form {
  constructor({ fields = [], onSubmit = null, submitText = 'Guardar', cancelText = null, onCancel = null } = {}) {
    this._fields = fields
    this._onSubmit = onSubmit
    this._submitText = submitText
    this._cancelText = cancelText
    this._onCancel = onCancel
    this._element = null
    this._inputs = new Map()
  }

  render() {
    const form = document.createElement('form')
    form.className = 'form'
    form.setAttribute('novalidate', '')

    for (const field of this._fields) {
      const group = document.createElement('div')
      group.className = 'form__group'

      if (field.label) {
        const label = document.createElement('label')
        label.className = `form__label${field.required ? ' form__label--required' : ''}`
        label.textContent = field.label
        label.setAttribute('for', `field-${field.name}`)
        group.appendChild(label)
      }

      const input = this._createInput(field)
      input.id = `field-${field.name}`

      const errorEl = document.createElement('span')
      errorEl.className = 'form__error'
      errorEl.id = `error-${field.name}`
      errorEl.style.display = 'none'
      errorEl.setAttribute('role', 'alert')
      group.appendChild(errorEl)

      input.setAttribute('aria-describedby', errorEl.id)
      group.appendChild(input)

      form.appendChild(group)
      this._inputs.set(field.name, { input, errorEl, field })
    }

    const actions = document.createElement('div')
    actions.className = 'form__actions'

    if (this._cancelText && this._onCancel) {
      const cancelBtn = document.createElement('button')
      cancelBtn.type = 'button'
      cancelBtn.className = 'btn btn--secondary'
      cancelBtn.textContent = this._cancelText
      cancelBtn.addEventListener('click', this._onCancel)
      actions.appendChild(cancelBtn)
    }

    const submitBtn = document.createElement('button')
    submitBtn.type = 'submit'
    submitBtn.className = 'btn btn--primary'
    submitBtn.textContent = this._submitText
    actions.appendChild(submitBtn)

    form.appendChild(actions)

    form.addEventListener('submit', (e) => {
      e.preventDefault()
      if (this._validateAll()) {
        if (this._onSubmit) {
          this._onSubmit(this.getValues())
        }
      }
    })

    this._element = form
    return form
  }

  _createInput(field) {
    const type = field.type || 'text'
    let input

    if (type === 'select') {
      input = document.createElement('select')
      input.className = 'form__select'

      if (field.placeholder) {
        const opt = document.createElement('option')
        opt.value = ''
        opt.textContent = field.placeholder
        input.appendChild(opt)
      }

      if (field.options) {
        for (const opt of field.options) {
          const option = document.createElement('option')
          option.value = opt.value ?? opt
          option.textContent = opt.label ?? opt
          input.appendChild(option)
        }
      }
    } else if (type === 'textarea') {
      input = document.createElement('textarea')
      input.className = 'form__textarea'
      if (field.rows) input.rows = field.rows
    } else {
      input = document.createElement('input')
      input.className = 'form__input'
      input.type = type === 'email' ? 'email' : type === 'number' ? 'number' : 'text'

      if (type === 'number') {
        input.step = field.step || 'any'
        input.min = field.min ?? ''
        input.max = field.max ?? ''
      }
    }

    input.name = field.name
    if (field.placeholder) input.placeholder = field.placeholder
    if (field.value !== undefined) input.value = field.value
    if (field.required) input.required = true
    if (field.minlength) input.minLength = field.minlength
    if (field.maxlength) input.maxLength = field.maxlength
    if (field.pattern) input.pattern = field.pattern
    if (field.readonly) input.readOnly = true

    input.addEventListener('blur', () => {
      this._validateField(field.name)
    })

    input.addEventListener('input', () => {
      this._clearError(field.name)
    })

    return input
  }

  getValues() {
    const values = {}
    for (const [name, { input }] of this._inputs) {
      const field = this._fields.find(f => f.name === name)
      if (field?.type === 'number') {
        values[name] = input.value === '' ? null : Number(input.value)
      } else {
        values[name] = input.value
      }
    }
    return values
  }

  setValues(data) {
    for (const [name, { input }] of this._inputs) {
      if (data[name] !== undefined) {
        input.value = data[name]
      }
    }
  }

  reset() {
    for (const [, { input, errorEl }] of this._inputs) {
      input.value = ''
      input.classList.remove('form__input--error', 'form__select--error', 'form__textarea--error')
      errorEl.style.display = 'none'
    }
  }

  _validateField(name) {
    const entry = this._inputs.get(name)
    if (!entry) return true

    const { input, errorEl, field } = entry
    const value = input.value.trim()

    input.classList.remove('form__input--error', 'form__select--error', 'form__textarea--error')
    errorEl.style.display = 'none'

    if (field.required && !value) {
      this._showError(input, errorEl, 'Este campo es requerido')
      return false
    }

    if (!value) return true

    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      this._showError(input, errorEl, 'Ingrese un email válido')
      return false
    }

    if (field.type === 'url' && !/^https?:\/\/.+/.test(value)) {
      this._showError(input, errorEl, 'Ingrese una URL válida')
      return false
    }

    if (field.type === 'number') {
      const num = Number(value)
      if (Number.isNaN(num)) {
        this._showError(input, errorEl, 'Ingrese un número válido')
        return false
      }
      if (field.min !== undefined && num < field.min) {
        this._showError(input, errorEl, `El valor mínimo es ${field.min}`)
        return false
      }
      if (field.max !== undefined && num > field.max) {
        this._showError(input, errorEl, `El valor máximo es ${field.max}`)
        return false
      }
    }

    if (field.minlength && value.length < field.minlength) {
      this._showError(input, errorEl, `Debe tener al menos ${field.minlength} caracteres`)
      return false
    }

    if (field.maxlength && value.length > field.maxlength) {
      this._showError(input, errorEl, `Debe tener máximo ${field.maxlength} caracteres`)
      return false
    }

    if (field.pattern && !new RegExp(field.pattern).test(value)) {
      this._showError(input, errorEl, field.patternMessage || 'Formato inválido')
      return false
    }

    if (field.validators) {
      for (const validator of field.validators) {
        const result = validator(value, this.getValues())
        if (result !== true) {
          this._showError(input, errorEl, result)
          return false
        }
      }
    }

    return true
  }

  _validateAll() {
    let valid = true
    for (const [name] of this._inputs) {
      if (!this._validateField(name)) {
        valid = false
      }
    }
    return valid
  }

  _showError(input, errorEl, message) {
    input.classList.add('form__input--error', 'form__select--error', 'form__textarea--error')
    input.setAttribute('aria-invalid', 'true')
    errorEl.textContent = message
    errorEl.style.display = 'block'
  }

  _clearError(name) {
    const entry = this._inputs.get(name)
    if (!entry) return
    const { input, errorEl } = entry
    input.classList.remove('form__input--error', 'form__select--error', 'form__textarea--error')
    input.removeAttribute('aria-invalid')
    errorEl.style.display = 'none'
  }
}
