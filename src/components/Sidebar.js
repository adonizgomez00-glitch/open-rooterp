export class Sidebar {
  constructor({ items = [], onNavigate = null, brandName = 'ERP Ligero', brandIcon = '\u2699' } = {}) {
    this._items = items
    this._onNavigate = onNavigate
    this._brandName = brandName
    this._brandIcon = brandIcon
    this._activeId = null
    this._element = null
  }

  setActive(id) {
    this._activeId = id
    if (this._element) {
      this._updateActive()
    }
  }

  render() {
    const sidebar = document.createElement('aside')
    sidebar.className = 'sidebar'
    sidebar.setAttribute('role', 'navigation')
    sidebar.setAttribute('aria-label', 'Navegación principal')

    const brand = document.createElement('div')
    brand.className = 'sidebar__brand'

    const icon = document.createElement('span')
    icon.className = 'sidebar__brand-icon'
    icon.textContent = this._brandIcon

    const name = document.createElement('span')
    name.className = 'sidebar__brand-name'
    name.textContent = this._brandName

    brand.appendChild(icon)
    brand.appendChild(name)
    sidebar.appendChild(brand)

    const nav = document.createElement('nav')
    nav.className = 'sidebar__nav'

    for (const [index, item] of this._items.entries()) {
      const btn = document.createElement('button')
      btn.className = 'sidebar__item'
      btn.dataset.id = item.id
      btn.setAttribute('type', 'button')

      if (item.icon) {
        const itemIcon = document.createElement('span')
        itemIcon.className = 'sidebar__item-icon'
        itemIcon.textContent = item.icon
        btn.appendChild(itemIcon)
      }

      const label = document.createElement('span')
      label.textContent = item.label
      btn.appendChild(label)

      btn.addEventListener('click', () => {
        this.setActive(item.id)
        if (this._onNavigate) {
          this._onNavigate(item.id, item)
        }
        this._closeMobile()
      })

      btn.addEventListener('keydown', (e) => {
        const buttons = Array.from(nav.querySelectorAll('.sidebar__item'))
        const idx = buttons.indexOf(e.currentTarget)

        switch (e.key) {
          case 'ArrowDown':
          case 'ArrowRight':
            e.preventDefault()
            if (idx < buttons.length - 1) buttons[idx + 1].focus()
            break
          case 'ArrowUp':
          case 'ArrowLeft':
            e.preventDefault()
            if (idx > 0) buttons[idx - 1].focus()
            break
          case 'Home':
            e.preventDefault()
            buttons[0].focus()
            break
          case 'End':
            e.preventDefault()
            buttons[buttons.length - 1].focus()
            break
        }
      })

      nav.appendChild(btn)
    }

    sidebar.appendChild(nav)
    this._element = sidebar

    this._updateActive()

    return sidebar
  }

  _updateActive() {
    const items = this._element.querySelectorAll('.sidebar__item')
    for (const item of items) {
      const isActive = item.dataset.id === this._activeId
      item.classList.toggle('sidebar__item--active', isActive)
      if (isActive) {
        item.setAttribute('aria-current', 'page')
      } else {
        item.removeAttribute('aria-current')
      }
    }
  }

  _closeMobile() {
    if (this._element) {
      this._element.classList.remove('sidebar--open')
    }
  }

  toggleMobile() {
    if (this._element) {
      this._element.classList.toggle('sidebar--open')
    }
  }
}
