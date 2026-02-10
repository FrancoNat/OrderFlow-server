const prisma = require('../prisma')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const ACCESS_EXPIRES_IN = process.env.ACCESS_EXPIRES_IN || '15m'
const REFRESH_EXPIRES_DAYS = Number(process.env.REFRESH_EXPIRES_DAYS || 7)
const REFRESH_SECRET = process.env.REFRESH_SECRET || process.env.JWT_SECRET

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex')

const createRefreshToken = () =>
  crypto.randomBytes(48).toString('hex')

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    // 🔎 Validaciones
    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Name, email y password son obligatorios'
      })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({
        error: 'El email ya está registrado'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        password: hashedPassword
        // role queda USER por default (schema)
      }
    })

    res.status(201).json({
      message: 'Usuario creado correctamente'
    })
  } catch (error) {
    console.error('ERROR REGISTER:', error)
    res.status(500).json({
      error: 'Error en registro'
    })
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y password son obligatorios'
      })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(400).json({
        error: 'Credenciales inválidas'
      })
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return res.status(400).json({
        error: 'Credenciales inválidas'
      })
    }

    // ✅ TOKEN CON ROLE
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_EXPIRES_IN }
    )

    const refreshToken = createRefreshToken()
    const refreshTokenHash = hashToken(refreshToken)
    const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000)

    await prisma.refreshToken.create({
      data: {
        tokenHash: refreshTokenHash,
        userId: user.id,
        expiresAt
      }
    })

    res.json({ token, refreshToken })
  } catch (error) {
    console.error('ERROR LOGIN:', error)
    res.status(500).json({
      error: 'Error en login'
    })
  }
}

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        error: 'REFRESH_TOKEN_REQUIRED',
        message: 'Refresh token requerido'
      })
    }

    const tokenHash = hashToken(refreshToken)

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    })

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      return res.status(401).json({
        error: 'REFRESH_TOKEN_INVALID',
        message: 'Refresh token inválido'
      })
    }

    // Rotación: revoca el token viejo
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() }
    })

    const newRefreshToken = createRefreshToken()
    const newRefreshTokenHash = hashToken(newRefreshToken)
    const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000)

    await prisma.refreshToken.create({
      data: {
        tokenHash: newRefreshTokenHash,
        userId: stored.userId,
        expiresAt
      }
    })

    const newAccessToken = jwt.sign(
      {
        id: stored.user.id,
        email: stored.user.email,
        role: stored.user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_EXPIRES_IN }
    )

    res.json({ token: newAccessToken, refreshToken: newRefreshToken })
  } catch (error) {
    console.error('ERROR REFRESH:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error refrescando token'
    })
  }
}

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        error: 'REFRESH_TOKEN_REQUIRED',
        message: 'Refresh token requerido'
      })
    }

    const tokenHash = hashToken(refreshToken)

    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() }
    })

    res.json({ message: 'Sesión cerrada' })
  } catch (error) {
    console.error('ERROR LOGOUT:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error cerrando sesión'
    })
  }
}
