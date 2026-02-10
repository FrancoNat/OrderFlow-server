const prisma = require('../prisma')

/**
 * Obtener carrito del usuario
 */
const getCart = async (req, res) => {
  try {
    const userId = req.user.id // viene del login

    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true }
        }
      }
    })

    // Si no existe, lo creamos vacío
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: { product: true }
          }
        }
      })
    }

    res.json(cart)
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo el carrito" })
  }
}

/**
 * Agregar producto al carrito
 */
const addItemToCart = async (req, res) => {
  try {
    const userId = req.user.id
    const { productId, quantity } = req.body

    if (!productId || !quantity) {
      return res.status(400).json({ error: "Faltan datos" })
    }

    // buscar o crear carrito
    let cart = await prisma.cart.findUnique({
      where: { userId }
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId }
      })
    }

    // ver si el producto ya está en el carrito
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId
      }
    })

    if (existingItem) {
      // sumar cantidad
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity
        }
      })
    } else {
      // crear nuevo item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity
        }
      })
    }

    res.json({ message: "Producto agregado al carrito" })
  } catch (error) {
    res.status(500).json({ error: "Error agregando producto" })
  }
}

/**
 * Eliminar un item del carrito
 */
const removeItemFromCart = async (req, res) => {
  try {
    const userId = req.user.id
    const { productId } = req.body

    if (!productId) {
      return res.status(400).json({ error: "Falta productId" })
    }

    const cart = await prisma.cart.findUnique({
      where: { userId }
    })

    if (!cart) {
      return res.status(404).json({ error: "Carrito no encontrado" })
    }

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        productId
      }
    })

    res.json({ message: "Item eliminado del carrito" })
  } catch (error) {
    res.status(500).json({ error: "Error eliminando item" })
  }
}

/**
 * Vaciar carrito
 */
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id

    const cart = await prisma.cart.findUnique({
      where: { userId }
    })

    if (!cart) {
      return res.status(404).json({ error: "Carrito no encontrado" })
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    })

    res.json({ message: "Carrito vaciado" })
  } catch (error) {
    res.status(500).json({ error: "Error vaciando carrito" })
  }
}

module.exports = { getCart, addItemToCart, removeItemFromCart, clearCart }
