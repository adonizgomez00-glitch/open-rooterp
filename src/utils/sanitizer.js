const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;'
}

const RE_HTML = /[&<>"']/g
const RE_TAGS = /<[^>]*>/g

export function escapeHtml(str) {
  if (typeof str !== 'string') return ''
  return str.replace(RE_HTML, (c) => HTML_ENTITIES[c])
}

export function stripTags(str) {
  if (typeof str !== 'string') return ''
  return str.replace(RE_TAGS, '')
}

export function sanitizeString(str) {
  if (typeof str !== 'string') return ''
  return str.trim().replace(/\s+/g, ' ')
}

export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return {}
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value)
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value)
    } else {
      result[key] = value
    }
  }
  return result
}

export function sanitizeNumeric(str) {
  if (typeof str !== 'string') return ''
  return str.replace(/[^0-9.]/g, '')
}

export function sanitizeAlphanumeric(str) {
  if (typeof str !== 'string') return ''
  return str.replace(/[^a-zA-Z0-9\s\-_]/g, '')
}
