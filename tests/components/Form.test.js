import { Form } from '../../src/components/Form.js'

export function runFormTests() {
  let assert = (condition, message) => {
    if (!condition) throw new Error(message || 'Assertion failed')
  }

  console.log('\n--- Form Component Tests ---\n')

  function testRenderBasic() {
    const form = new Form({
      fields: [
        { name: 'name', label: 'Nombre', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email' }
      ],
      onSubmit: () => {}
    })

    const el = form.render()
    assert(el.tagName === 'FORM', 'Deberia crear un elemento form')
    assert(el.className === 'form', 'Deberia tener clase form')
    assert(form._inputs.size === 2, 'Deberia tener 2 inputs registrados')
    assert(form._inputs.get('name'), 'Deberia tener input name')
    assert(form._inputs.get('email'), 'Deberia tener input email')

    console.log('  \u2713 testRenderBasic')
  }

  function testRequiredValidation() {
    let submitted = false
    const form = new Form({
      fields: [
        { name: 'name', label: 'Nombre', type: 'text', required: true }
      ],
      onSubmit: () => { submitted = true }
    })

    form.render()
    const result = form._validateField('name')
    assert(result === false, 'Campo requerido vacio deberia fallar')
    assert(submitted === false, 'No deberia haber submit')

    const { errorEl } = form._inputs.get('name')
    assert(errorEl.style.display !== 'none', 'Error deberia mostrarse')
    assert(errorEl.textContent === 'Este campo es requerido', 'Mensaje de error correcto')

    console.log('  \u2713 testRequiredValidation')
  }

  function testEmailValidation() {
    const form = new Form({
      fields: [
        { name: 'email', label: 'Email', type: 'email' }
      ],
      onSubmit: () => {}
    })

    form.render()
    const { input, errorEl } = form._inputs.get('email')

    input._value = 'invalido'
    let result = form._validateField('email')
    assert(result === false, 'Email invalido deberia fallar')
    assert(errorEl.style.display !== 'none', 'Error deberia mostrarse')

    input._value = 'valido@email.com'
    result = form._validateField('email')
    assert(result === true, 'Email valido deberia pasar')
    assert(errorEl.style.display === 'none', 'Error deberia ocultarse')

    console.log('  \u2713 testEmailValidation')
  }

  function testUrlValidation() {
    const form = new Form({
      fields: [
        { name: 'web', label: 'Web', type: 'url' }
      ],
      onSubmit: () => {}
    })

    form.render()
    const { input, errorEl } = form._inputs.get('web')

    input._value = 'not-a-url'
    let result = form._validateField('web')
    assert(result === false, 'URL invalida deberia fallar')

    input._value = 'https://ejemplo.com'
    result = form._validateField('web')
    assert(result === true, 'URL valida deberia pasar')

    input._value = ''
    result = form._validateField('web')
    assert(result === true, 'URL vacia no requerida deberia pasar')

    console.log('  \u2713 testUrlValidation')
  }

  function testNumberValidation() {
    const form = new Form({
      fields: [
        { name: 'age', label: 'Edad', type: 'number', min: 0, max: 150 }
      ],
      onSubmit: () => {}
    })

    form.render()
    const { input, errorEl } = form._inputs.get('age')

    input._value = 'abc'
    let result = form._validateField('age')
    assert(result === false, 'Texto en number deberia fallar')
    assert(errorEl.textContent === 'Ingrese un número válido', 'Mensaje de numero invalido')

    input._value = '-1'
    result = form._validateField('age')
    assert(result === false, 'Numero menor a min deberia fallar')
    assert(errorEl.textContent === 'El valor mínimo es 0', 'Mensaje de min correcto')

    input._value = '200'
    result = form._validateField('age')
    assert(result === false, 'Numero mayor a max deberia fallar')
    assert(errorEl.textContent === 'El valor máximo es 150', 'Mensaje de max correcto')

    input._value = '25'
    result = form._validateField('age')
    assert(result === true, 'Numero valido deberia pasar')

    input._value = ''
    result = form._validateField('age')
    assert(result === true, 'Numero vacio no requerido deberia pasar')

    console.log('  \u2713 testNumberValidation')
  }

  function testMinlengthMaxlength() {
    const form = new Form({
      fields: [
        { name: 'code', label: 'Código', type: 'text', minlength: 3, maxlength: 10 }
      ],
      onSubmit: () => {}
    })

    form.render()
    const { input, errorEl } = form._inputs.get('code')

    input._value = 'ab'
    let result = form._validateField('code')
    assert(result === false, 'Texto menor a minlength deberia fallar')
    assert(errorEl.textContent.includes('3'), 'Mensaje de minlength correcto')

    input._value = 'abcdefghijk'
    result = form._validateField('code')
    assert(result === false, 'Texto mayor a maxlength deberia fallar')
    assert(errorEl.textContent.includes('10'), 'Mensaje de maxlength correcto')

    input._value = 'abc'
    result = form._validateField('code')
    assert(result === true, 'Texto dentro del rango deberia pasar')

    input._value = ''
    result = form._validateField('code')
    assert(result === true, 'Vacio sin required deberia pasar')

    console.log('  \u2713 testMinlengthMaxlength')
  }

  function testPatternValidation() {
    const form = new Form({
      fields: [
        {
          name: 'documentId',
          label: 'Documento',
          type: 'text',
          pattern: '^\\d{8,15}$',
          patternMessage: 'Debe tener entre 8 y 15 dígitos'
        }
      ],
      onSubmit: () => {}
    })

    form.render()
    const { input, errorEl } = form._inputs.get('documentId')

    input._value = 'abc123'
    let result = form._validateField('documentId')
    assert(result === false, 'Pattern sin match deberia fallar')
    assert(errorEl.textContent === 'Debe tener entre 8 y 15 dígitos', 'Mensaje de pattern correcto')

    input._value = '12345678'
    result = form._validateField('documentId')
    assert(result === true, 'Pattern con match deberia pasar')

    console.log('  \u2713 testPatternValidation')
  }

  function testCustomValidators() {
    const form = new Form({
      fields: [
        {
          name: 'password',
          label: 'Contraseña',
          type: 'text',
          validators: [
            (val) => val.length >= 6 ? true : 'Debe tener al menos 6 caracteres',
            (val) => /[A-Z]/.test(val) ? true : 'Debe contener mayúscula'
          ]
        }
      ],
      onSubmit: () => {}
    })

    form.render()
    const { input, errorEl } = form._inputs.get('password')

    input._value = 'abc'
    let result = form._validateField('password')
    assert(result === false, 'Primer validador deberia fallar')
    assert(errorEl.textContent === 'Debe tener al menos 6 caracteres', 'Mensaje del primer validador')

    input._value = 'abcdef'
    result = form._validateField('password')
    assert(result === false, 'Segundo validador deberia fallar')
    assert(errorEl.textContent === 'Debe contener mayúscula', 'Mensaje del segundo validador')

    input._value = 'Abcdef'
    result = form._validateField('password')
    assert(result === true, 'Ambos validadores deberian pasar')

    console.log('  \u2713 testCustomValidators')
  }

  function testValidateAll() {
    const form = new Form({
      fields: [
        { name: 'name', label: 'Nombre', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true }
      ],
      onSubmit: () => {}
    })

    form.render()
    const { input: nameInput } = form._inputs.get('name')
    const { input: emailInput } = form._inputs.get('email')

    nameInput._value = ''
    emailInput._value = ''
    let valid = form._validateAll()
    assert(valid === false, 'validateAll con campos vacios deberia fallar')

    nameInput._value = 'Juan'
    emailInput._value = ''
    valid = form._validateAll()
    assert(valid === false, 'validateAll con un campo vacio deberia fallar')

    nameInput._value = 'Juan'
    emailInput._value = 'juan@email.com'
    valid = form._validateAll()
    assert(valid === true, 'validateAll con todo valido deberia pasar')

    console.log('  \u2713 testValidateAll')
  }

  function testSubmitValidation() {
    let submitted = false
    let submittedData = null

    const form = new Form({
      fields: [
        { name: 'name', label: 'Nombre', type: 'text', required: true }
      ],
      onSubmit: (data) => {
        submitted = true
        submittedData = data
      }
    })

    const el = form.render()

    const submitEvent = { preventDefault: () => {} }
    el.dispatchEvent({ type: 'submit', preventDefault: submitEvent.preventDefault })

    assert(submitted === false, 'Submit con datos invalidos no deberia ejecutarse')

    const { input } = form._inputs.get('name')
    input._value = 'Juan'

    el.dispatchEvent({ type: 'submit', preventDefault: submitEvent.preventDefault })
    assert(submitted === true, 'Submit con datos validos deberia ejecutarse')
    assert(submittedData.name === 'Juan', 'Datos de submit correctos')

    console.log('  \u2713 testSubmitValidation')
  }

  function testGetValues() {
    const form = new Form({
      fields: [
        { name: 'name', type: 'text' },
        { name: 'age', type: 'number' },
        { name: 'email', type: 'email' }
      ],
      onSubmit: () => {}
    })

    form.render()
    const { input: nameInput } = form._inputs.get('name')
    const { input: ageInput } = form._inputs.get('age')
    const { input: emailInput } = form._inputs.get('email')

    nameInput._value = 'Juan'
    ageInput._value = '25'
    emailInput._value = 'juan@email.com'

    const values = form.getValues()
    assert(values.name === 'Juan', 'getValues deberia devolver name')
    assert(values.age === 25, 'getValues deberia convertir age a numero')
    assert(values.email === 'juan@email.com', 'getValues deberia devolver email')

    console.log('  \u2713 testGetValues')
  }

  function testSetValues() {
    const form = new Form({
      fields: [
        { name: 'name', type: 'text' },
        { name: 'email', type: 'email' }
      ],
      onSubmit: () => {}
    })

    form.render()
    form.setValues({ name: 'Maria', email: 'maria@email.com' })

    const { input: nameInput } = form._inputs.get('name')
    const { input: emailInput } = form._inputs.get('email')
    assert(nameInput._value === 'Maria', 'setValues deberia asignar name')
    assert(emailInput._value === 'maria@email.com', 'setValues deberia asignar email')

    console.log('  \u2713 testSetValues')
  }

  function testReset() {
    const form = new Form({
      fields: [
        { name: 'name', type: 'text', required: true }
      ],
      onSubmit: () => {}
    })

    form.render()
    const { input, errorEl } = form._inputs.get('name')

    input._value = ''
    form._validateField('name')
    assert(errorEl.style.display !== 'none', 'Error deberia estar visible')

    form.reset()
    assert(input._value === '', 'reset deberia limpiar el valor')
    assert(errorEl.style.display === 'none', 'reset deberia ocultar error')

    console.log('  \u2713 testReset')
  }

  function testSelectValidation() {
    const form = new Form({
      fields: [
        {
          name: 'country',
          label: 'País',
          type: 'select',
          required: true,
          placeholder: 'Seleccione...',
          options: [
            { value: 'PE', label: 'Perú' },
            { value: 'MX', label: 'México' }
          ]
        }
      ],
      onSubmit: () => {}
    })

    form.render()
    const { input, errorEl } = form._inputs.get('country')

    input._value = ''
    let result = form._validateField('country')
    assert(result === false, 'Select sin seleccion deberia fallar')
    assert(errorEl.textContent === 'Este campo es requerido', 'Mensaje de required para select')

    input._value = 'PE'
    result = form._validateField('country')
    assert(result === true, 'Select con seleccion deberia pasar')

    console.log('  \u2713 testSelectValidation')
  }

  function testClearErrorOnInput() {
    const form = new Form({
      fields: [
        { name: 'name', type: 'text', required: true }
      ],
      onSubmit: () => {}
    })

    form.render()
    const { input, errorEl } = form._inputs.get('name')

    input._value = ''
    form._validateField('name')
    assert(errorEl.style.display !== 'none', 'Error deberia estar visible')

    input._value = 'J'
    input.dispatchEvent({ type: 'input' })
    assert(errorEl.style.display === 'none', 'Error deberia limpiarse al escribir')

    console.log('  \u2713 testClearErrorOnInput')
  }

  testRenderBasic()
  testRequiredValidation()
  testEmailValidation()
  testUrlValidation()
  testNumberValidation()
  testMinlengthMaxlength()
  testPatternValidation()
  testCustomValidators()
  testValidateAll()
  testSubmitValidation()
  testGetValues()
  testSetValues()
  testReset()
  testSelectValidation()
  testClearErrorOnInput()

  console.log('\n\u2713 Todos los tests de Form pasaron\n')
}
