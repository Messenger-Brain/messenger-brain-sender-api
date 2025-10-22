# 🚀 Setup Rápido - Messenger Brain Sender API

Guía paso a paso para configurar el proyecto desde cero.

## ✅ Checklist de Setup

- [ ] Node.js 18+ instalado
- [ ] MySQL 8.0+ instalado y corriendo
- [ ] Redis 6.0+ instalado como servicio y corriendo
- [ ] Verificar Redis: `redis-cli ping` debe responder `PONG`

## 📝 Pasos de Instalación

### 1️⃣ Clonar e Instalar

```bash
git clone <repository-url>
cd messenger-brain-sender-api
npm install
```

### 2️⃣ Configurar Variables de Entorno

```bash
cp env.example .env
```

✏️ **Edita el archivo `.env`** y configura tu password de MySQL:

```env
DB_PASSWORD=tu_password_mysql
```

Las demás variables ya tienen valores por defecto que funcionarán para desarrollo local.

### 3️⃣ Crear Base de Datos

```bash
mysql -u root -p
```

En el prompt de MySQL, ejecuta:

```sql
CREATE DATABASE messenger_brain_sender;
exit;
```

### 4️⃣ Compilar y Setup de Base de Datos

```bash
npm run build
npm run db:setup
```

✅ Esto creará todas las tablas y datos iniciales, incluyendo el usuario admin.

### 5️⃣ Iniciar el Servidor

```bash
npm run dev:clean
```

🎉 **¡Listo!** El servidor está corriendo en `http://localhost:9000`

## 🔑 Credenciales Generadas

Después del setup, encontrarás:

### Usuario Admin
- **Email:** `admin@messengerbrain.com`
- **Password:** `messengerbrain!@.`

### Token Personal API
Revisa el archivo `ADMIN_TOKEN.txt` en la raíz del proyecto para obtener el token de testing.

```bash
cat ADMIN_TOKEN.txt
```

## 🧪 Verificar Instalación

### Test de Conexión

```bash
# Verificar que el servidor esté corriendo
curl http://localhost:9000/api-docs

# Test de login
curl -X POST http://localhost:9000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@messengerbrain.com","password":"messengerbrain!@."}'

# Test con token personal
curl -H "Authorization: Bearer $(cat ADMIN_TOKEN.txt | tail -1)" \
  http://localhost:9000/api/users
```

## 🆘 Problemas Comunes

### ❌ Error: Puerto 9000 ocupado

```bash
npm run dev:clean
```

Este comando limpia el puerto antes de iniciar.

### ❌ Error: No se puede conectar a MySQL

```bash
# Verificar que MySQL esté corriendo
mysql -u root -p -e "SELECT 1"

# Verificar credenciales en .env
cat .env | grep DB_
```

### ❌ Error: Base de datos no existe

```bash
mysql -u root -p -e "CREATE DATABASE messenger_brain_sender;"
```

### ❌ Error: Migraciones fallaron

```bash
# Reset completo
npm run db:reset
```

### ❌ Error: Redis no está instalado o corriendo

**Instalar Redis:**
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verificar
redis-cli ping
# Debe responder: PONG
```

## 📚 Siguientes Pasos

1. **Explorar la API:** `http://localhost:9000/api-docs`
2. **Ver logs:** Los logs se guardan en la carpeta `logs/`
3. **Revisar estructura:** Explora la carpeta `src/` para entender la arquitectura
4. **Leer DATABASE.md:** Para entender el modelo de datos

## 🔄 Comandos Útiles Post-Setup

```bash
# Reiniciar con puerto limpio
npm run dev:clean

# Ver logs en tiempo real
tail -f logs/app.log

# Reset completo de base de datos
npm run db:reset

# Verificar estado de migraciones
npx sequelize-cli db:migrate:status

# Compilar TypeScript
npm run build

# Linting
npm run lint:fix
```

## 📞 ¿Necesitas Ayuda?

- Revisa el `README.md` principal
- Consulta la documentación en `/api-docs`
- Revisa `DATABASE.md` para el esquema de base de datos
- Contacta al equipo de desarrollo

---

**Tiempo estimado de setup:** 5-10 minutos ⏱️

