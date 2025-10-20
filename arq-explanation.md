# Arquitectura del Proyecto Messenger Brain Sender API

## Descripción General

El proyecto Messenger Brain Sender API es una aplicación backend desarrollada en Node.js con TypeScript que proporciona una API RESTful para la gestión de sesiones de WhatsApp, envío de mensajes masivos y administración de usuarios. La arquitectura sigue el patrón MVC (Model-View-Controller) con una separación clara de responsabilidades.

## Stack Tecnológico

### **Backend Core**
- **Node.js** (v18+): Runtime de JavaScript para servidor
- **TypeScript** (v5.2+): Lenguaje principal con tipado estático
- **Express.js** (v4.18+): Framework web para APIs REST

### **Base de Datos y ORM**
- **MySQL** (v8.0+): Base de datos relacional principal
- **Sequelize** (v6.37+): ORM para Node.js con soporte completo de TypeScript
- **Sequelize CLI** (v6.6+): Herramientas de línea de comandos para migraciones

### **Autenticación y Seguridad**
- **JWT (jsonwebtoken)** (v9.0+): Tokens de autenticación stateless
- **bcryptjs** (v3.0+): Hash seguro de contraseñas
- **Helmet** (v7.1+): Middleware de seguridad HTTP
- **CORS** (v2.8+): Control de acceso entre orígenes

### **Validación y Documentación**
- **Joi** (v17.11+): Validación de esquemas de datos
- **Swagger/OpenAPI**: Documentación automática de API
- **swagger-jsdoc** + **swagger-ui-express**: Generación y visualización de docs

### **Cache y Colas**
- **Redis** (v5.8+): Cache en memoria y sistema de colas
- **Bull** (v4.16+): Sistema de colas basado en Redis
- **ioredis** (v5.7+): Cliente Redis optimizado

### **Logging y Monitoreo**
- **Winston** (v3.11+): Sistema de logging estructurado
- **Morgan** (v1.10+): Logger de peticiones HTTP
- **express-rate-limit** (v7.1+): Control de velocidad de peticiones

### **Herramientas de Desarrollo**
- **ESLint** + **TypeScript ESLint**: Linting y análisis de código
- **Jest** (v29.7+): Framework de testing
- **ts-node-dev** (v2.0+): Desarrollo con recarga automática

## Componentes Principales

### 1. **Configuración y Servicios Base**

**ConfigService**: Servicio singleton que centraliza toda la configuración de la aplicación, incluyendo variables de entorno, configuración de base de datos, Redis, CORS y seguridad. Utiliza el patrón Singleton para garantizar una única instancia en toda la aplicación.

**Logger**: Sistema de logging basado en Winston que proporciona logging estructurado con diferentes niveles (info, warn, error, debug). Registra eventos de autenticación, mensajes, configuración y errores del sistema.

### 2. **Capa de Datos (Models)**

Los modelos Sequelize representan las entidades de la base de datos:
- **User**: Gestión de usuarios con roles y estados
- **WhatsAppSession**: Sesiones de WhatsApp con estados de conexión
- **Message**: Mensajes enviados y recibidos
- **SendMessageJob**: Trabajos de envío masivo de mensajes
- **Subscription**: Planes de suscripción y características
- **UserPreference**: Preferencias personalizadas de usuarios

Cada modelo incluye validaciones, asociaciones y métodos de serialización segura (excluyendo datos sensibles como contraseñas).

### 3. **Capa de Servicios**

Los servicios encapsulan la lógica de negocio y operaciones de base de datos:

**AuthService**: Maneja autenticación, registro, login, generación de tokens JWT y refresh tokens. Implementa hash seguro de contraseñas con bcrypt.

**UserService**: Gestión completa de usuarios incluyendo CRUD, asignación de roles, estadísticas y gestión de estados.

**WhatsAppSessionService**: Administración de sesiones de WhatsApp, estados de conexión, configuración de webhooks y protección de cuentas.

