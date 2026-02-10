const prisma = require('../prisma')

exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id
    const { items } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({
        error: 'ITEMS_REQUIRED',
        message: 'La orden debe tener productos'
      })
    }

    let total = 0
    const orderItems = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })

      if (!product) {
        return res.status(404).json({
          error: 'PRODUCT_NOT_FOUND',
          message: 'Producto no encontrado'
        })
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: 'STOCK_INSUFFICIENT',
          message: `No hay stock suficiente para ${product.name}`
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
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity }
          },
          data: {
            stock: { decrement: item.quantity }
          }
        })

        if (updated.count === 0) {
          throw new Error('STOCK_INSUFFICIENT')
        }
      }

      return newOrder
    })

    res.status(201).json(order)
  } catch (error) {
    console.error('ERROR CREATE ORDER:', error)
    if (error.message === 'STOCK_INSUFFICIENT') {
      return res.status(400).json({
        error: 'STOCK_INSUFFICIENT',
        message: 'No hay stock suficiente para uno o más productos'
      })
    }
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error creando orden' })
  }
}

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id

    const orders = await prisma.order.findMany({
      where: { userId, deletedAt: null },
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
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error obteniendo órdenes' })
  }
}

exports.getAllOrders = async (req, res) => {
  try {
    const { status, includeDeleted } = req.query

    if (status && !['PENDING', 'PAID', 'CANCELLED', 'SHIPPED'].includes(status)) {
      return res.status(400).json({ error: 'INVALID_STATUS', message: 'Estado inválido' })
    }

    const includeDeletedBool =
      includeDeleted === 'true' || includeDeleted === '1'

    const orders = await prisma.order.findMany({
      where: includeDeletedBool
        ? status
          ? { status }
          : {}
        : status
        ? { status, deletedAt: null }
        : { deletedAt: null },
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
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error obteniendo órdenes' })
  }
}

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status || !['PENDING', 'PAID', 'CANCELLED', 'SHIPPED'].includes(status)) {
      return res.status(400).json({ error: 'INVALID_STATUS', message: 'Estado inválido' })
    }

    const current = await prisma.order.findUnique({
      where: { id }
    })

    if (!current || current.deletedAt) {
      return res.status(404).json({ error: 'ORDER_NOT_FOUND', message: 'Orden no encontrada' })
    }

    // Reglas simples de transición
    if (current.status === 'CANCELLED') {
      return res.status(400).json({
        error: 'ORDER_STATUS_LOCKED',
        message: 'No se puede modificar una orden cancelada'
      })
    }
    if (current.status === 'SHIPPED') {
      return res.status(400).json({
        error: 'ORDER_STATUS_LOCKED',
        message: 'No se puede modificar una orden enviada'
      })
    }
    if (current.status === 'PENDING' && status === 'SHIPPED') {
      return res.status(400).json({
        error: 'INVALID_STATUS_TRANSITION',
        message: 'No se puede enviar una orden pendiente'
      })
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true }
    })

    res.json(order)
  } catch (error) {
    console.error('ERROR UPDATE ORDER STATUS:', error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error actualizando estado' })
  }
}

exports.softDeleteOrder = async (req, res) => {
  try {
    const { id } = req.params

    const order = await prisma.order.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    res.json({ message: 'Orden eliminada (soft delete)', order })
  } catch (error) {
    console.error('ERROR SOFT DELETE ORDER:', error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error eliminando orden' })
  }
}

exports.restoreOrder = async (req, res) => {
  try {
    const { id } = req.params

    const order = await prisma.order.update({
      where: { id },
      data: { deletedAt: null }
    })

    res.json({ message: 'Orden restaurada', order })
  } catch (error) {
    console.error('ERROR RESTORE ORDER:', error)
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error restaurando orden' })
  }
}
