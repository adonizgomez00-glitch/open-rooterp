import { formatCurrency, formatDateTime } from '../utils/formatters.js'

const REF_TYPE_LABELS = {
  sale: 'Venta',
  purchase: 'Compra',
  cancel_sale: 'Anulación Venta',
  cancel_purchase: 'Anulación Compra',
  adjustment: 'Ajuste'
}

export class AccountingJournalView {
  render(container, entries) {
    container.innerHTML = ''

    const count = document.createElement('div')
    count.className = 'report-summary-bar'
    const span = document.createElement('span')
    span.className = 'report-stat'
    const strong = document.createElement('strong')
    strong.textContent = 'Total asientos:'
    span.appendChild(strong)
    span.appendChild(document.createTextNode(' ' + entries.length))
    count.appendChild(span)
    container.appendChild(count)

    if (entries.length === 0) {
      const p = document.createElement('p')
      p.className = 'report-empty'
      p.textContent = 'No hay asientos contables en el período seleccionado'
      container.appendChild(p)
      return
    }

    for (const entry of entries) {
      const card = document.createElement('div')
      card.className = 'acct-entry-card'

      const header = document.createElement('div')
      header.className = 'acct-entry-header'

      const ref = document.createElement('div')
      ref.className = 'acct-entry-ref'

      const refLabel = document.createElement('strong')
      refLabel.textContent = `#${entry.id} - ${REF_TYPE_LABELS[entry.referenceType] || entry.referenceType}`

      const dateSpan = document.createElement('span')
      dateSpan.className = 'acct-entry-date'
      dateSpan.textContent = formatDateTime(entry.date)

      ref.appendChild(refLabel)
      ref.appendChild(dateSpan)
      header.appendChild(ref)

      const desc = document.createElement('div')
      desc.className = 'acct-entry-desc'
      desc.textContent = entry.description

      header.appendChild(desc)
      card.appendChild(header)

      const itemsTable = document.createElement('table')
      itemsTable.className = 'acct-entry-items'

      const thead = document.createElement('thead')
      const hRow = document.createElement('tr')
      const headers = ['Cuenta', 'Nombre', 'Débito', 'Crédito']
      for (const h of headers) {
        const th = document.createElement('th')
        th.textContent = h
        hRow.appendChild(th)
      }
      thead.appendChild(hRow)
      itemsTable.appendChild(thead)

      const tbody = document.createElement('tbody')
      let totalDebit = 0
      let totalCredit = 0

      for (const item of (entry.items || [])) {
        const row = document.createElement('tr')
        const cells = [
          item.accountCode,
          item.accountName,
          item.debit > 0 ? formatCurrency(item.debit) : '',
          item.credit > 0 ? formatCurrency(item.credit) : ''
        ]
        for (const c of cells) {
          const td = document.createElement('td')
          td.textContent = c
          row.appendChild(td)
        }
        tbody.appendChild(row)
        totalDebit += item.debit
        totalCredit += item.credit
      }

      const tFoot = document.createElement('tfoot')
      const fRow = document.createElement('tr')
      const fCells = ['', 'TOTALES', formatCurrency(totalDebit), formatCurrency(totalCredit)]
      for (const c of fCells) {
        const td = document.createElement('td')
        td.textContent = c
        if (c === 'TOTALES') {
          td.className = 'text-bold'
        }
        fRow.appendChild(td)
      }
      tFoot.appendChild(fRow)
      itemsTable.appendChild(tbody)
      itemsTable.appendChild(tFoot)

      card.appendChild(itemsTable)
      container.appendChild(card)
    }
  }
}