**MessageService**: Envío de mensajes individuales y masivos, gestión de historial y validación de mensajes.

**SendMessageJobService**: Gestión de trabajos de envío masivo con estados (pending, running, paused, completed, failed) y logs detallados.

**SubscriptionService**: Administración de planes de suscripción, características y suscripciones de usuarios.

**UserPreferenceService**: Gestión de preferencias del sistema y personalización de usuarios.

### 4. **Capa de Controladores**

Los controladores manejan las peticiones HTTP y coordinan con los servicios:

**AuthController**: Endpoints de autenticación (/auth/login, /auth/register, /auth/refresh-token).

**UserController**: Gestión de usuarios (/users/*) con operaciones CRUD y estadísticas.

**WhatsAppSessionController**: Administración de sesiones (/whatsapp-sessions/*) con estados y configuración.

**MessageController**: Envío y gestión de mensajes (/messages/*).

**SendMessageJobController**: Control de trabajos de envío (/send-message-jobs/*).

**SubscriptionController**: Gestión de suscripciones (/subscriptions/*).

**UserPreferenceController**: Preferencias de usuario (/user-preferences/*).

### 5. **Middleware de Seguridad y Validación**

**AuthMiddleware**: Verificación de tokens JWT, validación de dominios permitidos y gestión de sesiones.

**ValidationMiddleware**: Validación de datos de entrada usando Joi schemas, incluyendo validación global de números de teléfono.

**RateLimitMiddleware**: Control de velocidad de peticiones para prevenir abuso.

**LoggingMiddleware**: Registro detallado de peticiones HTTP, eventos de autenticación y actividad de WhatsApp.

**CORSMiddleware**: Configuración de CORS con políticas específicas para webhooks (acepta cualquier origen) y API general.

**SecurityMiddleware**: Protección contra ataques comunes usando Helmet, validación de tamaño de payload y detección de patrones sospechosos.

### 6. **Sistema de Rutas**

Las rutas están organizadas por módulos funcionales:
- `/auth/*`: Autenticación y autorización
- `/users/*`: Gestión de usuarios
- `/whatsapp-sessions/*`: Sesiones de WhatsApp
- `/messages/*`: Envío de mensajes
- `/send-message-jobs/*`: Trabajos de envío masivo
- `/subscriptions/*`: Gestión de suscripciones
- `/user-preferences/*`: Preferencias de usuario

Cada ruta incluye documentación Swagger completa con ejemplos de peticiones y respuestas.

### 7. **Base de Datos y Migraciones**

**Sistema de Migraciones**: Utiliza Sequelize CLI para gestión de esquemas de base de datos con migraciones versionadas que permiten evolución controlada del esquema.

**Sistema de Seeds**: Datos iniciales automáticos incluyendo estados de usuario, roles, usuario administrador, preferencias del sistema y estados de sesión de WhatsApp.

**Configuración por Entornos**: Soporte para desarrollo, producción y testing con bases de datos separadas y configuraciones específicas.

### 8. **Documentación y Testing**

**Swagger/OpenAPI**: Documentación automática de la API disponible en `/api-docs` con esquemas de datos, ejemplos y descripción de endpoints.

**Validación de Esquemas**: Schemas Joi centralizados para validación consistente de datos de entrada.

## Detalles Técnicos Específicos

### **Sistema de Autenticación Dual**

El sistema implementa **dos tipos de autenticación** según el origen de la petición:

#### **1. JWT Token (send-api.messengerbrain.com)**
- **Cuándo se usa**: Peticiones desde el dominio oficial `send-api.messengerbrain.com`
- **Validación**: Token JWT estándar con payload que incluye `userId`, `email`, `role`, `status`, `freeTrial`
- **Expiración**: Tokens de acceso (15 minutos) + Refresh tokens (7 días)
- **Almacenamiento**: Refresh tokens se almacenan en base de datos con tipo `refresh_token`

#### **2. Personal Token (otros dominios)**
- **Cuándo se usa**: Peticiones desde cualquier otro dominio o aplicación externa
- **Validación**: Token personal almacenado en base de datos con tipo `personal_token`
- **Expiración**: Configurable por usuario, sin límite por defecto
- **Uso**: Para integraciones externas y APIs de terceros

#### **Flujo de Validación**:
```typescript
// 1. Extraer token del header Authorization
const token = req.headers.authorization?.replace('Bearer ', '');

// 2. Determinar origen de la petición
const origin = req.get('origin') || req.get('referer') || '';
const isFromRequiredDomain = origin.includes('send-api.messengerbrain.com');

// 3. Validar según el tipo
if (isFromRequiredDomain) {
  // Validar JWT
  const decoded = jwt.verify(token, JWT_SECRET);
} else {
  // Validar Personal Token en base de datos
  const tokenRecord = await Token.findOne({ where: { token, type: 'personal_token' } });
}
```

### **ValidationSchemas (Joi)**

Los **ValidationSchemas** son esquemas de validación centralizados usando la librería **Joi** que definen la estructura y reglas de validación para todos los datos de entrada de la API:

#### **Tipos de Schemas**:
- **Auth Schemas**: `registerSchema`, `loginSchema`, `changePasswordSchema`, `refreshTokenSchema`
- **User Schemas**: `createUserSchema`, `updateUserSchema`, `assignRoleSchema`
- **WhatsApp Schemas**: `createSessionSchema`, `updateSessionSchema`, `sendMessageSchema`
- **Message Schemas**: `createMessageSchema`, `bulkMessageSchema`, `messageJobSchema`
- **Subscription Schemas**: `createSubscriptionSchema`, `updateSubscriptionSchema`

#### **Características**:
- **Validación Global de Teléfonos**: Solo verifica que el campo exista, sin validación específica de país
- **Sanitización**: Limpieza automática de datos de entrada
- **Mensajes de Error**: Mensajes descriptivos en español para cada campo
- **Tipos Seguros**: Validación de tipos de datos (string, number, boolean, email)

#### **Ejemplo de Uso**:
```typescript
// En el middleware de validación
const { error, value } = createUserSchema.validate(req.body);
if (error) {
  return res.status(400).json({ 
    success: false, 
    message: 'Validation error', 
    errors: error.details 
  });
}
```

### **Rate Limiting**

El **RateLimitMiddleware** implementa control de velocidad de peticiones con diferentes límites según el tipo de endpoint:

#### **Configuraciones por Endpoint**:
- **Auth Endpoints**: 5 intentos por minuto (previene ataques de fuerza bruta)
- **API General**: 100 peticiones por minuto por IP
- **Webhook Endpoints**: 1000 peticiones por minuto (mayor tolerancia)
- **Upload Endpoints**: 10 peticiones por minuto (archivos grandes)

#### **Almacenamiento**:
- **Memoria Local**: Store en memoria para desarrollo
- **Redis**: Store distribuido para producción (configurable)
- **Window Sliding**: Ventana deslizante de tiempo para conteo preciso

#### **Características**:
- **Skip Successful Requests**: Opción de no contar peticiones exitosas
- **Custom Headers**: Headers informativos sobre límites (`X-RateLimit-Limit`, `X-RateLimit-Remaining`)
- **IP Whitelist**: Lista de IPs exentas de rate limiting
- **User-based Limiting**: Límites adicionales por usuario autenticado

### **Security Middleware**

El **SecurityMiddleware** proporciona múltiples capas de protección usando **Helmet** y validaciones personalizadas:

#### **Protecciones HTTP Headers**:
- **Content Security Policy (CSP)**: Previene XSS y inyección de código
- **Cross-Origin Policies**: Control de acceso entre orígenes
- **DNS Prefetch Control**: Previene prefetching DNS malicioso
- **Frame Options**: Previene clickjacking
- **Strict Transport Security**: Fuerza HTTPS en producción

#### **Validaciones de Payload**:
- **Tamaño Máximo**: 10MB para requests, 50MB para uploads
- **Content-Type Validation**: Verificación de tipos MIME
- **File Upload Security**: Validación de tipos de archivo permitidos
- **Request Size Monitoring**: Logging de requests grandes

#### **Detección de Patrones Sospechosos**:
- **SQL Injection Patterns**: Detección de patrones SQL maliciosos
- **XSS Patterns**: Detección de scripts maliciosos
- **Path Traversal**: Prevención de acceso a archivos del sistema
- **Suspicious User Agents**: Bloqueo de bots maliciosos conocidos

### **Archivos de Configuración**

#### **ConfigService.ts**
Centraliza toda la configuración de la aplicación con interfaces TypeScript:

```typescript
interface AppConfiguration {
  server: ServerConfiguration;      // Puerto, entorno, host
  database: DatabaseConfiguration; // MySQL connection pool
  jwt: JWTConfiguration;          // Secrets y expiración
  redis: RedisConfiguration;      // Cache y colas
  cors: CORSConfiguration;        // Orígenes permitidos
  rateLimit: RateLimitConfiguration; // Límites por endpoint
  logging: LoggingConfiguration;   // Niveles y archivos
}
```

#### **database.js (Sequelize CLI)**
Configuración específica para migraciones y seeds:
- **Development**: Base de datos local con logging habilitado
- **Production**: Base de datos de producción con pool optimizado
- **Test**: Base de datos de testing aislada

#### **.sequelizerc**
Configuración de rutas para Sequelize CLI:
- **Migrations**: `./migrations`
- **Seeds**: `./seeds`
- **Models**: `./src/models`
- **Config**: `./config/database.js`

### **Sistema de Sesiones de WhatsApp**

#### **Estados de Sesión**:
- **connecting**: Iniciando conexión
- **connected**: Conectado y operativo
- **disconnected**: Desconectado del servicio
- **failed**: Error en la conexión
- **qr_code**: Esperando escaneo de QR
- **need_scan**: Requiere escaneo manual
- **logged_out**: Sesión cerrada por el usuario

#### **Gestión de Contextos**:
- **Browser Context ID**: Identificador único del contexto del navegador
- **Account Protection**: Configuración de protección de cuenta
- **Message Logging**: Opción de registrar mensajes
- **Webhook Configuration**: URL y estado de webhooks

#### **Webhooks**:
- **CORS Universal**: Acepta peticiones de cualquier origen (`*`)
- **Timeout Configurable**: Tiempo máximo de espera para respuesta
- **Retry Logic**: Reintentos automáticos en caso de fallo
- **Event Types**: Mensajes recibidos, cambios de estado, errores

## Flujo de Peticiones

1. **Entrada**: Petición HTTP llega a Express
2. **Middleware**: Procesamiento por middleware de seguridad, logging y CORS
3. **Rutas**: Enrutamiento a controlador específico
4. **Controlador**: Validación de datos y coordinación con servicios
5. **Servicio**: Lógica de negocio y operaciones de base de datos
6. **Modelo**: Interacción con base de datos a través de Sequelize
7. **Respuesta**: Retorno de datos procesados al cliente

## Características de Seguridad

- **Autenticación JWT** con refresh tokens
- **Hash seguro** de contraseñas con bcrypt
- **Validación estricta** de datos de entrada
- **Rate limiting** para prevenir abuso
- **CORS configurado** apropiadamente
- **Logging detallado** para auditoría
- **Protección contra ataques** comunes

## Escalabilidad y Rendimiento

- **Connection pooling** para base de datos
- **Middleware optimizado** para alta demanda
- **Arquitectura modular** para fácil mantenimiento
- **Sistema de jobs** para procesamiento asíncrono
- **Configuración flexible** por entornos

Esta arquitectura proporciona una base sólida, escalable y mantenible para la gestión de sesiones de WhatsApp y envío de mensajes masivos, con énfasis en seguridad, documentación y facilidad de desarrollo.
