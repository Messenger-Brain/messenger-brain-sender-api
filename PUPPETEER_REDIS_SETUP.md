# Configuración de Puppeteer y Redis para Envío de Mensajes

## 📋 Descripción General

Este documento describe la implementación de Puppeteer y Redis/Bull para el envío de mensajes de WhatsApp a través de contextos de navegador múltiples y procesamiento asíncrono de alta demanda.

## 🏗️ Arquitectura

### Componentes Principales

1. **BrowserContextService**: Gestiona instancias de contextos de Puppeteer
2. **RedisService**: Maneja conexiones y operaciones de Redis
3. **MessageQueueService**: Administra colas de Bull para procesamiento de mensajes
4. **WhatsAppMessageSenderService**: Orquesta el envío de mensajes usando los componentes anteriores

### Flujo de Trabajo

```
1. Usuario solicita enviar mensaje
2. Se valida el browser_context disponible
3. Se crea registro en send_messages_jobs
4. Se encola el job en Redis (Bull)
5. Worker procesa el job de forma asíncrona
6. Se actualiza browser_context a 'busy'
7. Se ejecuta lógica de Puppeteer (por implementar)
8. Se actualiza estado del job y mensaje
9. Se libera el browser_context a 'available'
```

## 🚀 Setup Inicial

### 1. Instalar Redis en el Sistema

**⚠️ IMPORTANTE**: Redis debe estar instalado como servicio en el sistema operativo, no solo las dependencias npm.

#### **macOS (con Homebrew)**
```bash
brew install redis
brew services start redis
```

#### **Ubuntu/Debian**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### **Windows**
- Descargar Redis desde: https://github.com/microsoftarchive/redis/releases
- O usar WSL2 con Ubuntu

#### **Docker (Alternativa)**
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

#### **Verificar instalación**
```bash
redis-cli ping
# Debe responder: PONG
```

### 2. Instalar Dependencias npm

```bash
npm install
# Esto instalará automáticamente: puppeteer, bull, ioredis
```

### 3. Configurar Variables de Entorno

Agregar al archivo `.env`:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Puppeteer Configuration
PUPPETEER_HEADLESS=true
PUPPETEER_WHATSAPP_URL=https://web.whatsapp.com
PUPPETEER_DEFAULT_TIMEOUT=30000
PUPPETEER_NAVIGATION_TIMEOUT=60000
```

### 4. Ejecutar Migración

```bash
npm run db:migrate
```

Esto agregará la columna `browser_system_id` a la tabla `browser_context`.

### 5. Ejecutar Seed

```bash
npm run db:seed
```

Esto actualizará los estados de `browser_context_status`:
- `available`: Contexto disponible para uso
- `busy`: Contexto ocupado procesando
- `disconnected`: Contexto desconectado
- `error`: Contexto con error
- `closed`: Contexto cerrado

## 📊 Modelo de Datos

### Tabla: browser_context

```sql
- id (int, PK)
- browser_context_status_id (int, FK)
- browser_system_id (varchar(100), unique) -- ID del contexto de Puppeteer
- created_at (timestamp)
- updated_at (timestamp)
```

### Estructura en Memoria

```typescript
interface BrowserContextWithInstance {
  id: number;
  browser_context_status_id: number;
  browser_system_id: string;
  created_at: Date;
  updated_at: Date;
  system_instance: PuppeteerContext; // Instancia de Puppeteer
  page?: Page; // Página de WhatsApp Web
}
```

## 🔧 Uso de los Servicios

### BrowserContextService

#### Crear un nuevo contexto de navegador

```typescript
import { BrowserContextService } from './services/BrowserContextService';

const browserService = BrowserContextService.getInstance();

// Crear contexto
const result = await browserService.createBrowserContext();
if (result.success) {
  const context = result.data;
  console.log('Contexto creado:', context.id);
  console.log('System ID:', context.browser_system_id);
}
```

#### Obtener contexto por ID

```typescript
const context = await browserService.getBrowserContextById(1);
if (context) {
  // Usar context.system_instance para acciones de Puppeteer
  // Usar context.page para interactuar con WhatsApp Web
}
```

#### Cambiar estado del contexto

```typescript
await browserService.updateBrowserStatus(1, 'busy');
// ... realizar operaciones ...
await browserService.updateBrowserStatus(1, 'available');
```

### WhatsAppMessageSenderService

#### Enviar mensaje individual

```typescript
import { WhatsAppMessageSenderService } from './services/WhatsAppMessageSenderService';

const senderService = WhatsAppMessageSenderService.getInstance();

const result = await senderService.sendMessage(
  1, // browser_context_id
  '+123456789', // to
  'Hola, este es un mensaje de prueba', // message
  { priority: 'high' } // metadata opcional
);

if (result.success) {
  console.log('Job ID:', result.data.id);
}
```

#### Enviar mensajes masivos

```typescript
const messages = [
  { to: '+123456789', message: 'Mensaje 1' },
  { to: '+987654321', message: 'Mensaje 2' },
  // ... más mensajes
];

const result = await senderService.sendBulkMessages(
  1, // browser_context_id
  messages,
  2000 // delay en ms entre mensajes
);
```

### MessageQueueService

#### Obtener estadísticas de las colas

```typescript
import { MessageQueueService } from './services/MessageQueueService';

