import { ExportService } from '../services/ExportService.js'
import { handleError } from '../utils/errors.js'

export class ExportController {
  constructor(exportService, exportView) {
    this._service = exportService
    this._view = exportView
  }

  async init(container) {
    this._view.render(container)
    this._view.onExport((entity, format) => this.handleExport(entity, format))
  }

  async handleExport(entity, format) {
    this._view.showLoading()
    try {
      let data
      if (entity === 'all') {
        const all = await this._service.getAllData()
        data = all
      } else {
        data = await this._service.getEntityData(entity)
      }

      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `erp-${entity}-${timestamp}`

      if (format === 'csv') {
        if (entity === 'all') {
          for (const [key, items] of Object.entries(data)) {
            if (items.length > 0) {
              const csv = ExportService.toCSV(items)
              ExportService.download(csv, `${filename}-${key}.csv`, 'text/csv;charset=utf-8')
            }
          }
        } else {
          const csv = ExportService.toCSV(data)
          ExportService.download(csv, `${filename}.csv`, 'text/csv;charset=utf-8')
        }
      } else {
        const json = ExportService.toJSON(data)
        ExportService.download(json, `${filename}.json`, 'application/json;charset=utf-8')
      }

      this._view.showSuccess(`Exportación completada: ${entity === 'all' ? 'todos los datos' : entity}`)
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }
}
