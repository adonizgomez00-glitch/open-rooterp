export class Table {
  constructor({ columns = [], data = [], onRowClick = null, emptyMessage = 'No hay registros' } = {}) {
    this._columns = columns
    this._data = data
    this._onRowClick = onRowClick
    this._emptyMessage = emptyMessage
    this._sortKey = null
    this._sortAsc = true
    this._element = null
  }

  setData(data) {
    this._data = data
    if (this._element) {
      this._renderBody()
    }
  }

  render() {
    const wrapper = document.createElement('div')
    wrapper.className = 'table-wrapper'
    wrapper.setAttribute('role', 'region')
    wrapper.setAttribute('aria-label', 'Tabla de datos')

    const table = document.createElement('table')
    table.className = 'table'

    const thead = document.createElement('thead')
    thead.className = 'table__head'

    const headerRow = document.createElement('tr')

    for (const col of this._columns) {
      const th = document.createElement('th')
      th.className = 'table__th'
      th.setAttribute('scope', 'col')

      if (col.sortable !== false) {
        th.classList.add('table__th--sortable')
        th.setAttribute('aria-sort', this._sortKey === col.key ? (this._sortAsc ? 'ascending' : 'descending') : 'none')
        th.setAttribute('tabindex', '0')
        th.setAttribute('role', 'columnheader')
        th.addEventListener('click', () => this._sort(col.key))
        th.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            this._sort(col.key)
          }
        })
      }

      th.textContent = col.label || col.key

      if (this._sortKey === col.key) {
        th.textContent += this._sortAsc ? ' \u25b2' : ' \u25bc'
      }

      if (col.width) {
        th.style.width = col.width
      }

      headerRow.appendChild(th)
    }

    thead.appendChild(headerRow)
    table.appendChild(thead)

    const tbody = document.createElement('tbody')
    tbody.className = 'table__body'
    table.appendChild(tbody)

    wrapper.appendChild(table)
    this._element = wrapper
    this._tbody = tbody

    this._renderBody()

    return wrapper
  }

  _sort(key) {
    if (this._sortKey === key) {
      this._sortAsc = !this._sortAsc
    } else {
      this._sortKey = key
      this._sortAsc = true
    }

    this._data.sort((a, b) => {
      const aVal = a[key]
      const bVal = b[key]

      if (aVal == null) return 1
      if (bVal == null) return -1

      if (typeof aVal === 'number') {
        return this._sortAsc ? aVal - bVal : bVal - aVal
      }

      const cmp = String(aVal).localeCompare(String(bVal))
      return this._sortAsc ? cmp : -cmp
    })

    this._renderBody()
    this._updateHeaders()
  }

  _renderBody() {
    this._tbody.innerHTML = ''

    if (this._data.length === 0) {
      const row = document.createElement('tr')
      const cell = document.createElement('td')
      cell.className = 'table__empty'
      cell.textContent = this._emptyMessage
      cell.colSpan = this._columns.length
      row.appendChild(cell)
      this._tbody.appendChild(row)
      return
    }

    const fragment = document.createDocumentFragment()
    for (const item of this._data) {
      const row = document.createElement('tr')
      row.className = 'table__row'

      if (this._onRowClick) {
        row.classList.add('table__row--clickable')
        row.setAttribute('tabindex', '0')
        row.setAttribute('role', 'button')
        row.addEventListener('click', () => this._onRowClick(item))
        row.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            this._onRowClick(item)
          }
        })
      }

      for (const col of this._columns) {
        const cell = document.createElement('td')
        cell.className = 'table__td'

        if (col.render) {
          const rendered = col.render(item[col.key], item)
          if (rendered instanceof Node) {
            cell.appendChild(rendered)
          } else {
            cell.textContent = String(rendered ?? '')
          }
        } else {
          cell.textContent = String(item[col.key] ?? '')
        }

        row.appendChild(cell)
      }

      fragment.appendChild(row)
    }
    this._tbody.appendChild(fragment)
  }

  _updateHeaders() {
    const ths = this._element.querySelectorAll('.table__th')
    for (let i = 0; i < this._columns.length; i++) {
      const col = this._columns[i]
      let label = col.label || col.key
      if (this._sortKey === col.key) {
        label += this._sortAsc ? ' \u25b2' : ' \u25bc'
        ths[i].setAttribute('aria-sort', this._sortAsc ? 'ascending' : 'descending')
      } else {
        ths[i].setAttribute('aria-sort', 'none')
      }
      ths[i].textContent = label
    }
  }
}
