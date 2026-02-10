const express = require('express')
const {
  getCart,
  addItemToCart,
  removeItemFromCart,
  clearCart
} = require('../controllers/cart.controller')

const router = express.Router()

router.get('/', getCart)
router.post('/items', addItemToCart)
router.delete('/items', removeItemFromCart)
router.delete('/', clearCart)

module.exports = router
