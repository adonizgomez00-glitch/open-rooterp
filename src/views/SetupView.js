import { Toast } from '../components/Toast.js'
import { Loader } from '../components/Loader.js'
import { APP_CONFIG } from '../config/app.js'

export class SetupView {
  constructor() {
    this._container = null
    this._form = null
    this._onSetupCb = null
    this._loader = new Loader({ message: 'Configurando sistema...' })
  }

  render(container) {
    this._container = container
    container.innerHTML = ''

    const wrapper = document.createElement('div')
    wrapper.className = 'auth-container'

    const card = document.createElement('div')
    card.className = 'auth-card auth-card--wide'

    const icon = document.createElement('div')
    icon.className = 'auth-card__icon'
    icon.textContent = '\u2699'

    const title = document.createElement('h1')
    title.className = 'auth-card__title'
    title.textContent = 'Configuración Inicial'

    const subtitle = document.createElement('p')
    subtitle.className = 'auth-card__subtitle'
    subtitle.textContent = `Bienvenido a ${APP_CONFIG.APP_NAME}. Complete los datos para comenzar.`

    card.appendChild(icon)
    card.appendChild(title)
    card.appendChild(subtitle)

    this._form = document.createElement('form')
    this._form.className = 'auth-form'
    this._form.setAttribute('novalidate', '')

    const fields = [
      { id: 'setup-business', name: 'businessName', label: 'Nombre del Negocio', type: 'text', placeholder: 'Ej: Mi Empresa S.A.', required: true },
      { id: 'setup-username', name: 'username', label: 'Usuario Administrador', type: 'text', placeholder: 'admin', required: true, autocomplete: 'username' },
      { id: 'setup-password', name: 'password', label: 'Contraseña', type: 'password', placeholder: 'Mínimo 8 caracteres', required: true, autocomplete: 'new-password', minlength: 8 },
      { id: 'setup-confirm', name: 'confirmPassword', label: 'Confirmar Contraseña', type: 'password', placeholder: 'Repita la contraseña', required: true, autocomplete: 'new-password' }
    ]

    for (const field of fields) {
      const group = document.createElement('div')
      group.className = 'auth-form__group'

      const label = document.createElement('label')
      label.className = 'auth-form__label'
      label.textContent = field.label
      label.setAttribute('for', field.id)

      const input = document.createElement('input')
      input.className = 'auth-form__input'
      input.id = field.id
      input.type = field.type
      input.name = field.name
      input.placeholder = field.placeholder
      input.required = field.required
      if (field.autocomplete) input.autocomplete = field.autocomplete
      if (field.minlength) input.minLength = field.minlength

      group.appendChild(label)
      group.appendChild(input)
      this._form.appendChild(group)
    }

    const passwordMatchMsg = document.createElement('span')
    passwordMatchMsg.className = 'auth-form__error'
    passwordMatchMsg.id = 'setup-password-error'
    passwordMatchMsg.style.display = 'none'
    passwordMatchMsg.textContent = 'Las contraseñas no coinciden'
    this._form.appendChild(passwordMatchMsg)

    const submitBtn = document.createElement('button')
    submitBtn.className = 'btn btn--primary auth-form__submit'
    submitBtn.type = 'submit'
    submitBtn.textContent = 'Configurar Sistema'

    this._form.appendChild(submitBtn)

    this._form.addEventListener('submit', (e) => {
      e.preventDefault()
      this._handleSubmit()
    })

    card.appendChild(this._form)
    wrapper.appendChild(card)
    container.appendChild(wrapper)
  }

  onSetup(callback) {
    this._onSetupCb = callback
  }

  showError(message) {
    Toast.error(message)
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

  _handleSubmit() {
    if (!this._form || !this._onSetupCb) return
    const formData = new FormData(this._form)
    const businessName = formData.get('businessName')?.trim() ?? ''
    const username = formData.get('username')?.trim() ?? ''
    const password = formData.get('password') ?? ''
    const confirmPassword = formData.get('confirmPassword') ?? ''

    const errorEl = this._form.querySelector('#setup-password-error')

    if (!username || !password || !businessName) {
      this.showError('Todos los campos son requeridos')
      return
    }

    if (password.length < 8) {
      this.showError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (password !== confirmPassword) {
      if (errorEl) {
        errorEl.style.display = 'block'
      }
      this.showError('Las contraseñas no coinciden')
      return
    }

    if (errorEl) {
      errorEl.style.display = 'none'
    }

    this._onSetupCb({ businessName, username, password })
  }
}
