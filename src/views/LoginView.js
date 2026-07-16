import { Toast } from '../components/Toast.js'
import { Loader } from '../components/Loader.js'
import { APP_CONFIG } from '../config/app.js'

export class LoginView {
  constructor() {
    this._container = null
    this._form = null
    this._onLoginCb = null
    this._loader = new Loader({ message: 'Iniciando sesión...' })
  }

  render(container) {
    this._container = container
    container.innerHTML = ''

    const wrapper = document.createElement('div')
    wrapper.className = 'auth-container'

    const card = document.createElement('div')
    card.className = 'auth-card'

    const icon = document.createElement('div')
    icon.className = 'auth-card__icon'
    icon.textContent = '\u2699'

    const title = document.createElement('h1')
    title.className = 'auth-card__title'
    title.textContent = APP_CONFIG.APP_NAME

    const subtitle = document.createElement('p')
    subtitle.className = 'auth-card__subtitle'
    subtitle.textContent = 'Inicie sesión para continuar'

    card.appendChild(icon)
    card.appendChild(title)
    card.appendChild(subtitle)

    this._form = document.createElement('form')
    this._form.className = 'auth-form'
    this._form.setAttribute('novalidate', '')

    const usernameGroup = document.createElement('div')
    usernameGroup.className = 'auth-form__group'

    const usernameLabel = document.createElement('label')
    usernameLabel.className = 'auth-form__label'
    usernameLabel.textContent = 'Usuario'
    usernameLabel.setAttribute('for', 'login-username')

    const usernameInput = document.createElement('input')
    usernameInput.className = 'auth-form__input'
    usernameInput.id = 'login-username'
    usernameInput.name = 'username'
    usernameInput.type = 'text'
    usernameInput.placeholder = 'Ingrese su usuario'
    usernameInput.required = true
    usernameInput.autocomplete = 'username'

    usernameGroup.appendChild(usernameLabel)
    usernameGroup.appendChild(usernameInput)

    const passwordGroup = document.createElement('div')
    passwordGroup.className = 'auth-form__group'

    const passwordLabel = document.createElement('label')
    passwordLabel.className = 'auth-form__label'
    passwordLabel.textContent = 'Contraseña'
    passwordLabel.setAttribute('for', 'login-password')

    const passwordInput = document.createElement('input')
    passwordInput.className = 'auth-form__input'
    passwordInput.id = 'login-password'
    passwordInput.name = 'password'
    passwordInput.type = 'password'
    passwordInput.placeholder = 'Ingrese su contraseña'
    passwordInput.required = true
    passwordInput.autocomplete = 'current-password'

    passwordGroup.appendChild(passwordLabel)
    passwordGroup.appendChild(passwordInput)

    const submitBtn = document.createElement('button')
    submitBtn.className = 'btn btn--primary auth-form__submit'
    submitBtn.type = 'submit'
    submitBtn.textContent = 'Ingresar'

    this._form.appendChild(usernameGroup)
    this._form.appendChild(passwordGroup)
    this._form.appendChild(submitBtn)

    this._form.addEventListener('submit', (e) => {
      e.preventDefault()
      this._handleSubmit()
    })

    card.appendChild(this._form)
    wrapper.appendChild(card)
    container.appendChild(wrapper)
  }

  onLogin(callback) {
    this._onLoginCb = callback
  }

  showError(message) {
    Toast.error(message)
  }

  showLoading() {
    this._loader.show()
  }

  hideLoading() {
    this._loader.hide()
  }

  _handleSubmit() {
    if (!this._form || !this._onLoginCb) return
    const formData = new FormData(this._form)
    const username = formData.get('username')?.trim() ?? ''
    const password = formData.get('password') ?? ''
    if (!username || !password) {
      this.showError('Todos los campos son requeridos')
      return
    }
    this._onLoginCb(username, password)
  }
}
