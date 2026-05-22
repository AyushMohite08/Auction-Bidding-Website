import { DEFAULT_SERVICE_UNAVAILABLE_MESSAGE } from "../constants/appConstants.js";

export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: "Route not found." });
}

export function isDatabaseUnavailableError(error) {
  return [
    "ECONNREFUSED",
    "ECONNRESET",
    "ETIMEDOUT",
    "EHOSTUNREACH",
    "ENOTFOUND",
    "PROTOCOL_CONNECTION_LOST",
    "ER_CON_COUNT_ERROR",
    "ER_SERVER_SHUTDOWN",
  ].includes(error?.code);
}

export function sendControllerError(res, error, fallbackMessage, fallbackStatus = 500) {
  if (isDatabaseUnavailableError(error)) {
    console.error("Database unavailable:", error.message);
    return res.status(503).json({
      success: false,
      message: DEFAULT_SERVICE_UNAVAILABLE_MESSAGE,
    });
  }

  return res.status(fallbackStatus).json({
    success: false,
    message: fallbackStatus === 400 && error?.message ? error.message : fallbackMessage || "Request failed.",
  });
}

export function errorHandler(error, req, res, next) {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Invalid JSON body." });
  }

  if (isDatabaseUnavailableError(error)) {
    console.error("Database unavailable:", error.message);
    return res.status(503).json({
      success: false,
      message: DEFAULT_SERVICE_UNAVAILABLE_MESSAGE,
    });
  }

  if (error.status || error.statusCode) {
    return res.status(error.status || error.statusCode).json({
      success: false,
      message: error.message || "Request failed.",
    });
  }

  console.error(error);
  res.status(500).json({ success: false, message: "Something went wrong." });
}
