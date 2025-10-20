# Messenger Brain Sender API

API de alto rendimiento para envío de mensajes WhatsApp con Sequelize ORM y arquitectura MVC.

## Requisitos

- Node.js 18+
- MySQL 8.0+
- Redis 6.0+

## Instalación

```bash
# Clonar repositorio
git clone <repository-url>
cd messenger-brain-sender-api

# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus credenciales de base de datos
```

## Configuración de Base de Datos

### 1. Crear Base de Datos Manualmente

**Opción A: Desde MySQL CLI**
```sql
CREATE DATABASE messenger_brain_sender;
```

**Opción B: Desde phpMyAdmin o MySQL Workbench**
- Crear nueva base de datos llamada `messenger_brain_sender`

### 2. Configurar Variables de Entorno

**Desarrollo Local:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=messenger_brain_sender
```

**Producción (Digital Ocean):**
```env
DB_HOST=tu-digital-ocean-host
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=messenger_brain_sender
```

### 3. Ejecutar Migraciones y Seeds

```bash
# Compilar proyecto
npm run build

# Ejecutar migraciones (crear tablas)
npm run db:migrate

# Ejecutar seeds (datos iniciales)
npm run db:seed

# O ejecutar ambos comandos juntos
npm run db:setup
```

## Ejecución

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

## Comandos de Base de Datos

```bash
# Migraciones
npm run db:migrate              # Ejecutar migraciones
npm run db:migrate:undo         # Revertir última migración
npm run db:migrate:undo:all     # Revertir todas las migraciones

# Seeds (datos iniciales)
npm run db:seed                 # Ejecutar seeds
npm run db:seed:undo            # Revertir seeds

# Setup completo
npm run db:setup                # Migraciones + Seeds
npm run db:reset                # Reset completo (drop + create + setup)

# Generar archivos
npm run migration:generate --name nombre_migracion
npm run seed:generate --name nombre_seed
```

## Usuario Administrador

Después de ejecutar los seeds, se crea automáticamente un usuario administrador:

```
Email: admin@messengerbrain.com
Password: messengerbrain!@.
```

**⚠️ IMPORTANTE:** Cambia esta contraseña en producción.

## Endpoints Principales

- `GET /api-docs` - Documentación Swagger
- `POST /api/auth/login` - Autenticación
- `GET /api/users` - Gestión de usuarios
- `POST /api/messages` - Envío de mensajes
- `GET /api/sessions` - Sesiones WhatsApp

## Estructura del Proyecto

```
src/
├── config/          # Configuración (DB, Swagger, etc.)
├── controllers/     # Controladores MVC
├── middleware/      # Middleware (auth, validation, etc.)
├── models/          # Modelos Sequelize
├── routes/          # Definición de rutas
├── services/        # Lógica de negocio
├── types/           # Tipos TypeScript
└── utils/           # Utilidades
```

## Configuración por Entornos

El proyecto soporta diferentes entornos de ejecución con configuraciones específicas:

### 🏠 Desarrollo (Por Defecto)
```env
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_local
DB_NAME=messenger_brain_sender
DB_PORT=3306
```

**Características:**
- ✅ Logging de queries SQL habilitado
- ✅ Pool de conexiones pequeño (máx 10)
- ✅ Configuración flexible para desarrollo local

### 🚀 Producción
```env
NODE_ENV=production
DB_HOST=tu-digital-ocean-host
DB_USER=tu_usuario_prod
DB_PASSWORD=tu_password_prod
DB_NAME=messenger_brain_sender
DB_PORT=3306
```

**Características:**
- 🚀 Sin logging (mejor performance)
- 🚀 Pool de conexiones grande (máx 20)
- 🚀 Conexiones persistentes (mín 5)

### 🧪 Testing
```env
NODE_ENV=test
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_test
DB_NAME=messenger_brain_sender_test
DB_PORT=3306
```

**Características:**
- 🧪 Base de datos separada (`_test`)
- 🧪 Pool mínimo para tests rápidos
- 🧪 Sin logging para output limpio

### 📋 Comandos por Entorno

```bash
# Desarrollo (por defecto)
npm run dev
npm run db:migrate
npm run db:seed

# Producción
NODE_ENV=production npm run db:migrate
NODE_ENV=production npm run db:seed
NODE_ENV=production npm start

# Testing
NODE_ENV=test npm run db:migrate
NODE_ENV=test npm run db:seed
NODE_ENV=test npm test
```

## Variables de Entorno Críticas

- `NODE_ENV` - Entorno de ejecución (development/production/test)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - Configuración MySQL
- `JWT_SECRET` - Clave para tokens JWT
- `REDIS_HOST`, `REDIS_PORT` - Configuración Redis

## Casos de Uso Comunes

### 👨‍💻 Desarrollador Nuevo
```bash
# 1. Clonar y configurar
git clone <repository-url>
cd messenger-brain-sender-api
npm install

# 2. Configurar entorno local
cp env.example .env
# Editar .env con tus credenciales locales

# 3. Crear base de datos
mysql -u root -p
CREATE DATABASE messenger_brain_sender;

