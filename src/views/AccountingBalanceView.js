import { formatCurrency } from '../utils/formatters.js'

export class AccountingBalanceView {
  render(container, report) {
    container.innerHTML = ''

    const containerDiv = document.createElement('div')
    containerDiv.className = 'acct-balance-container'

    containerDiv.appendChild(this._renderSection('ACTIVO', report.assets))
    containerDiv.appendChild(this._renderSection('PASIVO', report.liabilities))
    containerDiv.appendChild(this._renderSection('PATRIMONIO', report.equity))

    const totalRow = document.createElement('div')
    totalRow.className = 'acct-total-row'

    const totalAssets = formatCurrency(report.totalAssets)
    const totalLiabilitiesEquity = formatCurrency(report.totalLiabilitiesEquity)
    const diff = formatCurrency(Math.abs(report.totalAssets - report.totalLiabilitiesEquity))

    totalRow.appendChild(this._createTotalItem('Total Activo:', totalAssets))
    totalRow.appendChild(this._createTotalItem('Total Pasivo + Patrimonio:', totalLiabilitiesEquity))
    const diffCls = Math.abs(report.totalAssets - report.totalLiabilitiesEquity) < 0.01 ? 'acct-total-ok' : 'acct-total-error'
    totalRow.appendChild(this._createTotalItem('Diferencia:', diff, diffCls))

    containerDiv.appendChild(totalRow)
    container.appendChild(containerDiv)
  }

  _renderSection(title, section) {
    const div = document.createElement('div')
    div.className = 'acct-report-section'

    const h3 = document.createElement('h3')
    h3.className = 'acct-report-title'
    h3.textContent = title
    div.appendChild(h3)

    const table = document.createElement('table')
    table.className = 'acct-report-table'

    const thead = document.createElement('thead')
    const hRow = document.createElement('tr')
    ;['Cuenta', 'Nombre', 'Saldo'].forEach(h => {
      const th = document.createElement('th')
      th.textContent = h
      hRow.appendChild(th)
    })
    thead.appendChild(hRow)
    table.appendChild(thead)

    const tbody = document.createElement('tbody')
    for (const item of section.accounts) {
      const row = document.createElement('tr')
      ;[item.code, item.name, formatCurrency(item.balance)].forEach(c => {
        const td = document.createElement('td')
        td.textContent = c
        row.appendChild(td)
      })
      tbody.appendChild(row)
    }

    const tFoot = document.createElement('tfoot')
    const fRow = document.createElement('tr')
    ;['', 'TOTAL', formatCurrency(Math.abs(section.total))].forEach((c, ci) => {
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

  _createTotalItem(label, value, extraCls) {
    const div = document.createElement('div')
    div.className = `acct-total-item${extraCls ? ' ' + extraCls : ''}`
    const strong = document.createElement('strong')
    strong.textContent = label
    div.appendChild(strong)
    div.appendChild(document.createTextNode(' ' + value))
    return div
  }
}
