const ICONS = {
  success: '\u2713',
  error: '\u2717',
  warning: '\u26a0',
  info: '\u2139'
}

const COLORS = {
  success: 'toast--success',
  error: 'toast--error',
  warning: 'toast--warning',
  info: 'toast--info'
}

let container = null

function getContainer() {
  if (!container) {
    container = document.createElement('div')
    container.className = 'toast-container'
    document.body.appendChild(container)
  }
  return container
}

export class Toast {
  static show({ message = '', type = 'info', duration = 3000 } = {}) {
    const typeClass = COLORS[type] || COLORS.info

    const toast = document.createElement('div')
    toast.className = `toast ${typeClass}`
    toast.setAttribute('role', type === 'error' || type === 'success' ? 'alert' : 'status')

    const icon = document.createElement('span')
    icon.className = 'toast__icon'
    icon.textContent = ICONS[type] || ICONS.info

    const text = document.createElement('span')
    text.className = 'toast__message'
    text.textContent = message

    const closeBtn = document.createElement('button')
    closeBtn.className = 'toast__close'
    closeBtn.textContent = '\u00d7'
    closeBtn.setAttribute('aria-label', 'Cerrar')

    toast.appendChild(icon)
    toast.appendChild(text)
    toast.appendChild(closeBtn)

    const toastContainer = getContainer()
    toastContainer.appendChild(toast)

    closeBtn.addEventListener('click', () => {
      remove(toast)
    })

    if (duration > 0) {
      setTimeout(() => remove(toast), duration)
    }

    return toast
  }

  static success(message, duration) {
    return Toast.show({ message, type: 'success', duration })
  }

  static error(message, duration) {
    return Toast.show({ message, type: 'error', duration })
  }

  static warning(message, duration) {
    return Toast.show({ message, type: 'warning', duration })
  }

  static info(message, duration) {
    return Toast.show({ message, type: 'info', duration })
  }
}

function remove(toast) {
  if (!toast || !toast.parentNode) return
  toast.classList.add('toast--removing')

  toast.addEventListener('animationend', () => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast)
    }
    if (container && container.children.length === 0) {
      container.parentNode.removeChild(container)
      container = null
    }
  }, { once: true })
}
