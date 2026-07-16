const SIZES = { sm: 'sm', md: 'md', lg: 'lg', xl: 'xl' }

export class Modal {
  constructor({ title = '', content = null, size = 'md', closable = true, footer = null } = {}) {
    this._title = title
    this._content = content
    this._size = SIZES[size] ? `modal__container--${size}` : 'modal__container--md'
    this._closable = closable
    this._footer = footer
    this._element = null
    this._onClose = null
  }

  set onClose(callback) {
    this._onClose = callback
  }

  open() {
    if (this._element) return

    this._previousFocused = document.activeElement

    this._element = document.createElement('div')
    this._element.className = 'modal'

    const overlay = document.createElement('div')
    overlay.className = 'modal__overlay'

    const container = document.createElement('div')
    container.className = `modal__container ${this._size}`
    container.setAttribute('role', 'dialog')
    container.setAttribute('aria-modal', 'true')
    container.setAttribute('aria-labelledby', 'modal-title')

    const header = document.createElement('div')
    header.className = 'modal__header'

    const title = document.createElement('h2')
    title.className = 'modal__title'
    title.id = 'modal-title'
    title.textContent = this._title

    header.appendChild(title)

    if (this._closable) {
      const closeBtn = document.createElement('button')
      closeBtn.className = 'modal__close'
      closeBtn.textContent = '\u00d7'
      closeBtn.setAttribute('aria-label', 'Cerrar')
      header.appendChild(closeBtn)
    }

    const body = document.createElement('div')
    body.className = 'modal__body'

    if (this._content instanceof Node) {
      body.appendChild(this._content)
    } else if (typeof this._content === 'string') {
      body.textContent = this._content
    }

    container.appendChild(header)
    container.appendChild(body)

    if (this._footer) {
      const footerEl = document.createElement('div')
      footerEl.className = 'modal__footer'
      if (this._footer instanceof Node) {
        footerEl.appendChild(this._footer)
      }
      container.appendChild(footerEl)
    }

    this._element.appendChild(overlay)
    this._element.appendChild(container)

    document.body.appendChild(this._element)

    requestAnimationFrame(() => {
      this._element.classList.add('modal--open')
      this._focusFirst()
    })

    this._element.addEventListener('click', (e) => {
      if (e.target === overlay && this._closable) {
        this.close()
      }
    })

    const closeBtn = header.querySelector('.modal__close')
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close())
    }

    document.addEventListener('keydown', this._handleKeydown)
  }

  close() {
    if (!this._element) return

    if (this._onClose) this._onClose()

    document.removeEventListener('keydown', this._handleKeydown)

    this._destroy()

    if (this._previousFocused && this._previousFocused.focus) {
      this._previousFocused.focus()
    }
  }

  _destroy() {
    if (this._element && this._element.parentNode) {
      this._element.parentNode.removeChild(this._element)
    }
    this._element = null
  }

  _focusFirst() {
    const container = this._element.querySelector('.modal__container')
    if (!container) return
    const focusable = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    if (focusable.length > 0) {
      focusable[0].focus()
    }
  }

  _getFocusable() {
    const container = this._element.querySelector('.modal__container')
    if (!container) return []
    return Array.from(container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
  }

  _handleKeydown = (e) => {
    if (e.key === 'Escape' && this._closable) {
      e.preventDefault()
      this.close()
      return
    }

    if (e.key === 'Tab') {
      const focusable = this._getFocusable()
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
  }
}
