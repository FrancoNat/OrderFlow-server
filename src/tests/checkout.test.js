const request = require('supertest')
const { PrismaClient } = require('@prisma/client')
const app = require('../app')

const prisma = new PrismaClient()

describe('Checkout', () => {
  let userId
  let productId
  let cartId

  beforeAll(async () => {
    const email = `test_${Date.now()}@example.com`

    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email,
        password: 'hashed'
      }
    })
    userId = user.id

    const category = await prisma.category.create({
      data: { name: `TestCat_${Date.now()}` }
    })

    const product = await prisma.product.create({
      data: {
        name: 'Test Product',
        description: 'Test',
        price: 100,
        stock: 10,
        categoryId: category.id
      }
    })
    productId = product.id

    const cart = await prisma.cart.create({
      data: { userId }
    })
    cartId = cart.id

    await prisma.cartItem.create({
      data: {
        cartId,
        productId,
        quantity: 1
      }
    })
  })

  afterAll(async () => {
    await prisma.cartItem.deleteMany({ where: { cartId } })
    await prisma.cart.deleteMany({ where: { id: cartId } })
    await prisma.orderItem.deleteMany({ where: { order: { userId } } })
    await prisma.order.deleteMany({ where: { userId } })
    await prisma.product.deleteMany({ where: { id: productId } })
    await prisma.category.deleteMany({ where: { name: { startsWith: 'TestCat_' } } })
    await prisma.user.deleteMany({ where: { id: userId } })
    await prisma.$disconnect()
  })

  it('crea una orden correctamente', async () => {
    const res = await request(app)
      .post('/api/checkout')
      .set('x-user-id', userId)

    expect(res.statusCode).toBe(200)
    expect(res.body.order).toBeDefined()
    expect(res.body.items.length).toBeGreaterThan(0)
    expect(res.body.total).toBeGreaterThan(0)
  })
})
