function asyncHandler(handler) {
  return (req, res, next) => {
    // Redirige automatiquement les erreurs asynchrones vers le middleware global.
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

module.exports = {
  asyncHandler
};
