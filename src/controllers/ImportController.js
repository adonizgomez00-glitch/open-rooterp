import { ImportService } from '../services/ImportService.js'
import { handleError } from '../utils/errors.js'

export class ImportController {
  constructor(importService, importView, permissions = {}) {
    this._service = importService
    this._view = importView
    this._permissions = permissions
  }

  async init(container) {
    this._view.render(container, this._permissions)
    this._view.onFileSelect((content, format) => this.handleFileSelect(content, format))
    this._view.onImport((entity, records) => this.handleImport(entity, records))
  }

  handleFileSelect(content, format) {
    try {
      let records
      if (format === 'csv') {
        records = ImportService.parseCSV(content)
        this._view.showPreview(records, 'auto')
      } else {
        records = ImportService.parseJSON(content)
        if (ImportService.isFullExport(records)) {
          this._handleFullExport(records)
        } else {
          this._view.showPreview(records, 'auto')
        }
      }
    } catch (error) {
      handleError(error, this._view)
    }
  }

  async _handleFullExport(data) {
    this._view.showLoading()
    try {
      const result = await this._service.importFullExport(data)
      this._view.showFullExportResults(result)
      if (result.totalImported > 0) {
        this._view.showSuccess(`Importación completa: ${result.totalImported} registro(s) importados.`)
      }
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleImport(entity, records) {
    if (this._permissions.canImport === false) {
      this._view.showError('No tienes permiso para importar datos')
      return
    }
    this._view.showLoading()
    try {
      const result = await this._service.importData(entity, records)
      this._view.showResults(result)
      if (result.imported > 0) {
        this._view.showSuccess(`Se importaron ${result.imported} registro(s) correctamente.`)
      }
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }
}
