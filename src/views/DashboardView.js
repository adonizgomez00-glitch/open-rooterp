import { Toast } from '../components/Toast.js'
import { Loader } from '../components/Loader.js'
import { formatCurrency } from '../utils/formatters.js'

export class DashboardView {
  constructor() {
    this._container = null
    this._loader = new Loader({ message: 'Cargando dashboard...' })
    this._onRefreshCb = null
  }

  render(container) {
    this._container = container
    container.innerHTML = ''

    const toolbar = document.createElement('div')
    toolbar.className = 'toolbar'

    const title = document.createElement('h2')
    title.className = 'toolbar__title'
    title.textContent = 'Dashboard'

    const refreshBtn = document.createElement('button')
    refreshBtn.className = 'btn btn--primary'
    refreshBtn.textContent = 'Actualizar'
    refreshBtn.addEventListener('click', () => {
      if (this._onRefreshCb) this._onRefreshCb()
    })

    toolbar.appendChild(title)
    toolbar.appendChild(refreshBtn)
    container.appendChild(toolbar)

    const grid = document.createElement('div')
    grid.className = 'dashboard-grid'
    grid.id = 'dashboard-grid'
    container.appendChild(grid)
  }

  renderKPIs(kpis) {
    const grid = document.getElementById('dashboard-grid')
    if (!grid) return
    grid.innerHTML = ''

    const cards = [
      {
        label: 'Ventas del Día',
        value: String(kpis.todaySales),
        sub: formatCurrency(kpis.todayRevenue),
        icon: 'ventas',
        color: 'blue'
      },
      {
        label: 'Compras del Mes',
        value: String(kpis.monthPurchases),
        sub: formatCurrency(kpis.monthPurchasesTotal),
        icon: 'compras',
        color: 'purple'
      },
      {
        label: 'Productos',
        value: String(kpis.totalProducts),
        sub: `${kpis.criticalStock} críticos`,
        icon: 'productos',
        color: 'green'
      },
      {
        label: 'Stock Bajo',
        value: String(kpis.lowStock),
        sub: 'productos por debajo del mínimo',
        icon: 'stock',
        color: kpis.lowStock > 0 ? 'red' : 'green'
      },
      {
        label: 'Clientes',
        value: String(kpis.totalCustomers),
        icon: 'clientes',
        color: 'indigo'
      },
      {
        label: 'Proveedores',
        value: String(kpis.totalSuppliers),
        icon: 'proveedores',
        color: 'teal'
      }
    ]

    for (const card of cards) {
      const el = document.createElement('div')
      el.className = `dashboard-card dashboard-card--${card.color}`

      const header = document.createElement('div')
      header.className = 'dashboard-card__header'

      const valueEl = document.createElement('span')
      valueEl.className = 'dashboard-card__value'
      valueEl.textContent = card.value

      const labelEl = document.createElement('span')
      labelEl.className = 'dashboard-card__label'
      labelEl.textContent = card.label

      header.appendChild(valueEl)
      header.appendChild(labelEl)
      el.appendChild(header)

      if (card.sub) {
        const subEl = document.createElement('div')
        subEl.className = 'dashboard-card__sub'
        subEl.textContent = card.sub
        el.appendChild(subEl)
      }

      grid.appendChild(el)
    }
  }

  renderCharts(monthlySales, categoryDist) {
    const container = this._container
    if (!container) return

    let chartsSection = container.querySelector('.dashboard-charts')
    if (!chartsSection) {
      chartsSection = document.createElement('div')
      chartsSection.className = 'dashboard-charts'
      container.appendChild(chartsSection)
    }
    chartsSection.innerHTML = ''

    const salesCard = document.createElement('div')
    salesCard.className = 'dashboard-chart-card'
    const salesTitle = document.createElement('h3')
    salesTitle.className = 'dashboard-chart-card__title'
    salesTitle.textContent = 'Ventas Mensuales'
    const salesCanvas = document.createElement('canvas')
    salesCanvas.id = 'chart-monthly-sales'
    salesCanvas.height = 200
    salesCard.appendChild(salesTitle)
    salesCard.appendChild(salesCanvas)
    chartsSection.appendChild(salesCard)

    if (categoryDist.length > 0) {
      const catCard = document.createElement('div')
      catCard.className = 'dashboard-chart-card'
      const catTitle = document.createElement('h3')
      catTitle.className = 'dashboard-chart-card__title'
      catTitle.textContent = 'Productos por Categoría'
      const catCanvas = document.createElement('canvas')
      catCanvas.id = 'chart-category-dist'
      catCanvas.height = 200
      catCard.appendChild(catTitle)
      catCard.appendChild(catCanvas)
      chartsSection.appendChild(catCard)
    }

    if (typeof Chart === 'undefined') return

    const salesCtx = document.getElementById('chart-monthly-sales')
    if (salesCtx) {
      new Chart(salesCtx, {
        type: 'bar',
        data: {
          labels: monthlySales.map(m => m.label),
          datasets: [{
            label: 'Ventas',
            data: monthlySales.map(m => m.total),
            backgroundColor: 'rgba(37, 99, 235, 0.7)',
            borderColor: 'rgba(37, 99, 235, 1)',
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: v => 'Q ' + v.toFixed(0)
              }
            }
          }
        }
      })
    }

    const catCtx = document.getElementById('chart-category-dist')
    if (catCtx && categoryDist.length > 0) {
      new Chart(catCtx, {
        type: 'doughnut',
        data: {
          labels: categoryDist.map(c => c.label),
          datasets: [{
            data: categoryDist.map(c => c.count),
            backgroundColor: [
              'rgba(37, 99, 235, 0.8)',
              'rgba(124, 58, 237, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(99, 102, 241, 0.8)',
              'rgba(8, 145, 178, 0.8)',
              'rgba(236, 72, 153, 0.8)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 12, padding: 12 }
            }
          }
        }
      })
    }
  }

  onRefresh(callback) {
    this._onRefreshCb = callback
  }

  showLoading() {
    this._loader.show()
  }

  hideLoading() {
    this._loader.hide()
  }

  showError(message) {
    Toast.error(message)
  }
}