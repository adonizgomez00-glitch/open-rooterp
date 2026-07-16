import {
  debounce, generateId, deepClone, truncate,
  groupBy, sortBy, pick, omit, parseNumber, isEmpty, formatError
} from '../../src/utils/helpers.js'

export async function runHelpersTests() {
  let assert = (condition, message) => {
    if (!condition) throw new Error(message || 'Assertion failed')
  }

  console.log('\n--- Helpers Tests ---\n')

  function testGenerateId() {
    const id1 = generateId()
    const id2 = generateId()
    assert(typeof id1 === 'string', 'generateId devuelve string')
    assert(id1.length > 5, 'generateId tiene longitud minima')
    assert(id1 !== id2, 'generateId genera ids unicos')
    console.log('  \u2713 testGenerateId')
  }

  function testDeepClone() {
    const original = { a: 1, b: { c: 2 }, d: [1, 2, 3] }
    const cloned = deepClone(original)
    assert(cloned.a === 1, 'deepClone copia valores primitivos')
    assert(cloned.b.c === 2, 'deepClone copia objetos anidados')
    assert(cloned.d.length === 3, 'deepClone copia arrays')

    cloned.b.c = 99
    assert(original.b.c === 2, 'deepClone no afecta original al modificar clon')

    assert(deepClone(null) === null, 'deepClone null devuelve null')
    assert(deepClone(42) === 42, 'deepClone numero devuelve numero')

    const date = new Date('2024-01-01')
    const dateClone = deepClone(date)
    assert(dateClone instanceof Date, 'deepClone clona Date')
    assert(dateClone.getTime() === date.getTime(), 'deepClone Date mantiene valor')

    console.log('  \u2713 testDeepClone')
  }

  function testTruncate() {
    assert(truncate('corto') === 'corto', 'truncate texto corto no cambia')
    assert(truncate('texto muy largo para truncar', 10) === 'texto muy...', 'truncate acorta texto largo')
    assert(truncate(null) === '', 'truncate null devuelve vacio')
    assert(truncate('') === '', 'truncate vacio devuelve vacio')
    console.log('  \u2713 testTruncate')
  }

  function testGroupBy() {
    const items = [
      { category: 'A', name: 'Item 1' },
      { category: 'B', name: 'Item 2' },
      { category: 'A', name: 'Item 3' }
    ]
    const grouped = groupBy(items, 'category')
    assert(grouped.A.length === 2, 'groupBy agrupa categoria A')
    assert(grouped.B.length === 1, 'groupBy agrupa categoria B')
    assert(Object.keys(groupBy(null, 'x')).length === 0, 'groupBy null devuelve {}')
    console.log('  \u2713 testGroupBy')
  }

  function testSortBy() {
    const items = [
      { name: 'Zeta', age: 30 },
      { name: 'Alpha', age: 25 },
      { name: 'Beta', age: 35 }
    ]

    const sorted = sortBy(items, 'name')
    assert(sorted[0].name === 'Alpha', 'sortBy ascendente')
    assert(sorted[2].name === 'Zeta', 'sortBy ascendente ultimo')

    const sortedDesc = sortBy(items, 'name', false)
    assert(sortedDesc[0].name === 'Zeta', 'sortBy descendente')

    const byAge = sortBy(items, 'age')
    assert(byAge[0].age === 25, 'sortBy number')

    assert(sortBy(null, 'name').length === 0, 'sortBy null devuelve []')

    console.log('  \u2713 testSortBy')
  }

  function testPick() {
    const obj = { a: 1, b: 2, c: 3 }
    const picked = pick(obj, ['a', 'c'])
    assert(picked.a === 1, 'pick incluye key a')
    assert(picked.c === 3, 'pick incluye key c')
    assert(picked.b === undefined, 'pick excluye key b')
    assert(Object.keys(pick(null, ['a'])).length === 0, 'pick null devuelve {}')
    console.log('  \u2713 testPick')
  }

  function testOmit() {
    const obj = { a: 1, b: 2, c: 3 }
    const omitted = omit(obj, ['a', 'c'])
    assert(omitted.b === 2, 'omit mantiene key b')
    assert(omitted.a === undefined, 'omit remueve key a')
    assert(Object.keys(omit(null, ['a'])).length === 0, 'omit null devuelve {}')
    console.log('  \u2713 testOmit')
  }

  function testParseNumber() {
    assert(parseNumber('123') === 123, 'parseNumber string numerico')
    assert(parseNumber('12.5') === 12.5, 'parseNumber decimal')
    assert(parseNumber('abc') === null, 'parseNumber string no numerico')
    assert(parseNumber(null) === null, 'parseNumber null')
    assert(parseNumber('') === null, 'parseNumber vacio')
    console.log('  \u2713 testParseNumber')
  }

  function testIsEmpty() {
    assert(isEmpty(null) === true, 'isEmpty null')
    assert(isEmpty('') === true, 'isEmpty string vacio')
    assert(isEmpty('  ') === true, 'isEmpty string con espacios')
    assert(isEmpty([]) === true, 'isEmpty array vacio')
    assert(isEmpty({}) === true, 'isEmpty objeto vacio')
    assert(isEmpty('texto') === false, 'isEmpty string no vacio')
    assert(isEmpty([1]) === false, 'isEmpty array con elementos')
    console.log('  \u2713 testIsEmpty')
  }

  function testFormatError() {
    assert(formatError('error') === 'error', 'formatError string')
    assert(formatError({ message: 'error msg' }) === 'error msg', 'formatError Error object')
    assert(formatError(null) === '', 'formatError null')
    assert(formatError(undefined) === '', 'formatError undefined')
    console.log('  \u2713 testFormatError')
  }

  function testDebounce() {
    return new Promise((resolve) => {
      let callCount = 0
      const fn = debounce(() => { callCount++ }, 50)

      fn()
      fn()
      fn()

      assert(callCount === 0, 'debounce no ejecuta inmediatamente')

      setTimeout(() => {
        assert(callCount === 1, 'debounce ejecuta una vez despues del delay')
        console.log('  \u2713 testDebounce')
        resolve()
      }, 100)
    })
  }

  await testDebounce()
  testGenerateId()
  testDeepClone()
  testTruncate()
  testGroupBy()
  testSortBy()
  testPick()
  testOmit()
  testParseNumber()
  testIsEmpty()
  testFormatError()

  console.log('\n\u2713 Todos los tests de Helpers pasaron\n')
}
