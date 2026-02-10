const fakeAuth = (req, res, next) => {
  // Permite setear el userId desde el header sin tocar el archivo
  const headerUserId = req.header('x-user-id')
  req.user = { id: headerUserId || '1f29c311-22e1-41d6-b5be-223e44215ab5' }
  next()
}

module.exports = { fakeAuth }
