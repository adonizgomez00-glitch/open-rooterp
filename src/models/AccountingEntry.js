export class AccountingEntryItem {
  constructor(data = {}) {
    this.accountId = data.accountId ?? 0
    this.accountCode = data.accountCode ?? ''
    this.accountName = data.accountName ?? ''
    this.debit = Number(data.debit ?? 0)
    this.credit = Number(data.credit ?? 0)
  }

  static fromDB(data) {
    return new AccountingEntryItem(data)
  }

  validate() {
    const errors = []
    if (!this.accountId) errors.push('La cuenta contable es requerida')
    if (this.debit < 0) errors.push('El débito no puede ser negativo')
    if (this.credit < 0) errors.push('El crédito no puede ser negativo')
    if (this.debit === 0 && this.credit === 0) {
      errors.push('Debe haber un monto de débito o crédito')
    }
    return { valid: errors.length === 0, errors }
  }
}

export class AccountingEntry {
  constructor(data = {}) {
    this.id = data.id ?? undefined
    this.date = data.date ?? new Date().toISOString()
    this.description = data.description ?? ''
    this.referenceType = data.referenceType ?? ''
    this.referenceId = data.referenceId ?? null
    this.items = (data.items || []).map(i => i instanceof AccountingEntryItem ? i : new AccountingEntryItem(i))
    this.createdAt = data.createdAt ?? new Date().toISOString()
  }

  toJSON() {
    return {
      ...this,
      items: this.items.map(i => i.toJSON ? i.toJSON() : i)
    }
  }

  static fromDB(data) {
    return new AccountingEntry(data)
  }

  validate() {
    const errors = []
    if (!this.description?.trim()) {
      errors.push('La descripción del asiento es requerida')
    }
    if (!this.items || this.items.length < 2) {
      errors.push('El asiento debe tener al menos 2 movimientos')
    }
    for (const item of this.items) {
      const validation = item.validate()
      if (!validation.valid) {
        errors.push(...validation.errors)
      }
    }
    const totalDebit = this.items.reduce((s, i) => s + i.debit, 0)
    const totalCredit = this.items.reduce((s, i) => s + i.credit, 0)
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      errors.push(`Los totales no cuadran: Débito ${totalDebit.toFixed(2)} ≠ Crédito ${totalCredit.toFixed(2)}`)
    }
    return { valid: errors.length === 0, errors }
  }
}
