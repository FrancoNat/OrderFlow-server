const express = require('express')
const router = express.Router()

const auth = require('../middleware/authMiddleware')
const isAdmin = require('../middleware/isAdmin')
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController')

router.post('/', auth, createOrder)
router.get('/me', auth, getMyOrders)
router.get('/', auth, isAdmin, getAllOrders)
router.patch('/:id/status', auth, isAdmin, updateOrderStatus)

module.exports = router
