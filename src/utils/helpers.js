export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

export function generateId() {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${random}`
}

export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (Array.isArray(obj)) return obj.map(deepClone)
  const cloned = {}
  for (const key of Object.keys(obj)) {
    cloned[key] = deepClone(obj[key])
  }
  return cloned
}

export function truncate(str, maxLength = 100) {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength).trimEnd() + '...'
}

export function groupBy(arr, key) {
  if (!Array.isArray(arr)) return {}
  return arr.reduce((acc, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key]
    if (!acc[groupKey]) acc[groupKey] = []
    acc[groupKey].push(item)
    return acc
  }, {})
}

export function sortBy(arr, key, asc = true) {
  if (!Array.isArray(arr)) return []
  const copy = [...arr]
  copy.sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    if (aVal == null) return 1
    if (bVal == null) return -1
    if (typeof aVal === 'number') return asc ? aVal - bVal : bVal - aVal
    const cmp = String(aVal).localeCompare(String(bVal))
    return asc ? cmp : -cmp
  })
  return copy
}

export function pick(obj, keys) {
  if (!obj || typeof obj !== 'object') return {}
  const result = {}
  for (const key of keys) {
    if (key in obj) result[key] = obj[key]
  }
  return result
}

export function omit(obj, keys) {
  if (!obj || typeof obj !== 'object') return {}
  const keySet = new Set(keys)
  const result = {}
  for (const key of Object.keys(obj)) {
    if (!keySet.has(key)) result[key] = obj[key]
  }
  return result
}

export function parseNumber(value) {
  if (value == null || value === '') return null
  const num = Number(value)
  return Number.isNaN(num) ? null : num
}

export function isEmpty(value) {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

export function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild)
  }
}

export function formatError(error) {
  if (!error) return ''
  if (typeof error === 'string') return error
  if (error.message) return error.message
  return 'Error desconocido'
}
