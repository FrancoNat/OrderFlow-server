const prisma = require("../prisma");

/**
 * Procesar checkout (carrito → orden)
 */
const checkout = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
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
      return res.status(400).json({ error: "El carrito está vacío" });
    }

    let total = 0;

    // 2️⃣ Verificar stock y calcular total
    for (const item of cart.items) {
      if (!item.product) {
        return res.status(400).json({
          error: "Producto no encontrado en el carrito"
        });
      }
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          error: `Stock insuficiente para ${item.product.name}`
        });
      }

      total += item.product.price * item.quantity;
    }

    // 3️⃣ Transacción (todo o nada)
    const order = await prisma.$transaction(async (tx) => {
      // crear orden
      const newOrder = await tx.order.create({
        data: {
          userId,
          total,
          status: "PENDING"
        },
        include: { items: true }
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

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      // vaciar carrito
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      return newOrder;
    });

    res.json({
      message: "Compra realizada con éxito",
      order
    });

  } catch (error) {
    console.error("CHECKOUT ERROR:", error);
    res.status(500).json({
      error: "Error al procesar el checkout",
      detail: error.message
    });
  }
};

module.exports = {
  checkout
};
