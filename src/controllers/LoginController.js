import { handleError } from '../utils/errors.js'

export class LoginController {
  constructor(authenticationService, loginView, onAuthenticated) {
    this._authService = authenticationService
    this._view = loginView
    this._onAuthenticated = onAuthenticated
  }

  init(container) {
    this._view.render(container)
    this._view.onLogin((username, password) => this.handleLogin(username, password))
  }

  async handleLogin(username, password) {
    this._view.showLoading()
    try {
      await this._authService.authenticate(username, password)
      if (this._onAuthenticated) {
        this._onAuthenticated()
      }
    } catch (error) {
      handleError(error, this._view)
    } finally {
      this._view.hideLoading()
    }
  }

  async handleLogout() {
    this._view.showLoading()
    try {
      await this._authService.logout()
    } catch {
    } finally {
      this._view.hideLoading()
    }
  }
}
