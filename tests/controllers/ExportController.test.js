import { ExportController } from '../../src/controllers/ExportController.js'
import { ExportService } from '../../src/services/ExportService.js'

function createMockService() {
  return {
    async getAllData() {
      return {
        products: [{ id: 1, name: 'Prod', price: 100 }],
        customers: [{ id: 1, name: 'Cliente' }],
        suppliers: [],
        sales: [],
        purchases: [],
        movements: [],
        settings: []
      }
    },

    async getEntityData(entity) {
      if (entity === 'products') {
        return [{ id: 1, name: 'Prod', price: 100 }]
      }
      return []
    },

    _downloadCalls: []
  }
}

function createMockView() {
  return {
    rendered: false,
    loadingState: false,
    successMessage: null,
    errorMessage: null,
    _onExportCb: null,
    _entityValue: 'products',
    _formatValue: 'csv',

    render(container) {
      this.rendered = true
      this._container = container
    },

    onExport(cb) {
      this._onExportCb = cb
    },

    showSuccess(msg) {
      this.successMessage = msg
    },

    showLoading() {
      this.loadingState = true
    },

    hideLoading() {
      this.loadingState = false
    },

    showError(msg) {
      this.errorMessage = msg
    }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testInitRendersView() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ExportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  assert(view.rendered === true, 'init debería renderizar la vista')
  assert(typeof view._onExportCb === 'function', 'init debería registrar onExport')

  console.log('  ✓ testInitRendersView')
}

async function testHandleExportCSV() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ExportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  let downloadContent = null
  let downloadFilename = null
  let downloadMime = null

  const originalDownload = ExportService.download
  ExportService.download = (content, filename, mimeType) => {
    downloadContent = content
    downloadFilename = filename
    downloadMime = mimeType
  }

  try {
    await controller.handleExport('products', 'csv')

    assert(downloadContent !== null, 'Debería haberse llamado a download con contenido')
    assert(downloadContent.includes('id,name,price'), 'CSV debería incluir headers')
    assert(downloadContent.includes('1,Prod,100'), 'CSV debería incluir datos')
    assert(downloadFilename.startsWith('erp-products-'), 'Filename debería empezar con erp-products-')
    assert(downloadFilename.endsWith('.csv'), 'Filename debería terminar en .csv')
    assert(downloadMime === 'text/csv;charset=utf-8', 'MIME debería ser text/csv')
    assert(view.successMessage !== null, 'Debería mostrar mensaje de éxito')
  } finally {
    ExportService.download = originalDownload
  }

  console.log('  ✓ testHandleExportCSV')
}

async function testHandleExportJSON() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ExportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  let downloadContent = null
  let downloadFilename = null
  let downloadMime = null

  const originalDownload = ExportService.download
  ExportService.download = (content, filename, mimeType) => {
    downloadContent = content
    downloadFilename = filename
    downloadMime = mimeType
  }

  try {
    await controller.handleExport('products', 'json')

    assert(downloadContent !== null, 'Debería haberse llamado a download con contenido')
    const parsed = JSON.parse(downloadContent)
    assert(parsed.length === 1, 'JSON debería tener 1 producto')
    assert(parsed[0].name === 'Prod', 'Producto debería llamarse Prod')
    assert(downloadFilename.endsWith('.json'), 'Filename debería terminar en .json')
    assert(downloadMime === 'application/json;charset=utf-8', 'MIME debería ser application/json')
  } finally {
    ExportService.download = originalDownload
  }

  console.log('  ✓ testHandleExportJSON')
}

async function testHandleExportAll() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ExportController(service, view)

  const container = document.createElement('div')
  await controller.init(container)

  const downloads = []
  const originalDownload = ExportService.download
  ExportService.download = (content, filename, mimeType) => {
    downloads.push({ content, filename, mimeType })
  }

  try {
    await controller.handleExport('all', 'csv')

    assert(downloads.length > 0, 'Debería llamar download al menos una vez')
    assert(view.successMessage !== null, 'Debería mostrar éxito')
  } finally {
    ExportService.download = originalDownload
  }

  console.log('  ✓ testHandleExportAll')
}

async function testHandleExportError() {
  const service = createMockService()
  const view = createMockView()
  const controller = new ExportController(service, view)

  service.getEntityData = async () => { throw new Error('Error de prueba') }

  const container = document.createElement('div')
  await controller.init(container)

  await controller.handleExport('products', 'csv')

  assert(view.errorMessage === 'Error de prueba', 'Debería mostrar mensaje de error')

  console.log('  ✓ testHandleExportError')
}

export async function runExportControllerTests() {
  console.log('\n--- ExportController Tests ---\n')

  await testInitRendersView()
  await testHandleExportCSV()
  await testHandleExportJSON()
  await testHandleExportAll()
  await testHandleExportError()

  console.log('\n✓ Todos los tests de ExportController pasaron\n')
}
