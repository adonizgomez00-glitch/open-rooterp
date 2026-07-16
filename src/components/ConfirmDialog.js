import { Modal } from './Modal.js'

export class ConfirmDialog {
  constructor({ title = 'Confirmar', message = '', confirmText = 'Aceptar', cancelText = 'Cancelar',
    onConfirm = null, onCancel = null, danger = false } = {}) {
    this._title = title
    this._message = message
    this._confirmText = confirmText
    this._cancelText = cancelText
    this._onConfirm = onConfirm
    this._onCancel = onCancel
    this._danger = danger
    this._modal = null
    this._resolver = null
  }

  confirm() {
    return new Promise((resolve) => {
      this._resolver = resolve

      const body = document.createElement('div')

      const msg = document.createElement('p')
      msg.className = 'confirm-dialog__message'
      msg.id = 'confirm-message'
      msg.textContent = this._message

      body.appendChild(msg)

      const footer = document.createElement('div')
      footer.className = 'confirm-dialog__footer'

      const cancelBtn = document.createElement('button')
      cancelBtn.className = 'btn btn--secondary'
      cancelBtn.textContent = this._cancelText

      const confirmBtn = document.createElement('button')
      confirmBtn.className = `btn ${this._danger ? 'btn--danger' : 'btn--primary'}`
      confirmBtn.textContent = this._confirmText

      footer.appendChild(cancelBtn)
      footer.appendChild(confirmBtn)
      body.appendChild(footer)

      this._modal = new Modal({
        title: this._title,
        content: body,
        size: 'sm',
        closable: false
      })

      this._modal.onClose = () => {
        this._resolve(false)
      }

      cancelBtn.addEventListener('click', () => this._resolve(false))
      confirmBtn.addEventListener('click', () => this._resolve(true))

      this._modal.open()
      const container = this._modal._element?.querySelector('.modal__container')
      if (container) {
        container.setAttribute('aria-describedby', 'confirm-message')
      }
    })
  }

  _resolve(result) {
    if (result && this._onConfirm) this._onConfirm()
    if (!result && this._onCancel) this._onCancel()

    if (this._modal) {
      this._modal.onClose = null
      this._modal.close()
      this._modal = null
    }

    if (this._resolver) {
      this._resolver(result)
      this._resolver = null
    }
  }
}
