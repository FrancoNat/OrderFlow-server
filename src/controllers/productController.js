const prisma = require('../prisma')

// =======================
// CREATE PRODUCT
// =======================
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, categoryName } = req.body

    // ✅ Validaciones
    if (!name || price === undefined || stock === undefined || !categoryName) {
      return res.status(400).json({
        error: 'Name, price, stock y categoryName son obligatorios'
      })
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: Number(price),
        stock: Number(stock),
        category: {
          connectOrCreate: {
            where: { name: categoryName.trim() },
            create: { name: categoryName.trim() }
          }
        }
      }
    })

    res.status(201).json(product)
  } catch (error) {
    console.error('ERROR CREATE PRODUCT:', error)
    res.status(500).json({ error: error.message })
  }
}

// =======================
// GET PRODUCTS
// =======================
exports.getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true
      }
    })

    res.json(products)
  } catch (error) {
    console.error('ERROR GET PRODUCTS:', error)
    res.status(500).json({ error: error.message })
  }
}


