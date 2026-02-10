const express = require('express')
const router = express.Router()

const auth = require('../middleware/authMiddleware')
const isAdmin = require('../middleware/isAdmin')

const {
  createProduct,
  getProducts
} = require('../controllers/productController')

router.post('/', auth, isAdmin, createProduct)
router.get('/', getProducts)

module.exports = router