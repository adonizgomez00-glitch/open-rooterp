export class Pagination {
  constructor({ totalItems = 0, itemsPerPage = 20, currentPage = 1, onPageChange = null } = {}) {
    this._totalItems = totalItems
    this._itemsPerPage = itemsPerPage
    this._currentPage = currentPage
    this._onPageChangeCb = onPageChange
    this._element = null
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this._totalItems / this._itemsPerPage))
  }

  setTotalItems(total) {
    this._totalItems = total
    if (this._currentPage > this.totalPages) {
      this._currentPage = this.totalPages
    }
    if (this._element) {
      this._render()
    }
  }

  setCurrentPage(page) {
    if (page < 1 || page > this.totalPages) return
    this._currentPage = page
    if (this._element) {
      this._render()
    }
  }

  getCurrentPage() {
    return this._currentPage
  }

  getItemsPerPage() {
    return this._itemsPerPage
  }

  getOffset() {
    return (this._currentPage - 1) * this._itemsPerPage
  }

  getLimit() {
    return this._itemsPerPage
  }

  onPageChange(callback) {
    this._onPageChangeCb = callback
  }

  render() {
    if (!this._element) {
      this._element = document.createElement('nav')
      this._element.className = 'pagination'
      this._element.setAttribute('role', 'navigation')
      this._element.setAttribute('aria-label', 'Paginación')
    }

    this._element.innerHTML = ''

    if (this.totalPages <= 1) {
      return this._element
    }

    const info = document.createElement('span')
    info.className = 'pagination__info'
    const start = (this._currentPage - 1) * this._itemsPerPage + 1
    const end = Math.min(this._currentPage * this._itemsPerPage, this._totalItems)
    info.textContent = `${start}-${end} de ${this._totalItems}`
    this._element.appendChild(info)

    const controls = document.createElement('div')
    controls.className = 'pagination__controls'

    const prevBtn = this._createButton('\u00ab Anterior', this._currentPage > 1, () => {
      if (this._currentPage > 1) {
        this._goToPage(this._currentPage - 1)
      }
    })
    prevBtn.setAttribute('aria-label', 'Página anterior')
    controls.appendChild(prevBtn)

    const pages = this._getPageNumbers()
    for (const p of pages) {
      if (p === '...') {
        const ellipsis = document.createElement('span')
        ellipsis.className = 'pagination__ellipsis'
        ellipsis.textContent = '...'
        controls.appendChild(ellipsis)
      } else {
        const pageBtn = this._createButton(String(p), true, () => {
          this._goToPage(p)
        }, p === this._currentPage)
        controls.appendChild(pageBtn)
      }
    }

    const nextBtn = this._createButton('Siguiente \u00bb', this._currentPage < this.totalPages, () => {
      if (this._currentPage < this.totalPages) {
        this._goToPage(this._currentPage + 1)
      }
    })
    nextBtn.setAttribute('aria-label', 'Página siguiente')
    controls.appendChild(nextBtn)

    this._element.appendChild(controls)
    return this._element
  }

  _createButton(text, enabled, onClick, isActive = false) {
    const btn = document.createElement('button')
    btn.className = 'pagination__btn'
    if (isActive) {
      btn.classList.add('pagination__btn--active')
      btn.setAttribute('aria-current', 'page')
    }
    if (!enabled) {
      btn.disabled = true
      btn.classList.add('pagination__btn--disabled')
    }
    btn.textContent = text
    btn.addEventListener('click', onClick)
    return btn
  }

  _getPageNumbers() {
    const total = this.totalPages
    const current = this._currentPage
    const pages = []

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i)
      }
      return pages
    }

    pages.push(1)

    if (current > 3) {
      pages.push('...')
    }

    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (current < total - 2) {
      pages.push('...')
    }

    pages.push(total)
    return pages
  }

  _goToPage(page) {
    if (page < 1 || page > this.totalPages || page === this._currentPage) return
    this._currentPage = page
    this._render()
    if (this._onPageChangeCb) {
      this._onPageChangeCb(this._currentPage)
    }
  }
}
