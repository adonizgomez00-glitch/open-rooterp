const DATE_OPTIONS = { year: 'numeric', month: '2-digit', day: '2-digit' }
const DATETIME_OPTIONS = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }

let _currencySymbol = 'Q '
let _taxRate = 0.12

export function setCurrencySymbol(symbol) {
  _currencySymbol = symbol || 'Q '
}

export function setTaxRate(rate) {
  _taxRate = Number(rate) || 0.12
}

export function getTaxRate() {
  return _taxRate
}

export function formatCurrency(value, symbol) {
  const s = symbol ?? _currencySymbol
  if (value == null || Number.isNaN(Number(value))) return `${s}0.00`
  return `${s}${Number(value).toFixed(2)}`
}

export function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-GT', DATE_OPTIONS)
}

export function formatDateTime(date) {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-GT', DATETIME_OPTIONS)
}

export function formatDocumentId(value) {
  if (!value) return ''
  return value.toString().toUpperCase()
}

export function formatPhone(value) {
  if (!value) return ''
  const digits = value.toString().replace(/\D/g, '')
  if (digits.length === 8) return digits.replace(/(\d{4})(\d{4})/, '$1-$2')
  return value
}
