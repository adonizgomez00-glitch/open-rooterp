import { Table } from '../components/Table.js'

export class ReportStockView {
  render(container, report) {
    container.innerHTML = ''

    const summary = document.createElement('div')
    summary.className = 'report-summary-bar'

    const addStat = (label, value, cls) => {
      const span = document.createElement('span')
      span.className = `report-stat ${cls || ''}`
      const strong = document.createElement('strong')
      strong.textContent = label + ':'
      span.appendChild(strong)
      span.appendChild(document.createTextNode(' ' + value))
      summary.appendChild(span)
    }

    addStat('Total productos', String(report.summary.total))
    addStat('Stock OK', String(report.summary.ok), 'report-stat--ok')
    addStat('Stock Bajo', String(report.summary.low), 'report-stat--low')
    addStat('Stock Crítico', String(report.summary.critical), 'report-stat--critical')

    container.appendChild(summary)

    const statusRender = (v) => {
      const span = document.createElement('span')
      const cls = v === 'critical' ? 'status--critical' : v === 'low' ? 'status--low' : 'status--ok'
      span.className = `status-badge ${cls}`
      const labels = { critical: 'Crítico', low: 'Bajo', ok: 'OK' }
      span.textContent = labels[v] || v
      return span
    }

    const table = new Table({
      columns: [
        { key: 'code', label: 'Código', width: '100px' },
        { key: 'name', label: 'Producto' },
        { key: 'category', label: 'Categoría' },
        { key: 'stock', label: 'Stock', width: '80px' },
        { key: 'stockMin', label: 'Stock Mín', width: '80px' },
        { key: 'status', label: 'Estado', width: '100px', sortable: false, render: statusRender }
      ],
      emptyMessage: 'No hay productos registrados'
    })

    table.setData(report.items)
    container.appendChild(table.render())
  }
}
