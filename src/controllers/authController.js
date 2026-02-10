const prisma = require('../prisma')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

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
      { expiresIn: '1d' }
    )

    res.json({ token })
  } catch (error) {
    console.error('ERROR LOGIN:', error)
    res.status(500).json({
      error: 'Error en login'
    })
  }
}
