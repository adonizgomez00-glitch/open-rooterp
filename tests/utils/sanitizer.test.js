import {
  escapeHtml, stripTags, sanitizeString,
  sanitizeObject, sanitizeNumeric, sanitizeAlphanumeric
} from '../../src/utils/sanitizer.js'

export function runSanitizerTests() {
  let assert = (condition, message) => {
    if (!condition) throw new Error(message || 'Assertion failed')
  }

  console.log('\n--- Sanitizer Tests ---\n')

  function testEscapeHtml() {
    assert(escapeHtml('<script>alert("xss")</script>') === '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;', 'escapeHtml escapa tags y comillas')
    assert(escapeHtml("it's") === 'it&#x27;s', 'escapeHtml escapa comilla simple')
    assert(escapeHtml('safe text') === 'safe text', 'escapeHtml texto seguro')
    assert(escapeHtml(null) === '', 'escapeHtml null devuelve vacio')
    assert(escapeHtml(123) === '', 'escapeHtml numero devuelve vacio')
    console.log('  \u2713 testEscapeHtml')
  }

  function testStripTags() {
    assert(stripTags('<p>Hola</p>') === 'Hola', 'stripTags elimina tags simples')
    assert(stripTags('<div><span>texto</span></div>') === 'texto', 'stripTags elimina tags anidados')
    assert(stripTags('sin tags') === 'sin tags', 'stripTags sin tags no cambia')
    assert(stripTags(null) === '', 'stripTags null devuelve vacio')
    console.log('  \u2713 testStripTags')
  }

  function testSanitizeString() {
    assert(sanitizeString('  hola   mundo  ') === 'hola mundo', 'sanitizeString normaliza espacios')
    assert(sanitizeString('\ttexto\n') === 'texto', 'sanitizeString elimina tabs y newlines')
    assert(sanitizeString(null) === '', 'sanitizeString null devuelve vacio')
    console.log('  \u2713 testSanitizeString')
  }

  function testSanitizeObject() {
    const input = { name: '  Juan  ', age: 25, nested: { city: '  Lima  ' } }
    const result = sanitizeObject(input)
    assert(result.name === 'Juan', 'sanitizeObject normaliza strings')
    assert(result.age === 25, 'sanitizeObject mantiene numeros')
    assert(result.nested.city === 'Lima', 'sanitizeObject procesa objetos anidados')
    assert(Object.keys(sanitizeObject(null)).length === 0, 'sanitizeObject null devuelve {}')
    console.log('  \u2713 testSanitizeObject')
  }

  function testSanitizeNumeric() {
    assert(sanitizeNumeric('abc123def') === '123', 'sanitizeNumeric solo deja numeros')
    assert(sanitizeNumeric('12.5') === '12.5', 'sanitizeNumeric permite punto decimal')
    assert(sanitizeNumeric(null) === '', 'sanitizeNumeric null devuelve vacio')
    console.log('  \u2713 testSanitizeNumeric')
  }

  function testSanitizeAlphanumeric() {
    assert(sanitizeAlphanumeric('hola-mundo_123') === 'hola-mundo_123', 'sanitizeAlphanumeric mantiene alfanumerico, guiones y espacios')
    assert(sanitizeAlphanumeric('hola@mundo!') === 'holamundo', 'sanitizeAlphanumeric elimina especiales')
    assert(sanitizeAlphanumeric(null) === '', 'sanitizeAlphanumeric null devuelve vacio')
    console.log('  \u2713 testSanitizeAlphanumeric')
  }

  testEscapeHtml()
  testStripTags()
  testSanitizeString()
  testSanitizeObject()
  testSanitizeNumeric()
  testSanitizeAlphanumeric()

  console.log('\n\u2713 Todos los tests de Sanitizer pasaron\n')
}
