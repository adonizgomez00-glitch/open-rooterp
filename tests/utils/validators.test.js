import {
  validateRequired, validateEmail, validateUrl,
  validateDocumentId, validatePhone, validatePositiveNumber,
  validateInteger, validateMinMax, validateLength,
  validateEnum, validateCUI, validateNIT, composeValidators
} from '../../src/utils/validators.js'

export function runValidatorsTests() {
  let assert = (condition, message) => {
    if (!condition) throw new Error(message || 'Assertion failed')
  }

  console.log('\n--- Validators Tests ---\n')

  function testValidateRequired() {
    let r = validateRequired('')
    assert(r.valid === false, 'validateRequired vacio falla')
    assert(r.errors.length > 0, 'validateRequired devuelve error')

    r = validateRequired(null)
    assert(r.valid === false, 'validateRequired null falla')

    r = validateRequired('texto')
    assert(r.valid === true, 'validateRequired con texto pasa')

    r = validateRequired(0)
    assert(r.valid === true, 'validateRequired con 0 pasa')

    console.log('  \u2713 testValidateRequired')
  }

  function testValidateEmail() {
    let r = validateEmail('invalido')
    assert(r.valid === false, 'validateEmail invalido falla')

    r = validateEmail('test@example.com')
    assert(r.valid === true, 'validateEmail valido pasa')

    r = validateEmail('')
    assert(r.valid === true, 'validateEmail vacio pasa')

    r = validateEmail(null)
    assert(r.valid === true, 'validateEmail null pasa')

    console.log('  \u2713 testValidateEmail')
  }

  function testValidateUrl() {
    let r = validateUrl('not-a-url')
    assert(r.valid === false, 'validateUrl invalido falla')

    r = validateUrl('https://ejemplo.com')
    assert(r.valid === true, 'validateUrl https pasa')

    r = validateUrl('http://ejemplo.com')
    assert(r.valid === true, 'validateUrl http pasa')

    r = validateUrl('')
    assert(r.valid === true, 'validateUrl vacio pasa')

    console.log('  \u2713 testValidateUrl')
  }

  function testValidateDocumentId() {
    let r = validateDocumentId('CUI-1234567890123')
    assert(r.valid === true, 'validateDocumentId con guion pasa')

    r = validateDocumentId('abc 123')
    assert(r.valid === false, 'validateDocumentId con espacio falla')

    r = validateDocumentId('')
    assert(r.valid === true, 'validateDocumentId vacio pasa')

    console.log('  \u2713 testValidateDocumentId')
  }

  function testValidatePhone() {
    let r = validatePhone('999888777')
    assert(r.valid === true, 'validatePhone solo digitos pasa')

    r = validatePhone('+51 999 888 777')
    assert(r.valid === true, 'validatePhone con formato pasa')

    r = validatePhone('texto')
    assert(r.valid === false, 'validatePhone texto falla')

    r = validatePhone('')
    assert(r.valid === true, 'validatePhone vacio pasa')

    console.log('  \u2713 testValidatePhone')
  }

  function testValidatePositiveNumber() {
    let r = validatePositiveNumber(5)
    assert(r.valid === true, 'validatePositiveNumber positivo pasa')

    r = validatePositiveNumber(0)
    assert(r.valid === true, 'validatePositiveNumber cero pasa')

    r = validatePositiveNumber(-1)
    assert(r.valid === false, 'validatePositiveNumber negativo falla')

    r = validatePositiveNumber(null)
    assert(r.valid === false, 'validatePositiveNumber null falla')

    console.log('  \u2713 testValidatePositiveNumber')
  }

  function testValidateInteger() {
    let r = validateInteger(5)
    assert(r.valid === true, 'validateInteger entero pasa')

    r = validateInteger(5.5)
    assert(r.valid === false, 'validateInteger decimal falla')

    r = validateInteger(null)
    assert(r.valid === false, 'validateInteger null falla')

    r = validateInteger('abc')
    assert(r.valid === false, 'validateInteger string no numerico falla')

    console.log('  \u2713 testValidateInteger')
  }

  function testValidateMinMax() {
    let r = validateMinMax(5, 1, 10)
    assert(r.valid === true, 'validateMinMax dentro del rango pasa')

    r = validateMinMax(0, 1, 10)
    assert(r.valid === false, 'validateMinMax menor a min falla')
    assert(r.errors[0].includes('1'), 'validateMinMax mensaje incluye min')

    r = validateMinMax(15, 1, 10)
    assert(r.valid === false, 'validateMinMax mayor a max falla')
    assert(r.errors[0].includes('10'), 'validateMinMax mensaje incluye max')

    r = validateMinMax(null, 1, 10)
    assert(r.valid === true, 'validateMinMax null pasa')

    console.log('  \u2713 testValidateMinMax')
  }

  function testValidateLength() {
    let r = validateLength('abc', 3, 5)
    assert(r.valid === true, 'validateLength dentro del rango pasa')

    r = validateLength('ab', 3, 5)
    assert(r.valid === false, 'validateLength menor a min falla')

    r = validateLength('abcdef', 3, 5)
    assert(r.valid === false, 'validateLength mayor a max falla')

    r = validateLength('', 3, 5)
    assert(r.valid === true, 'validateLength vacio pasa')

    console.log('  \u2713 testValidateLength')
  }

  function testValidateEnum() {
    let r = validateEnum('active', ['active', 'inactive'])
    assert(r.valid === true, 'validateEnum valor permitido pasa')

    r = validateEnum('unknown', ['active', 'inactive'])
    assert(r.valid === false, 'validateEnum valor no permitido falla')

    r = validateEnum('', ['active', 'inactive'])
    assert(r.valid === true, 'validateEnum vacio pasa')

    console.log('  \u2713 testValidateEnum')
  }

  function testValidateCUI() {
    let r = validateCUI('1234567890123')
    assert(r.valid === true, 'validateCUI 13 digitos pasa')

    r = validateCUI('12345678')
    assert(r.valid === false, 'validateCUI 8 digitos falla')

    r = validateCUI('')
    assert(r.valid === true, 'validateCUI vacio pasa')

    r = validateCUI(null)
    assert(r.valid === true, 'validateCUI null pasa')

    console.log('  \u2713 testValidateCUI')
  }

  function testValidateNIT() {
    let r = validateNIT('12345678-9')
    assert(r.valid === true, 'validateNIT formato valido pasa')

    r = validateNIT('1234567-9')
    assert(r.valid === true, 'validateNIT 7 digitos pasa')

    r = validateNIT('123456789')
    assert(r.valid === false, 'validateNIT sin guion falla')

    r = validateNIT('12345678')
    assert(r.valid === false, 'validateNIT solo digitos falla')

    r = validateNIT('')
    assert(r.valid === true, 'validateNIT vacio pasa')

    console.log('  \u2713 testValidateNIT')
  }

  function testComposeValidators() {
    const validator = composeValidators(
      validateRequired,
      (val) => validateLength(val, 3, 10)
    )

    let r = validator('')
    assert(r.valid === false, 'composeValidators required falla primero')

    r = validator('ab')
    assert(r.valid === false, 'composeValidators length falla segundo')

    r = validator('abc')
    assert(r.valid === true, 'composeValidators todo valido pasa')

    console.log('  \u2713 testComposeValidators')
  }

  testValidateRequired()
  testValidateEmail()
  testValidateUrl()
  testValidateDocumentId()
  testValidatePhone()
  testValidatePositiveNumber()
  testValidateInteger()
  testValidateMinMax()
  testValidateLength()
  testValidateEnum()
  testValidateCUI()
  testValidateNIT()
  testComposeValidators()

  console.log('\n\u2713 Todos los tests de Validators pasaron\n')
}
