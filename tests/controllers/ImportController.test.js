import { ImportController } from '../../src/controllers/ImportController.js'
import { ImportService } from '../../src/services/ImportService.js'

function createMockService() {
  return {
    importData: async (entity, records) => {
      return { imported: records.length, skipped: 0, errors: [] }
    }
  }
}

function createMockView() {
  return {
    rendered: false,
    loadingState: false,
    successMessage: null,
    errorMessage: null,
    previewData: null,
    previewEntity: null,
    resultsData: null,
    _onFileSelectCb: null,
    _onImportCb: null,

    render(container) {
      this.rendered = true
      this._container = container
    },

    onFileSelect(cb) {
      this._onFileSelectCb = cb
    },

    onImport(cb) {
      this._onImportCb = cb
    },

    showPreview(records, entity) {
      this.previewData = records
      this.previewEntity = entity
    },

    showResults(result) {
      this.resultsData = result
    },

    showLoading() {
      this.loadingState = true
    },

    hideLoading() {
      this.loadingState = false
    },

    showSuccess(msg) {
      this.successMessage = msg
    },

    showError(msg) {
      this.errorMessage = msg
    },

    reset() {
      this.previewData = null
      this.previewEntity = null
      this.resultsData = null
      this.successMessage = null
      this.errorMessage = null
    }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testInitRendersView() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ImportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.rendered === true, 'init debería renderizar la vista')
  assert(typeof view._onFileSelectCb === 'function', 'init debería registrar onFileSelect')
  assert(typeof view._onImportCb === 'function', 'init debería registrar onImport')

  console.log('  ✓ testInitRendersView')
}

async function testHandleFileSelectCSV() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ImportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  const csvContent = 'name,code\nProducto A,P001\nProducto B,P002'
  controller.handleFileSelect(csvContent, 'csv')

  assert(view.previewData !== null, 'Debería mostrar previsualización')
  assert(view.previewData.length === 2, 'Debería parsear 2 registros')
  assert(view.previewEntity === 'auto', 'Entidad debería ser auto')
  assert(view.previewData[0].name === 'Producto A', 'Primer nombre correcto')

  console.log('  ✓ testHandleFileSelectCSV')
}

async function testHandleFileSelectJSON() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ImportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  const jsonContent = '[{"name": "Producto A"}, {"name": "Producto B"}]'
  controller.handleFileSelect(jsonContent, 'json')

  assert(view.previewData !== null, 'Debería mostrar previsualización')
  assert(view.previewData.length === 2, 'Debería parsear 2 registros')

  console.log('  ✓ testHandleFileSelectJSON')
}

async function testHandleFileSelectInvalidCSV() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ImportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  // CSV malformado - el parser lo intenta parsear sin lanzar error
  controller.handleFileSelect('invalid,csv\nwith,broken', 'csv')

  assert(view.previewData !== null, 'Debería mostrar previsualización aunque CSV sea raro')
  assert(view.previewData.length === 1, 'Debería parsear 1 registro')

  console.log('  ✓ testHandleFileSelectInvalidCSV')
}

async function testHandleImportSuccess() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ImportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  const records = [{ name: 'Prod 1' }, { name: 'Prod 2' }]
  await controller.handleImport('products', records)

  assert(view.resultsData !== null, 'Debería mostrar resultados')
  assert(view.resultsData.imported === 2, 'Debería importar 2')
  assert(view.successMessage !== null, 'Debería mostrar mensaje de éxito')
  assert(view.loadingState === false, 'Debería ocultar loading')

  console.log('  ✓ testHandleImportSuccess')
}

async function testHandleImportWithSkipped() {
  const service = {
    importData: async (entity, records) => {
      return { imported: 1, skipped: 1, errors: [{ row: 2, message: 'Error en fila 2' }] }
    }
  }
  const view = createMockView()
  const controller = new ImportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  const records = [{ name: 'Prod 1' }, { name: 'Prod 2' }]
  await controller.handleImport('products', records)

  assert(view.resultsData.imported === 1, 'Debería importar 1')
  assert(view.resultsData.skipped === 1, 'Debería omitir 1')
  assert(view.resultsData.errors.length === 1, 'Debería tener 1 error')
  assert(view.successMessage !== null, 'Debería mostrar éxito aunque haya omitidos')

  console.log('  ✓ testHandleImportWithSkipped')
}

async function testHandleImportError() {
  const service = {
    importData: async () => { throw new Error('Error de importación') }
  }
  const view = createMockView()
  const controller = new ImportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleImport('products', [{ name: 'Prod 1' }])

  assert(view.errorMessage === 'Error de importación', 'Debería mostrar mensaje de error')
  assert(view.loadingState === false, 'Debería ocultar loading')

  console.log('  ✓ testHandleImportError')
}

export async function runImportControllerTests() {
  console.log('\n--- ImportController Tests ---\n')

  await testInitRendersView()
  await testHandleFileSelectCSV()
  await testHandleFileSelectJSON()
  await testHandleFileSelectInvalidCSV()
  await testHandleImportSuccess()
  await testHandleImportWithSkipped()
  await testHandleImportError()

  console.log('\n✓ Todos los tests de ImportController pasaron\n')
}