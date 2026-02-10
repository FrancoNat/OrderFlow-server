# 🛒 OrderFlow API

OrderFlow es una API REST de e-commerce desarrollada en Node.js que gestiona autenticación, productos, carrito, órdenes y checkout, con control de stock, roles de usuario y estados de orden.

Está pensada como un backend realista, siguiendo flujos de negocio usados en producción.

## 🚀 Features principales
- Autenticación con JWT (access + refresh)
- Roles y permisos (USER / ADMIN)
- CRUD de productos (solo admin)
- Carrito por usuario
- Checkout transaccional
- Creación de órdenes con items
- Control de stock
- Estados de orden (PENDING, PAID, SHIPPED, CANCELLED)
- Historial de órdenes por usuario
- Gestión de órdenes por admin
- Soft delete de órdenes (deletedAt)

## 🧰 Tech Stack
- Node.js
- Express
- Prisma ORM
- PostgreSQL
- JWT Authentication

## 👥 Roles
### USER
- Ver productos
- Administrar su carrito
- Realizar checkout
- Ver su historial de órdenes

### ADMIN
- Crear / editar productos
- Ver todas las órdenes
- Filtrar órdenes por estado
- Cambiar estado de órdenes
- Soft delete / restore de órdenes

## ⚙️ Setup rápido
### 1️⃣ Variables de entorno
Crear un archivo `.env`:
```
DATABASE_URL="postgresql://postgres:1234@localhost:5432/orderflow"
JWT_SECRET=supersecreto123
REFRESH_SECRET=supersecreto123
ACCESS_EXPIRES_IN=15m
REFRESH_EXPIRES_DAYS=7
```

### 2️⃣ Instalar dependencias
```
npm install
```

### 3️⃣ Migraciones de base de datos
```
npx prisma migrate dev
```

### 4️⃣ Levantar el servidor
```
node src/server.js
```

Servidor disponible en:

`http://localhost:4000`

## 🔑 Autenticación
La mayoría de los endpoints requieren JWT.

Enviar el token en el header:

`Authorization: Bearer <TOKEN>`

## 📌 Endpoints principales
### 🔐 Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### 📦 Products
- `GET /api/products`
- `POST /api/products` → ADMIN

### 🛒 Cart
- `GET /api/cart`
- `POST /api/cart/items`
- `DELETE /api/cart/items`
- `DELETE /api/cart`

### 📑 Orders
**Usuario**
- `GET /api/orders/me` → historial de órdenes del usuario

**Admin**
- `GET /api/orders`
- Filtros:
  - `?status=PENDING`
  - `?includeDeleted=true`
- `PATCH /api/orders/:id/status`
- `PATCH /api/orders/:id/delete`
- `PATCH /api/orders/:id/restore`

### 💳 Checkout
- `POST /api/checkout`

## ✅ Flujo de checkout
- Valida usuario autenticado
- Verifica carrito no vacío
- Controla stock disponible
- Crea orden + items
- Descuenta stock
- Vacía carrito
- Devuelve orden creada

## 🧠 Notas técnicas
- El checkout se maneja de forma transaccional para evitar inconsistencias.
- El stock nunca puede quedar negativo.
- Las órdenes no se eliminan físicamente (soft delete).
- Los permisos están protegidos por middleware según rol.
- Refresh tokens se guardan con hash y se rotan en cada refresh.

## 📮 Testing
Los endpoints pueden probarse fácilmente con Postman o Insomnia utilizando JWT.

## 📌 Autor
Desarrollado por Franco Bogado
Backend Developer
