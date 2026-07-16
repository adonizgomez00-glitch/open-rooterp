export class AppError extends Error {
  constructor(message, code = 'APP_ERROR') {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource, id) {
    super(`${resource} con id ${id} no encontrado`, 'NOT_FOUND')
    this.name = 'NotFoundError'
    this.resource = resource
    this.resourceId = id
  }
}

export function handleError(error, view) {
  const message = error.message || 'Ha ocurrido un error inesperado'
  view.showError(message)
}