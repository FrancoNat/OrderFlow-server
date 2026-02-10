const express = require('express')
const router = express.Router()
const auth = require('../middleware/authMiddleware')

router.get('/profile', auth, (req, res) => {
  res.json({
    message: 'Accediste a una ruta protegida',
    userId: req.userId
  })
})

module.exports = router