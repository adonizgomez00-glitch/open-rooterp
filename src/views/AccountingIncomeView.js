import { formatCurrency } from '../utils/formatters.js'

export class AccountingIncomeView {
  render(container, report) {
    container.innerHTML = ''

    const containerDiv = document.createElement('div')
    containerDiv.className = 'acct-balance-container'

    containerDiv.appendChild(this._renderSection('INGRESOS', report.income, report.totalIncome))
    containerDiv.appendChild(this._renderSection('GASTOS', report.expenses, report.totalExpenses))

    const resultRow = document.createElement('div')
    resultRow.className = 'acct-total-row'

    const netClass = report.netIncome >= 0 ? 'acct-total-ok' : 'acct-total-error'
    resultRow.appendChild(this._createResultItem('Total Ingresos:', formatCurrency(report.totalIncome)))
    resultRow.appendChild(this._createResultItem('Total Gastos:', formatCurrency(report.totalExpenses)))
    const netResult = formatCurrency(Math.abs(report.netIncome)) + ' (' + (report.netIncome >= 0 ? 'Ganancia' : 'Pérdida') + ')'
    resultRow.appendChild(this._createResultItem('Resultado Neto:', netResult, netClass))

    containerDiv.appendChild(resultRow)
    container.appendChild(containerDiv)
  }

  _renderSection(title, items, total) {
    const div = document.createElement('div')
    div.className = 'acct-report-section'

    const h3 = document.createElement('h3')
    h3.className = 'acct-report-title'
    h3.textContent = title
    div.appendChild(h3)

    if (items.length === 0) {
      const p = document.createElement('p')
      p.textContent = 'No hay movimientos'
      p.className = 'acct-empty-msg'
      div.appendChild(p)
      return div
    }

    const table = document.createElement('table')
    table.className = 'acct-report-table'

    const thead = document.createElement('thead')
    const hRow = document.createElement('tr')
    ;['Cuenta', 'Nombre', 'Importe'].forEach(h => {
      const th = document.createElement('th')
      th.textContent = h
      hRow.appendChild(th)
    })
    thead.appendChild(hRow)
    table.appendChild(thead)

    const tbody = document.createElement('tbody')
    for (const item of items) {
      const row = document.createElement('tr')
      ;[item.code, item.name, formatCurrency(item.amount)].forEach(c => {
        const td = document.createElement('td')
        td.textContent = c
        row.appendChild(td)
      })
      tbody.appendChild(row)
    }

    const tFoot = document.createElement('tfoot')
    const fRow = document.createElement('tr')
    ;['', 'TOTAL', formatCurrency(Math.abs(total))].forEach((c, ci) => {
      const td = document.createElement('td')
      td.textContent = c
      if (ci >= 1) {
        td.className = 'text-bold'
      }
      fRow.appendChild(td)
    })
    tFoot.appendChild(fRow)

    table.appendChild(tbody)
    table.appendChild(tFoot)
    div.appendChild(table)
    return div
  }

  _createResultItem(label, value, extraCls) {
    const div = document.createElement('div')
    div.className = `acct-total-item${extraCls ? ' ' + extraCls : ''}`
    const strong = document.createElement('strong')
    strong.textContent = label
    div.appendChild(strong)
    div.appendChild(document.createTextNode(' ' + value))
    return div
  }
}
