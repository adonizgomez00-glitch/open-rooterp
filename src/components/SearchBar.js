import { APP_CONFIG } from '../config/app.js'

export class SearchBar {
  constructor({ placeholder = 'Buscar...', debounceMs = APP_CONFIG.DEBOUNCE_MS, onSearch = null } = {}) {
    this._placeholder = placeholder
    this._debounceMs = debounceMs
    this._onSearchCb = onSearch
    this._timeout = null
    this._element = null
    this._input = null
  }

  render() {
    const group = document.createElement('div')
    group.className = 'toolbar__search'
    group.setAttribute('role', 'search')

    const input = document.createElement('input')
    input.className = 'toolbar__input'
    input.type = 'text'
    input.placeholder = this._placeholder
    input.setAttribute('aria-label', this._placeholder)

    input.addEventListener('input', () => {
      clearTimeout(this._timeout)
      this._timeout = setTimeout(() => {
        if (this._onSearchCb) {
          this._onSearchCb(input.value)
        }
      }, this._debounceMs)
    })

    group.appendChild(input)
    this._element = group
    this._input = input
    return group
  }

  onSearch(callback) {
    this._onSearchCb = callback
  }

  getValue() {
    return this._input ? this._input.value : ''
  }

  setValue(value) {
    if (this._input) {
      this._input.value = value
    }
  }

  clear() {
    if (this._input) {
      this._input.value = ''
    }
  }

  focus() {
    if (this._input) {
      this._input.focus()
    }
  }
}
