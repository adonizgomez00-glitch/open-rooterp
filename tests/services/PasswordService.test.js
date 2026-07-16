import { PasswordService } from '../../src/services/PasswordService.js'

function createMockCrypto() {
  let counter = 0
  return {
    subtle: {
      async importKey(format, keyData, algorithm, extractable, usages) {
        return { format, keyData, algorithm, extractable, usages }
      },
      async deriveBits(algorithm, keyMaterial, length) {
        const bytes = new Uint8Array(length / 8)
        for (let i = 0; i < bytes.length; i++) {
          bytes[i] = (keyMaterial.keyData[i] || 0) + (algorithm.salt?.[0] || 0) + i
        }
        return bytes.buffer
      }
    },
    getRandomValues(bytes) {
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = ++counter
      }
      return bytes
    }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

async function testHashAndVerify() {
  const crypto = createMockCrypto()
  const service = new PasswordService(crypto)

  const hash = await service.hash('MiClave123')
  assert(typeof hash === 'string', 'hash debe ser string')
  assert(hash.includes(':'), 'hash debe contener separador')

  const valid = await service.verify('MiClave123', hash)
  assert(valid === true, 'verify debe retornar true para contraseña correcta')

  const invalid = await service.verify('OtraClave', hash)
  assert(invalid === false, 'verify debe retornar false para contraseña incorrecta')

  console.log('  ✓ testHashAndVerify')
}

async function testVerifyWithInvalidFormat() {
  const crypto = createMockCrypto()
  const service = new PasswordService(crypto)

  const result1 = await service.verify('pass', null)
  assert(result1 === false, 'verify(null) debe retornar false')

  const result2 = await service.verify('pass', '')
  assert(result2 === false, 'verify("") debe retornar false')

  const result3 = await service.verify('pass', 'invalid-format')
  assert(result3 === false, 'verify("invalid-format") debe retornar false')

  console.log('  ✓ testVerifyWithInvalidFormat')
}

async function testNeedsRehash() {
  const service = new PasswordService()

  assert(service.needsRehash(null) === true, 'needsRehash(null) debe retornar true')
  assert(service.needsRehash('') === true, 'needsRehash("") debe retornar true')
  assert(service.needsRehash('abc') === true, 'needsRehash("abc") debe retornar true')

  const crypto = createMockCrypto()
  const service2 = new PasswordService(crypto)
  const hash = await service2.hash('pass')
  assert(service2.needsRehash(hash) === false, 'needsRehash(hash) debe retornar false')

  console.log('  ✓ testNeedsRehash')
}

async function testDeterministicVerify() {
  const crypto = createMockCrypto()
  const service = new PasswordService(crypto)

  const hash = await service.hash('password123')
  const valid1 = await service.verify('password123', hash)
  const valid2 = await service.verify('password123', hash)

  assert(valid1 === true, 'verify debe ser consistente (1)')
  assert(valid2 === true, 'verify debe ser consistente (2)')

  console.log('  ✓ testDeterministicVerify')
}

export async function runPasswordServiceTests() {
  console.log('\n--- PasswordService Tests ---\n')

  await testHashAndVerify()
  await testVerifyWithInvalidFormat()
  await testNeedsRehash()
  await testDeterministicVerify()

  console.log('\n✓ Todos los tests de PasswordService pasaron\n')
}
