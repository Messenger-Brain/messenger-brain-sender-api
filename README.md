# Messenger Brain Sender API

API de alto rendimiento para envío de mensajes WhatsApp con Sequelize ORM y arquitectura MVC.

## 📋 Requisitos Previos

- Node.js 18+
- MySQL 8.0+
- Redis 6.0+

## 🚀 Setup Inicial para Desarrolladores

### 1. Clonar e Instalar Dependencias

```bash
git clone <repository-url>
cd messenger-brain-sender-api
npm install
```

### 2. Configurar Variables de Entorno

```bash
cp env.example .env
```

Edita el archivo `.env` con tus credenciales locales:

```env
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=messenger_brain_sender
DB_PORT=3306

JWT_SECRET=tu-jwt-secret-aqui
SESSION_SECRET=tu-session-secret-aqui

REDIS_HOST=localhost
REDIS_PORT=6379

PORT=9000
```

### 3. Crear Base de Datos

```bash
mysql -u root -p
```

```sql
CREATE DATABASE messenger_brain_sender;
exit;
```

### 4. Ejecutar Migraciones y Seeds

```bash
# Compilar el proyecto
npm run build

# Ejecutar migraciones (crear tablas) y seeds (datos iniciales)
npm run db:setup
```

Este comando creará todas las tablas y generará automáticamente:
- Usuario administrador
- Token personal para testing (guardado en `ADMIN_TOKEN.txt`)
- Datos de catálogo (status, roles, etc.)

### 5. Iniciar el Servidor

```bash
# Modo desarrollo con hot-reload
npm run dev:clean
```

El servidor estará disponible en: `http://localhost:9000`

## 👤 Credenciales de Admin

Después de ejecutar los seeds, tendrás acceso a:

**Email:** `admin@messengerbrain.com`  
**Password:** `messengerbrain!@.`  
**Token Personal:** Ver archivo `ADMIN_TOKEN.txt`

⚠️ **IMPORTANTE:** Cambia estas credenciales en producción.

## 🔑 Autenticación para Testing

Puedes usar el token personal generado automáticamente:

```bash
curl -H "Authorization: Bearer <token-from-ADMIN_TOKEN.txt>" \
  http://localhost:9000/api/users
```

## 📚 Documentación API

Una vez iniciado el servidor, accede a la documentación Swagger:

```
http://localhost:9000/api-docs
```

## 🗃️ Comandos de Base de Datos

```bash
# Setup completo (migraciones + seeds)
npm run db:setup

# Reset completo (elimina y recrea todo)
npm run db:reset

# Solo migraciones
npm run db:migrate
npm run db:migrate:undo

# Solo seeds
npm run db:seed
npm run db:seed:undo
```

## 🛠️ Comandos de Desarrollo

```bash
# Desarrollo con hot-reload (recomendado)
npm run dev:clean

# Desarrollo (solo si puerto está libre)
npm run dev

# Compilar TypeScript
npm run build

# Linting
npm run lint
npm run lint:fix

# Tests
npm test
```

## 🌍 Configuración por Entornos

### Desarrollo (Por Defecto)
```env
NODE_ENV=development
DB_NAME=messenger_brain_sender
```

### Producción
```env
NODE_ENV=production
DB_HOST=tu-servidor-produccion
DB_USER=tu_usuario_prod
DB_PASSWORD=tu_password_seguro
DB_NAME=messenger_brain_sender
```

Para ejecutar en producción:
```bash
NODE_ENV=production npm run db:migrate
NODE_ENV=production npm run db:seed
NODE_ENV=production npm start
```

### Testing
```env
NODE_ENV=test
DB_NAME=messenger_brain_sender_test
```

Para ejecutar tests:
```bash
# Crear base de datos de test
mysql -u root -p -e "CREATE DATABASE messenger_brain_sender_test;"

# Setup y ejecutar tests
NODE_ENV=test npm run db:setup
NODE_ENV=test npm test
```

## 📁 Estructura del Proyecto

```
src/
├── config/          # Configuración (DB, Swagger, Redis, etc.)
├── controllers/     # Controladores MVC
├── middleware/      # Middleware (auth, validation, rate limiting)
├── models/          # Modelos Sequelize
├── routes/          # Definición de rutas
├── services/        # Lógica de negocio
├── schemas/         # Esquemas de validación Joi
├── types/           # Tipos TypeScript
└── utils/           # Utilidades y helpers

migrations/          # Migraciones de base de datos
seeds/              # Seeds de datos iniciales
```

## 🐛 Troubleshooting

### Puerto 9000 ocupado
```bash
npm run dev:clean  # Limpia el puerto y reinicia
```

### Error de conexión a MySQL
```bash
# Verificar que MySQL esté corriendo
mysql -u root -p

# Verificar base de datos
SHOW DATABASES;
```

### Problemas con migraciones
```bash
# Ver estado de migraciones
npx sequelize-cli db:migrate:status

# Reset completo si hay problemas
npm run db:reset
```

### Token de admin no generado
```bash
# El token se genera automáticamente en db:seed
# Verifica el archivo ADMIN_TOKEN.txt en la raíz del proyecto
cat ADMIN_TOKEN.txt
```

## 📞 Endpoints Principales

- **Documentación:** `GET /api-docs`
- **Autenticación:** `POST /api/auth/login`
- **Usuarios:** `GET /api/users`
- **Sesiones WhatsApp:** `GET /api/whatsapp-sessions`
- **Mensajes:** `POST /api/messages`

## 🔐 Seguridad

- JWT para autenticación web
- Tokens personales para integraciones API
- Rate limiting por endpoint
- Validación de datos con Joi
- Encriptación de contraseñas con bcrypt

## ⚡ Performance

- Pool de conexiones MySQL optimizado
- Redis para caching y colas
- Bull queues para procesamiento asíncrono
- Arquitectura preparada para 3000+ req/hora por sesión

## 📝 Notas Importantes

1. **ADMIN_TOKEN.txt** está en `.gitignore` - no se subirá al repositorio
2. Usa `npm run dev:clean` para evitar problemas de puerto ocupado
3. El comando `npm run db:reset` elimina TODOS los datos
4. En producción, genera nuevos secrets para `JWT_SECRET` y `SESSION_SECRET`
5. El token personal del admin se regenera cada vez que ejecutas `npm run db:seed`

---

**¿Necesitas ayuda?** Revisa la documentación completa en `/api-docs` o contacta al equipo de desarrollo.
