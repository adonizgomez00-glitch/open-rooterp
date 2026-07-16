export class Header {
  constructor({ title = '', actions = [], onMenuToggle = null } = {}) {
    this._title = title
    this._actions = actions
    this._onMenuToggle = onMenuToggle
    this._element = null
  }

  setTitle(title) {
    this._title = title
    if (this._element) {
      const titleEl = this._element.querySelector('.header__title')
      if (titleEl) titleEl.textContent = title
    }
  }

  render() {
    const header = document.createElement('header')
    header.className = 'header'

    const left = document.createElement('div')
    left.className = 'header__left'

    const menuBtn = document.createElement('button')
    menuBtn.className = 'header__menu-toggle'
    menuBtn.textContent = '\u2630'
    menuBtn.setAttribute('aria-label', 'Abrir menú')

    if (this._onMenuToggle) {
      menuBtn.addEventListener('click', this._onMenuToggle)
    }

    const title = document.createElement('h1')
    title.className = 'header__title'
    title.textContent = this._title

    left.appendChild(menuBtn)
    left.appendChild(title)
    header.appendChild(left)

    const right = document.createElement('div')
    right.className = 'header__right'

    for (const action of this._actions) {
      if (action instanceof Node) {
        right.appendChild(action)
      } else if (action.render) {
        right.appendChild(action.render())
      }
    }

    header.appendChild(right)

    this._element = header
    return header
  }
}
