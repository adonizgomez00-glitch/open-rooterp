const STORAGE_KEY = 'open-rooterp-theme'

export class ThemeManager {
  static _instance = null

  static getInstance() {
    if (!ThemeManager._instance) {
      ThemeManager._instance = new ThemeManager()
    }
    return ThemeManager._instance
  }

  constructor() {
    this._currentTheme = 'light'
    this._listeners = []
  }

  init() {
    const saved = localStorage.getItem(STORAGE_KEY)
    this._currentTheme = saved === 'dark' ? 'dark' : 'light'
    this._apply()
  }

  getCurrentTheme() {
    return this._currentTheme
  }

  isDark() {
    return this._currentTheme === 'dark'
  }

  toggle() {
    this._currentTheme = this._currentTheme === 'light' ? 'dark' : 'light'
    this._persist()
    this._apply()
    this._notify()
    return this._currentTheme
  }

  setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') return
    this._currentTheme = theme
    this._persist()
    this._apply()
    this._notify()
  }

  onChange(callback) {
    this._listeners.push(callback)
  }

  _apply() {
    if (this._currentTheme === 'dark') {
      document.documentElement.classList.add('theme-dark')
    } else {
      document.documentElement.classList.remove('theme-dark')
    }
  }

  _persist() {
    localStorage.setItem(STORAGE_KEY, this._currentTheme)
  }

  _notify() {
    for (const cb of this._listeners) {
      cb(this._currentTheme)
    }
  }

  renderToggle() {
    const btn = document.createElement('button')
    btn.className = 'btn btn--sm btn--ghost'
    btn.setAttribute('aria-label', 'Cambiar tema')
    btn.title = this._currentTheme === 'light' ? 'Modo oscuro' : 'Modo claro'
    btn.textContent = this._currentTheme === 'light' ? '\u263e' : '\u2600'

    btn.addEventListener('click', () => {
      this.toggle()
      btn.title = this._currentTheme === 'light' ? 'Modo oscuro' : 'Modo claro'
      btn.textContent = this._currentTheme === 'light' ? '\u263e' : '\u2600'
    })

    this.onChange((theme) => {
      btn.title = theme === 'light' ? 'Modo oscuro' : 'Modo claro'
      btn.textContent = theme === 'light' ? '\u263e' : '\u2600'
    })

    return btn
  }
}
