import { Table } from '../components/Table.js'
import { Toast } from '../components/Toast.js'
import { Loader } from '../components/Loader.js'

const ENTITIES = [
  { value: 'auto', label: 'Detectar automáticamente' },
  { value: 'products', label: 'Productos' },
  { value: 'customers', label: 'Clientes' },
  { value: 'suppliers', label: 'Proveedores' },
  { value: 'sales', label: 'Ventas' },
  { value: 'purchases', label: 'Compras' },
  { value: 'inventory', label: 'Inventario' },
  { value: 'movements', label: 'Movimientos de Inventario' },
  { value: 'settings', label: 'Configuración' }
]

export class ImportView {
  constructor() {
    this._container = null
    this._previewContainer = null
    this._resultsContainer = null
    this._entitySelect = null
    this._importBtn = null
    this._previewTable = null
    this._loader = new Loader({ message: 'Importando datos...' })
    this._onFileSelectCb = null
    this._onImportCb = null
    this._parsedRecords = []
    this._canImport = true
  }

  render(container, permissions = {}) {
    this._canImport = permissions.canImport !== false
    this._container = container
    container.innerHTML = ''

    const toolbar = document.createElement('div')
    toolbar.className = 'toolbar'
    const title = document.createElement('h2')
    title.className = 'toolbar__title'
    title.textContent = 'Importar Datos'
    toolbar.appendChild(title)
    container.appendChild(toolbar)

    const card = document.createElement('div')
    card.className = 'import-card'

    if (!this._canImport) {
      const restricted = document.createElement('div')
      restricted.className = 'import-restricted'
      const lockIcon = document.createElement('span')
      lockIcon.className = 'import-restricted__icon'
      lockIcon.textContent = '\u26d4'
      restricted.appendChild(lockIcon)
      const msg = document.createElement('p')
      msg.className = 'import-restricted__msg'
      msg.textContent = 'Solo los usuarios con rol Administrador pueden importar datos.'
      restricted.appendChild(msg)
      card.appendChild(restricted)
      container.appendChild(card)
      return
    }

    const desc = document.createElement('p')
    desc.className = 'import-card__desc'
    desc.textContent = 'Selecciona un archivo CSV o JSON para importar datos al sistema. La entidad se detectará automáticamente desde los encabezados del archivo.'
    card.appendChild(desc)

    const dropzone = document.createElement('div')
    dropzone.className = 'import-dropzone'
    dropzone.setAttribute('role', 'button')
    dropzone.setAttribute('tabindex', '0')
    dropzone.setAttribute('aria-label', 'Seleccionar archivo para importar')

    const dropzoneIcon = document.createElement('span')
    dropzoneIcon.className = 'import-dropzone__icon'
    dropzoneIcon.textContent = '\u2191'
    dropzone.appendChild(dropzoneIcon)

    const dropzoneText = document.createElement('span')
    dropzoneText.className = 'import-dropzone__text'
    dropzoneText.textContent = 'Arrastra un archivo aquí o haz clic para seleccionar'
    dropzone.appendChild(dropzoneText)

    const dropzoneHint = document.createElement('span')
    dropzoneHint.className = 'import-dropzone__hint'
    dropzoneHint.textContent = 'Formatos soportados: CSV, JSON'
    dropzone.appendChild(dropzoneHint)

    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.csv,.json'
    fileInput.style.display = 'none'
    fileInput.id = 'import-file-input'

    dropzone.addEventListener('click', () => fileInput.click())

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault()
      dropzone.classList.add('import-dropzone--active')
    })

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('import-dropzone--active')
    })

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault()
      dropzone.classList.remove('import-dropzone--active')
      const files = e.dataTransfer.files
      if (files.length > 0) this._handleFile(files[0])
    })

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        this._handleFile(fileInput.files[0])
        fileInput.value = ''
      }
    })

    card.appendChild(dropzone)
    card.appendChild(fileInput)

    const selectRow = document.createElement('div')
    selectRow.className = 'entity-select-row'
    const selectLabel = document.createElement('label')
    selectLabel.className = 'entity-select__label'
    selectLabel.textContent = 'Tipo de datos:'
    selectLabel.setAttribute('for', 'entity-select')
    selectRow.appendChild(selectLabel)
    this._entitySelect = document.createElement('select')
    this._entitySelect.id = 'entity-select'
    this._entitySelect.className = 'entity-select'
    for (const opt of ENTITIES) {
      const option = document.createElement('option')
      option.value = opt.value
      option.textContent = opt.label
      this._entitySelect.appendChild(option)
    }
    selectRow.appendChild(this._entitySelect)
    card.appendChild(selectRow)

    this._previewContainer = document.createElement('div')
    this._previewContainer.className = 'import-preview'
    this._previewContainer.style.display = 'none'
    card.appendChild(this._previewContainer)

    this._resultsContainer = document.createElement('div')
    this._resultsContainer.className = 'import-results'
    this._resultsContainer.style.display = 'none'
    card.appendChild(this._resultsContainer)

    container.appendChild(card)
  }

  _handleFile(file) {
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext !== 'csv' && ext !== 'json') {
      Toast.error('Formato no soportado. Selecciona un archivo CSV o JSON.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      if (this._onFileSelectCb) {
        this._onFileSelectCb(e.target.result, ext)
      }
    }
    reader.onerror = () => {
      Toast.error('Error al leer el archivo.')
    }
    reader.readAsText(file)
  }

  showPreview(records, entity) {
    this._parsedRecords = records
    this._previewContainer.style.display = 'block'
    this._previewContainer.innerHTML = ''

    if (this._entitySelect) {
      if (entity && entity !== 'auto') {
        this._entitySelect.value = entity
      } else {
        this._entitySelect.value = 'auto'
      }
    }

    const previewHeader = document.createElement('div')
    previewHeader.className = 'import-preview__header'

    const previewTitle = document.createElement('h3')
    previewTitle.className = 'import-preview__title'
    previewTitle.textContent = `Previsualización: ${records.length} registro(s) encontrados`
    previewHeader.appendChild(previewTitle)

    const actionBar = document.createElement('div')
    actionBar.className = 'import-preview__actions'

    this._importBtn = document.createElement('button')
    this._importBtn.className = 'btn btn--primary'
    this._importBtn.textContent = `Importar ${records.length} registro(s)`
    this._importBtn.disabled = records.length === 0
    this._importBtn.addEventListener('click', () => {
      if (this._onImportCb) {
        this._onImportCb(this._entitySelect ? this._entitySelect.value : entity, records)
      }
    })
    actionBar.appendChild(this._importBtn)

    previewHeader.appendChild(actionBar)
    this._previewContainer.appendChild(previewHeader)

    if (records.length === 0) {
      const emptyMsg = document.createElement('p')
      emptyMsg.className = 'import-preview__empty'
      emptyMsg.textContent = 'No se encontraron registros válidos en el archivo.'
      this._previewContainer.appendChild(emptyMsg)
      return
    }

    const columns = Object.keys(records[0]).map(key => ({
      key,
      label: key,
      sortable: true
    }))

    this._previewTable = new Table({
      columns,
      data: records,
      emptyMessage: 'No hay datos para mostrar'
    })

    this._previewContainer.appendChild(this._previewTable.render())
  }

  showResults(result) {
    this._resultsContainer.style.display = 'block'
    this._resultsContainer.innerHTML = ''

    const title = document.createElement('h3')
    title.className = 'import-results__title'
    title.textContent = 'Resultado de la Importación'
    this._resultsContainer.appendChild(title)

    const summary = document.createElement('div')
    summary.className = 'import-results__summary'

    const importedBadge = document.createElement('span')
    importedBadge.className = 'import-results__badge import-results__badge--success'
    importedBadge.textContent = `${result.imported} importados`
    summary.appendChild(importedBadge)

    if (result.skipped > 0) {
      const skippedBadge = document.createElement('span')
      skippedBadge.className = 'import-results__badge import-results__badge--warning'
      skippedBadge.textContent = `${result.skipped} omitidos`
      summary.appendChild(skippedBadge)
    }

    this._resultsContainer.appendChild(summary)

    if (result.errors.length > 0) {
      const errorsTitle = document.createElement('h4')
      errorsTitle.className = 'import-results__subtitle'
      errorsTitle.textContent = 'Errores:'
      this._resultsContainer.appendChild(errorsTitle)

      const errorList = document.createElement('ul')
      errorList.className = 'import-results__errors'
      for (const err of result.errors) {
        const li = document.createElement('li')
        li.className = 'import-results__error-item'
        li.textContent = `Fila ${err.row}: ${err.message}`
        errorList.appendChild(li)
      }
      this._resultsContainer.appendChild(errorList)
    }

    this._previewContainer.style.display = 'none'

    if (this._importBtn) {
      this._importBtn.disabled = false
      this._importBtn.textContent = 'Importar'
    }
  }

  showFullExportResults(result) {
    this._resultsContainer.style.display = 'block'
    this._resultsContainer.innerHTML = ''

    const title = document.createElement('h3')
    title.className = 'import-results__title'
    title.textContent = 'Resultado de la Importación Completa'
    this._resultsContainer.appendChild(title)

    const summary = document.createElement('div')
    summary.className = 'import-results__summary'

    const importedBadge = document.createElement('span')
    importedBadge.className = 'import-results__badge import-results__badge--success'
    importedBadge.textContent = `${result.totalImported} registro(s) importados`
    summary.appendChild(importedBadge)
    this._resultsContainer.appendChild(summary)

    const detailList = document.createElement('div')
    detailList.className = 'import-results__entities'
    for (const entity of result.entities) {
      const entityResult = result.results[entity]
      const entityDiv = document.createElement('div')
      entityDiv.className = 'import-results__entity'

      const entityLabel = document.createElement('strong')
      entityLabel.textContent = entity.charAt(0).toUpperCase() + entity.slice(1) + ': '
      entityDiv.appendChild(entityLabel)

      const entityImported = document.createElement('span')
      entityImported.className = 'import-results__badge import-results__badge--success'
      entityImported.textContent = `${entityResult.imported} importados`
      entityDiv.appendChild(entityImported)

      if (entityResult.skipped > 0) {
        const entitySkipped = document.createElement('span')
        entitySkipped.className = 'import-results__badge import-results__badge--warning'
        entitySkipped.textContent = `${entityResult.skipped} omitidos`
        entityDiv.appendChild(entitySkipped)
      }

      if (entityResult.errors && entityResult.errors.length > 0) {
        const errorList = document.createElement('ul')
        errorList.className = 'import-results__errors'
        for (const err of entityResult.errors) {
          const li = document.createElement('li')
          li.className = 'import-results__error-item'
          li.textContent = `Fila ${err.row}: ${err.message}`
          errorList.appendChild(li)
        }
        entityDiv.appendChild(errorList)
      }

      detailList.appendChild(entityDiv)
    }
    this._resultsContainer.appendChild(detailList)
  }

  reset() {
    this._parsedRecords = []
    this._previewContainer.style.display = 'none'
    this._previewContainer.innerHTML = ''
    this._resultsContainer.style.display = 'none'
    this._resultsContainer.innerHTML = ''
    if (this._entitySelect) this._entitySelect.selectedIndex = 0
  }

  onFileSelect(cb) {
    this._onFileSelectCb = cb
  }

  onImport(cb) {
    this._onImportCb = cb
  }

  showLoading() {
    this._loader.show()
  }

  hideLoading() {
    this._loader.hide()
  }

  showSuccess(message) {
    Toast.success(message)
  }

  showError(message) {
    Toast.error(message)
  }
}
