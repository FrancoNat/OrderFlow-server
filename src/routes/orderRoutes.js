const express = require('express')
const router = express.Router()

const auth = require('../middleware/authMiddleware')
const isAdmin = require('../middleware/isAdmin')
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  softDeleteOrder,
  restoreOrder
} = require('../controllers/orderController')

router.post('/', auth, createOrder)
router.get('/me', auth, getMyOrders)
router.get('/', auth, isAdmin, getAllOrders)
router.patch('/:id/status', auth, isAdmin, updateOrderStatus)
router.patch('/:id/delete', auth, isAdmin, softDeleteOrder)
router.patch('/:id/restore', auth, isAdmin, restoreOrder)

module.exports = router
