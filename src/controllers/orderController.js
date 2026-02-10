const prisma = require('../prisma')

exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id
    const { items } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'La orden debe tener productos' })
    }

    let total = 0
    const orderItems = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })

      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' })
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Stock insuficiente para ${product.name}`
        })
      }

      total += product.price * item.quantity

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price
      })
    }

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          total,
          items: {
            create: orderItems
          }
        },
        include: { items: true }
      })

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity }
          }
        })
      }

      return newOrder
    })

    res.status(201).json(order)
  } catch (error) {
    console.error('ERROR CREATE ORDER:', error)
    res.status(500).json({ error: 'Error creando orden' })
  }
}
