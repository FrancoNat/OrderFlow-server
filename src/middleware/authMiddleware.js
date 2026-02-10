const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ error: 'Token requerido' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // 👇 dejamos todo el usuario disponible
    req.user = decoded

    next()
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' })
  }
}
