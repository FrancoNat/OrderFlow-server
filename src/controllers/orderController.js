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

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(orders)
  } catch (error) {
    console.error('ERROR GET MY ORDERS:', error)
    res.status(500).json({ error: 'Error obteniendo órdenes' })
  }
}

exports.getAllOrders = async (req, res) => {
  try {
    const { status } = req.query

    if (status && !['PENDING', 'PAID', 'CANCELLED', 'DONE'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' })
    }

    const orders = await prisma.order.findMany({
      where: status ? { status } : undefined,
      include: {
        items: {
          include: { product: true }
        },
        user: true
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(orders)
  } catch (error) {
    console.error('ERROR GET ALL ORDERS:', error)
    res.status(500).json({ error: 'Error obteniendo órdenes' })
  }
}

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status || !['PENDING', 'PAID', 'CANCELLED', 'DONE'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' })
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true }
    })

    res.json(order)
  } catch (error) {
    console.error('ERROR UPDATE ORDER STATUS:', error)
    res.status(500).json({ error: 'Error actualizando estado' })
  }
}
