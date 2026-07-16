const ITERATIONS = 100000
const KEY_LENGTH = 64
const SALT_BYTES = 32
const ALGORITHM = 'SHA-512'

function toHex(bytes) {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

export class PasswordService {
  constructor(cryptoProvider = null) {
    this._crypto = cryptoProvider
  }

  async _getCrypto() {
    if (this._crypto) return this._crypto
    if (globalThis.crypto?.subtle) {
      return globalThis.crypto
    }
    const { webcrypto } = await import('node:crypto')
    return webcrypto
  }

  async _getRandomValues(length) {
    const crypto = await this._getCrypto()
    const bytes = new Uint8Array(length)
    crypto.getRandomValues(bytes)
    return bytes
  }

  async _deriveKey(password, salt) {
    const crypto = await this._getCrypto()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    )
    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: hexToBytes(salt),
        iterations: ITERATIONS,
        hash: ALGORITHM
      },
      keyMaterial,
      KEY_LENGTH * 8
    )
    return new Uint8Array(bits)
  }

  async hash(password) {
    const saltBytes = await this._getRandomValues(SALT_BYTES)
    const salt = toHex(saltBytes)
    const key = await this._deriveKey(password, salt)
    const hash = toHex(key)
    return `${salt}:${hash}`
  }

  async verify(password, stored) {
    if (!stored || typeof stored !== 'string') return false
    const parts = stored.split(':')
    if (parts.length !== 2) return false
    const [salt, hash] = parts
    if (salt.length !== SALT_BYTES * 2 || hash.length !== KEY_LENGTH * 2) return false
    try {
      const key = await this._deriveKey(password, salt)
      const computed = toHex(key)
      if (computed.length !== hash.length) return false
      const keyBytes = hexToBytes(computed)
      const hashBytes = hexToBytes(hash)
      if (keyBytes.length !== hashBytes.length) return false
      let diff = 0
      for (let i = 0; i < keyBytes.length; i++) {
        diff |= keyBytes[i] ^ hashBytes[i]
      }
      return diff === 0
    } catch {
      return false
    }
  }

  needsRehash(stored) {
    if (!stored || typeof stored !== 'string') return true
    const parts = stored.split(':')
    if (parts.length !== 2) return true
    const [salt, hash] = parts
    return salt.length !== SALT_BYTES * 2 || hash.length !== KEY_LENGTH * 2
  }
}
