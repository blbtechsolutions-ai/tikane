export class ApiError extends Error {
  public statusCode: number;
  public errors?: unknown[];

  constructor(statusCode: number, message: string, errors?: unknown[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: unknown[]): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Non authentifié'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Accès refusé'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message = 'Ressource introuvable'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }

  static internal(message = 'Erreur interne du serveur'): ApiError {
    return new ApiError(500, message);
  }
}
