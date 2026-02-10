require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { fakeAuth } = require('./middleware/fakeAuth')

const authRoutes = require('./routes/authRoutes')
const profileRoutes = require('./routes/profileRoutes')
const productRoutes = require('./routes/productRoutes')
const orderRoutes = require('./routes/orderRoutes')
const cartRoutes = require('./routes/cart.routes')
const checkoutRoutes = require('./routes/checkout.routes')




const app = express()

app.use(cors())
app.use(express.json())

app.use(fakeAuth)

app.use('/api/auth', authRoutes)
app.use('/api', profileRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/checkout', checkoutRoutes)


app.listen(4000, () => {
  console.log('Servidor corriendo en http://localhost:4000')
})
