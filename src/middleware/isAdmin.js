const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ error: 'Token requerido' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Acceso solo para administradores'
      })
    }

    req.userId = decoded.userId
    req.userRole = decoded.role

    next()
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' })
  }
}
