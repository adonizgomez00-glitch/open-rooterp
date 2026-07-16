const ACTIVE_LOADERS = new Set()

export class Loader {
  constructor({ message = '', inline = false } = {}) {
    this._message = message
    this._inline = inline
    this._element = null
  }

  show() {
    if (this._element) return

    this._element = document.createElement('div')
    this._element.className = `loader${this._inline ? ' loader--inline' : ''}`
    this._element.setAttribute('role', 'status')
    this._element.setAttribute('aria-label', 'Cargando')

    const spinner = document.createElement('div')
    spinner.className = 'loader__spinner'

    this._element.appendChild(spinner)

    if (this._message) {
      const text = document.createElement('p')
      text.className = 'loader__message'
      text.textContent = this._message
      this._element.appendChild(text)
    }

    if (this._inline) {
      this._element.style.display = 'flex'
    }

    document.body.appendChild(this._element)
    ACTIVE_LOADERS.add(this)
  }

  hide() {
    if (!this._element) return

    ACTIVE_LOADERS.delete(this)

    if (this._element.parentNode) {
      this._element.parentNode.removeChild(this._element)
    }
    this._element = null
  }

  setMessage(message) {
    this._message = message
    if (this._element) {
      const textEl = this._element.querySelector('.loader__message')
      if (textEl) {
        textEl.textContent = message
      }
    }
  }
}
