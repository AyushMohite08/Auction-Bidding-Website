export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: "Route not found." });
}

export function errorHandler(error, req, res, next) {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Invalid JSON body." });
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
