import { Account } from '../models/Account.js'
import { AccountingEntry } from '../models/AccountingEntry.js'

export class AccountingRepository {
  constructor(db) {
    this.db = db
    this.accountsTable = db.accounts
    this.entriesTable = db.accountingEntries
  }

  async findAllAccounts() {
    const data = await this.accountsTable.orderBy('code').toArray()
    return data.map(Account.fromDB)
  }

  async findAccountById(id) {
    const data = await this.accountsTable.get(id)
    return data ? Account.fromDB(data) : null
  }

  async findAccountByCode(code) {
    const data = await this.accountsTable.where('code').equals(code).first()
    return data ? Account.fromDB(data) : null
  }

  async findAccountsByType(type) {
    const data = await this.accountsTable.where('type').equals(type).toArray()
    return data.map(Account.fromDB)
  }

  async createAccount(accountData) {
    const account = new Account(accountData)
    const validation = account.validate()
    if (!validation.valid) {
      throw new Error(`Datos de cuenta inválidos: ${validation.errors.join(', ')}`)
    }
    const existing = await this.findAccountByCode(account.code)
    if (existing) {
      throw new Error(`Ya existe una cuenta con el código ${account.code}`)
    }
    const { id, ...data } = account.toJSON()
    delete data.id
    const newId = await this.accountsTable.add(data)
    return this.findAccountById(newId)
  }

  async updateAccount(id, accountData) {
    const existing = await this.findAccountById(id)
    if (!existing) {
      throw new Error(`Cuenta con id ${id} no encontrada`)
    }
    const updated = { ...existing.toJSON(), ...accountData, id, updatedAt: new Date().toISOString() }
    const account = new Account(updated)
    const validation = account.validate()
    if (!validation.valid) {
      throw new Error(`Datos de cuenta inválidos: ${validation.errors.join(', ')}`)
    }
    if (accountData.code && accountData.code !== existing.code) {
      const duplicate = await this.findAccountByCode(accountData.code)
      if (duplicate && duplicate.id !== id) {
        throw new Error(`Ya existe otra cuenta con el código ${accountData.code}`)
      }
    }
    await this.accountsTable.put(account.toJSON())
    return this.findAccountById(id)
  }

  async deleteAccount(id) {
    const existing = await this.findAccountById(id)
    if (!existing) {
      throw new Error(`Cuenta con id ${id} no encontrada`)
    }
    await this.accountsTable.delete(id)
    return true
  }

  async countAccounts() {
    return this.accountsTable.count()
  }

  async findAllEntries() {
    const data = await this.entriesTable.orderBy('date').reverse().toArray()
    return data.map(AccountingEntry.fromDB)
  }

  async findEntryById(id) {
    const data = await this.entriesTable.get(id)
    return data ? AccountingEntry.fromDB(data) : null
  }

  async findEntriesByDateRange(startDate, endDate) {
    const data = await this.entriesTable
      .where('date')
      .between(startDate, endDate + 'T23:59:59.999Z', true, true)
      .reverse()
      .toArray()
    return data.map(AccountingEntry.fromDB)
  }

  async findEntriesByReference(referenceType, referenceId) {
    const data = await this.entriesTable
      .where('[referenceType+referenceId]')
      .equals([referenceType, referenceId])
      .toArray()
    return data.map(AccountingEntry.fromDB)
  }

  async createEntry(entryData) {
    const entry = new AccountingEntry(entryData)
    const validation = entry.validate()
    if (!validation.valid) {
      throw new Error(`Datos de asiento inválidos: ${validation.errors.join(', ')}`)
    }
    const { id, ...data } = entry.toJSON()
    delete data.id
    const newId = await this.entriesTable.add(data)
    return this.findEntryById(newId)
  }

  async deleteEntry(id) {
    const existing = await this.findEntryById(id)
    if (!existing) {
      throw new Error(`Asiento con id ${id} no encontrado`)
    }
    await this.entriesTable.delete(id)
    return true
  }

  async countEntries() {
    return this.entriesTable.count()
  }

  async getAccountBalances(accountIds) {
    const allEntries = await this.entriesTable.toArray()
    const balances = {}
    for (const id of accountIds) {
      balances[id] = { debit: 0, credit: 0, net: 0 }
    }
    for (const entry of allEntries) {
      for (const item of entry.items || []) {
        if (balances[item.accountId] !== undefined) {
          balances[item.accountId].debit += item.debit
          balances[item.accountId].credit += item.credit
          balances[item.accountId].net += item.debit - item.credit
        }
      }
    }
    return balances
  }
}
