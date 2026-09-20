export class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }

  static badRequest(message, details) {
    return new ApiError(400, message || 'Requête invalide', details);
  }

  static unauthorized(message) {
    return new ApiError(401, message || 'Non authentifié');
  }

  static forbidden(message) {
    return new ApiError(403, message || 'Accès refusé');
  }

  static notFound(message) {
    return new ApiError(404, message || 'Ressource introuvable');
  }

  static conflict(message) {
    return new ApiError(409, message || 'Conflit');
  }
}