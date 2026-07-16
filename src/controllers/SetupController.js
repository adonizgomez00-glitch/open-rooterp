import { handleError } from '../utils/errors.js'

export class SetupController {
  constructor(systemService, passwordService, authenticationService, setupView, onComplete) {
    this._systemService = systemService
    this._passwordService = passwordService
    this._authService = authenticationService
    this._view = setupView
    this._onComplete = onComplete
  }

  init(container) {
    this._view.render(container)
    this._view.onSetup((data) => this.handleSetup(data))
  }

  async handleSetup(data) {
    this._view.showLoading()
    try {
      const passwordHash = await this._passwordService.hash(data.password)
      await this._systemService.setupInitial({
        businessName: data.businessName,
        username: data.username,
        passwordHash
      })
      await this._authService.authenticate(data.username, data.password)
      this._view.showSuccess('Sistema configurado correctamente')
      if (this._onComplete) {
        this._onComplete()
      }
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }
}