const queueService = MessageQueueService.getInstance();
const stats = await queueService.getQueueStats();

console.log('Message Queue:', stats.messageQueue);
console.log('Bulk Message Queue:', stats.bulkMessageQueue);
```

#### Limpiar colas completadas

```typescript
// Limpiar jobs completados y fallidos de hace más de 5 segundos
await queueService.cleanQueue(5000);
```

## ⚙️ Configuración de Workers

Los workers se configuran automáticamente al inicializar `WhatsAppMessageSenderService`:

- **Message Queue**: Procesa hasta 10 jobs simultáneos
- **Bulk Message Queue**: Procesa hasta 5 jobs simultáneos
- **Reintentos**: 3 intentos automáticos con backoff exponencial
- **Persistencia**: Los jobs se mantienen en Redis para monitoreo

## 🔄 Estados del Sistema

### Estados de browser_context_status

| Slug | Descripción | Cuándo se usa |
|------|-------------|---------------|
| `available` | Disponible | Contexto listo para recibir trabajo |
| `busy` | Ocupado | Contexto procesando un mensaje |
| `disconnected` | Desconectado | Contexto sin conexión activa |
| `error` | Error | Contexto con problema |
| `closed` | Cerrado | Contexto cerrado permanentemente |

### Estados de send_messages_jobs_status

| Slug | Descripción |
|------|-------------|
| `pending` | Job creado, esperando procesamiento |
| `running` | Job en proceso |
| `completed` | Job completado exitosamente |
| `failed` | Job fallido |
| `paused` | Job pausado |
| `cancelled` | Job cancelado |

## 🛠️ Implementación Pendiente

### Lógica de Puppeteer (Para otro desarrollador)

En `WhatsAppMessageSenderService`, los métodos `processMessageJob` y `processBulkMessageJob` tienen placeholders marcados con:

```typescript
// ========================================
// AQUÍ VA LA LÓGICA DE PUPPETEER
// El equipo implementará:
// 1. Usar browserContext.system_instance para acceder al contexto
// 2. Usar browserContext.page para interactuar con WhatsApp Web
// 3. Implementar selectores y acciones de envío
// 4. Retornar el resultado del envío
// ========================================
```

#### Recursos disponibles en el job:

```typescript
// Acceso al contexto de Puppeteer
const browserContext = await this.browserContextService.getBrowserContextById(
  job.data.browser_context_id
);

// browserContext.system_instance: BrowserContext de Puppeteer
// browserContext.page: Page de Puppeteer ya en WhatsApp Web
// job.data.to: Número de teléfono destino
// job.data.message: Mensaje a enviar
```

## 📈 Monitoreo y Debug

### Ver logs del sistema

```bash
tail -f logs/app.log
```

### Verificar estado de Redis

```bash
redis-cli ping
redis-cli info
```

### Ver jobs en Redis

```bash
# Ver todas las colas
redis-cli keys bull:*

# Ver jobs pendientes en message-sending
redis-cli lrange bull:message-sending:wait 0 -1
```

### Estadísticas del servicio

```typescript
const senderService = WhatsAppMessageSenderService.getInstance();
const stats = await senderService.getStats();
console.log(JSON.stringify(stats, null, 2));
```

## 🚨 Troubleshooting

### Problema: Puppeteer no inicia en modo headless

**Solución**: Cambiar en `.env`:
```env
PUPPETEER_HEADLESS=false
```

### Problema: Redis connection refused

**Solución**: Verificar que Redis esté corriendo:
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Verificar
redis-cli ping
```

### Problema: Jobs no se procesan

**Solución**: 
1. Verificar que los workers estén iniciados
2. Revisar logs: `tail -f logs/app.log`
3. Verificar Redis: `redis-cli monitor`

### Problema: Contextos quedan en estado 'busy'

**Solución**: Los contextos se liberan automáticamente incluso en caso de error. Si persiste:
```typescript
const browserService = BrowserContextService.getInstance();
await browserService.updateBrowserStatus(contextId, 'available');
```

## 📝 Notas de Desarrollo

1. **Alta Demanda**: El sistema está diseñado para procesar múltiples mensajes simultáneamente sin bloqueos
2. **Escalabilidad**: Cada browser_context es independiente y puede procesar jobs en paralelo
3. **Resiliencia**: Los jobs fallan de forma controlada y se pueden reintentar
4. **Monitoreo**: Todos los eventos importantes se logean en Winston
5. **Base de Datos**: Todos los jobs se registran en `send_messages_jobs` para trazabilidad

## 🔐 Seguridad

- Los contextos de Puppeteer son aislados entre sí
- Redis debe estar protegido con password en producción
- Los logs no deben contener información sensible de mensajes
- Los browser_context_ids no deben ser expuestos públicamente

## 🎯 Próximos Pasos

1. Implementar lógica de Puppeteer para envío de mensajes
2. Agregar selectores de WhatsApp Web
3. Implementar detección de QR code
4. Agregar manejo de errores específicos de WhatsApp
5. Implementar rate limiting por sesión
6. Agregar métricas de rendimiento

---

**Última actualización**: 22 de Octubre, 2025

