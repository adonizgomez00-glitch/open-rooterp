export class AuthenticationService {
  constructor(userRepository, sessionService, passwordService) {
    this._userRepo = userRepository
    this._sessionService = sessionService
    this._passwordService = passwordService
    this._currentUser = null
  }

  async authenticate(username, password) {
    if (!username?.trim()) {
      throw new Error('El nombre de usuario es requerido')
    }
    if (!password?.trim()) {
      throw new Error('La contraseña es requerida')
    }
    const user = await this._userRepo.findByUsername(username.trim())
    if (!user) {
      throw new Error('Usuario o contraseña incorrectos')
    }
    if (!user.active) {
      throw new Error('Usuario o contraseña incorrectos')
    }
    const valid = await this._passwordService.verify(password, user.passwordHash)
    if (!valid) {
      throw new Error('Usuario o contraseña incorrectos')
    }
    if (this._passwordService.needsRehash(user.passwordHash)) {
      const newHash = await this._passwordService.hash(password)
      await this._userRepo.update(user.id, { passwordHash: newHash })
    }
    await this._userRepo.update(user.id, { lastLogin: new Date().toISOString() })
    const session = await this._sessionService.create(user.id)
    this._currentUser = user
    return { user: user.toPublicJSON(), session }
  }

  async getCurrentUser() {
    const token = this._sessionService.getStoredToken()
    if (!token) return null
    const session = await this._sessionService.getByToken(token)
    if (!session) return null
    const user = await this._userRepo.findById(session.userId)
    if (!user || !user.active) return null
    this._currentUser = user
    return user.toPublicJSON()
  }

  async logout() {
    const token = this._sessionService.getStoredToken()
    this._currentUser = null
    if (token) {
      await this._sessionService.destroy(token)
    }
  }

  isAuthenticated() {
    return this._currentUser !== null
  }
}