# 4. Setup completo
npm run build
npm run db:setup

# 5. Iniciar desarrollo
npm run dev
```

### 🚀 Deploy a Producción
```bash
# 1. Configurar variables de producción
export NODE_ENV=production
export DB_HOST=tu-servidor-prod
export DB_USER=tu_usuario_prod
export DB_PASSWORD=tu_password_prod

# 2. Ejecutar migraciones en producción
NODE_ENV=production npm run db:migrate

# 3. Ejecutar seeds en producción
NODE_ENV=production npm run db:seed

# 4. Iniciar servidor de producción
NODE_ENV=production npm start
```

### 🧪 Ejecutar Tests
```bash
# 1. Crear base de datos de test
mysql -u root -p
CREATE DATABASE messenger_brain_sender_test;

# 2. Configurar entorno de test
export NODE_ENV=test
export DB_NAME=messenger_brain_sender_test

# 3. Setup de test
NODE_ENV=test npm run db:setup

# 4. Ejecutar tests
NODE_ENV=test npm test
```

### 🔄 Cambiar Entre Entornos
```bash
# Verificar entorno actual
echo $NODE_ENV

# Cambiar a desarrollo
export NODE_ENV=development
npm run dev

# Cambiar a producción
export NODE_ENV=production
npm start

# Cambiar a test
export NODE_ENV=test
npm test
```

## Archivos de Configuración por Entorno

### 📁 Estructura Recomendada
```
messenger-brain-sender-api/
├── .env                    # Variables locales (NO commitear)
├── .env.example           # Plantilla de variables
├── .env.development       # Variables específicas desarrollo
├── .env.production        # Variables específicas producción
├── .env.test              # Variables específicas testing
└── config/
    └── database.js        # Configuración Sequelize
```

### 📝 Archivos .env por Entorno

**`.env.development`**
```env
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_local
DB_NAME=messenger_brain_sender
DB_PORT=3306
JWT_SECRET=tu-jwt-secret-desarrollo
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
```

**`.env.production`**
```env
NODE_ENV=production
DB_HOST=tu-digital-ocean-host
DB_USER=tu_usuario_prod
DB_PASSWORD=tu_password_prod_seguro
DB_NAME=messenger_brain_sender
DB_PORT=3306
JWT_SECRET=tu-jwt-secret-super-seguro-produccion
REDIS_HOST=tu-redis-host-prod
REDIS_PORT=6379
PORT=5000
```

**`.env.test`**
```env
NODE_ENV=test
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_test
DB_NAME=messenger_brain_sender_test
DB_PORT=3306
JWT_SECRET=tu-jwt-secret-test
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3001
```

### 🔧 Cargar Configuración por Entorno

```bash
# Cargar configuración específica
source .env.development
npm run dev

# O usar dotenv-cli
npm install -g dotenv-cli
dotenv -e .env.production npm start
```

## Troubleshooting

### Error de Conexión a Base de Datos
```bash
# Verificar que MySQL esté corriendo
mysql -u root -p

# Verificar que la base de datos existe
SHOW DATABASES;

# Si no existe, crearla
CREATE DATABASE messenger_brain_sender;
```

### Error en Migraciones
```bash
# Verificar estado de migraciones
npx sequelize-cli db:migrate:status

# Revertir todas las migraciones si hay problemas
npm run db:migrate:undo:all

# Ejecutar migraciones nuevamente
npm run db:migrate
```

### Error en Seeds
```bash
# Revertir seeds si hay problemas
npm run db:seed:undo

# Ejecutar seeds nuevamente
npm run db:seed
```

### Reset Completo de Base de Datos
```bash
# ⚠️ CUIDADO: Esto elimina todos los datos
npm run db:reset
```

## Comandos Rápidos de Referencia

### 🚀 Setup Inicial (Desarrollador Nuevo)
```bash
git clone <repo> && cd messenger-brain-sender-api
npm install
cp env.example .env
# Editar .env con tus credenciales
mysql -u root -p -e "CREATE DATABASE messenger_brain_sender;"
npm run build && npm run db:setup && npm run dev
```

### 🔄 Cambio de Entorno Rápido
```bash
# Desarrollo
NODE_ENV=development npm run dev

# Producción  
NODE_ENV=production npm start

# Testing
NODE_ENV=test npm test
```

### 🗃️ Base de Datos Rápido
```bash
# Migraciones
npm run db:migrate              # Ejecutar
npm run db:migrate:undo         # Revertir última
npm run db:migrate:undo:all     # Revertir todas

# Seeds
npm run db:seed                 # Ejecutar
npm run db:seed:undo           # Revertir

# Setup completo
npm run db:setup                # Migraciones + Seeds
npm run db:reset                # Reset total
```

### 🔍 Verificación Rápida
```bash
# Estado de migraciones
npx sequelize-cli db:migrate:status

# Verificar conexión
mysql -u root -p -e "SHOW DATABASES;"

# Verificar entorno
echo $NODE_ENV
```

## Comandos Útiles

```bash
# Compilar TypeScript
npm run build

# Linting
npm run lint

# Tests
npm test

# Verificar conexión DB
npm run db:test
```