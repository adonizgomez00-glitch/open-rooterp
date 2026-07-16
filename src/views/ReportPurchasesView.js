import { Table } from '../components/Table.js'
import { formatCurrency, formatDate } from '../utils/formatters.js'

export class ReportPurchasesView {
  render(container, report) {
    container.innerHTML = ''

    const summary = document.createElement('div')
    summary.className = 'report-summary-bar'

    const addStat = (label, value) => {
      const span = document.createElement('span')
      span.className = 'report-stat'
      const strong = document.createElement('strong')
      strong.textContent = label + ':'
      span.appendChild(strong)
      span.appendChild(document.createTextNode(' ' + value))
      summary.appendChild(span)
    }

    addStat('Total compras', String(report.summary.total))
    addStat('Completadas', String(report.summary.completed))
    addStat('Anuladas', String(report.summary.cancelled))
    addStat('Monto total', formatCurrency(report.summary.totalAmount))
    summary.appendChild(document.createElement('br'))
    addStat('Impuesto total', formatCurrency(report.summary.totalTax))

    container.appendChild(summary)

    const table = new Table({
      columns: [
        { key: 'id', label: 'N°', width: '60px' },
        { key: 'date', label: 'Fecha', width: '140px', render: (v) => formatDate(v) },
        { key: 'supplierName', label: 'Proveedor' },
        { key: 'total', label: 'Total', width: '120px', render: (v) => formatCurrency(v) },
        {
          key: 'status', label: 'Estado', width: '100px', sortable: false,
          render: (v) => {
            const span = document.createElement('span')
            span.className = `status-badge ${v === 'cancelled' ? 'status--critical' : 'status--ok'}`
            span.textContent = v === 'cancelled' ? 'Anulada' : 'Completada'
            return span
          }
        }
      ],
      emptyMessage: 'No hay compras en el período seleccionado'
    })

    table.setData(report.items)
    container.appendChild(table.render())
  }
}
