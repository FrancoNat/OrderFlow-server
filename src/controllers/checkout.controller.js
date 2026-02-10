const prisma = require("../prisma");

/**
 * Procesar checkout (carrito → orden)
 */
const checkout = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: "UNAUTHENTICATED",
        message: "Usuario no autenticado"
      });
    }

    // 1️⃣ Buscar carrito con productos
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        error: "CART_EMPTY",
        message: "El carrito está vacío"
      });
    }

    let total = 0;

    // 2️⃣ Verificar stock y calcular total
    for (const item of cart.items) {
      if (!item.product) {
        return res.status(400).json({
          error: "PRODUCT_NOT_FOUND",
          message: "Producto no encontrado en el carrito"
        });
      }
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          error: "STOCK_INSUFFICIENT",
          message: `No hay stock suficiente para ${item.product.name}`
        });
      }

      total += item.product.price * item.quantity;
    }

    // 3️⃣ Transacción (todo o nada)
    const result = await prisma.$transaction(async (tx) => {
      // crear orden
      const newOrder = await tx.order.create({
        data: {
          userId,
          total,
          status: "PENDING"
        }
      });

      // crear items + descontar stock
      for (const item of cart.items) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price
          }
        });

        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity }
          },
          data: {
            stock: { decrement: item.quantity }
          }
        });

        if (updated.count === 0) {
          throw new Error(`STOCK_INSUFFICIENT:${item.product.name}`);
        }
      }

      const orderItems = await tx.orderItem.findMany({
        where: { orderId: newOrder.id },
        include: { product: true }
      });

      // vaciar carrito
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      return { order: newOrder, items: orderItems };
    });

    res.json({
      message: "Compra realizada con éxito",
      order: result.order,
      items: result.items,
      total: result.order.total
    });

  } catch (error) {
    console.error("CHECKOUT ERROR:", error);
    if (typeof error.message === "string" && error.message.startsWith("STOCK_INSUFFICIENT:")) {
      const name = error.message.split(":")[1] || "producto";
      return res.status(400).json({
        error: "STOCK_INSUFFICIENT",
        message: `No hay stock suficiente para ${name}`
      });
    }
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Error al procesar el checkout"
    });
  }
};

module.exports = {
  checkout
};
