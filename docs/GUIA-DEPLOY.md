# 🚀 Guía de Despliegue - APEME Alicante

## Resumen

La plataforma necesita **3 componentes** para funcionar:

| Componente | Función | Ejemplo |
|---|---|---|
| **Servidor Web** | Backend + Frontend | VPS, Railway, Render |
| **Base de datos** | PostgreSQL | Supabase, Neon, Railway |
| **Cache** | Redis (opcional para MVP) | Upstash, Railway |

---

## Opción 1: Railway (Más fácil - Recomendado)

**Coste:** ~$20-30/mes | **Tiempo:** 30 minutos

### Paso 1: Crear cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Regístrate con GitHub
3. Crea un nuevo proyecto

### Paso 2: Añadir PostgreSQL

1. En tu proyecto, pulsa **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Copia la `DATABASE_URL` que te proporciona

### Paso 3: Añadir Redis (opcional)

1. **"+ New"** → **"Redis"**
2. Copia la `REDIS_URL`

### Paso 4: Desplegar Backend

1. Conecta tu repositorio GitHub o sube el código
2. Configura las variables de entorno:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=una-clave-secreta-muy-larga-y-aleatoria
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://tu-dominio.com
TELEGRAM_BOT_TOKEN=tu-token-aqui
WEB_URL=https://tu-dominio.com
```

3. Railway detectará automáticamente que es un proyecto Node.js
4. El build command: `npm run build`
5. El start command: `npm start`

### Paso 5: Desplegar Frontend

1. Añade un nuevo servicio con el código del `frontend/`
2. Railway lo construirá con Vite automáticamente
3. Configura la variable:

```env
VITE_API_URL=https://tu-backend.railway.app/api
```

### Paso 6: Ejecutar migraciones

```bash
# Desde la consola de Railway (Backend)
npx prisma migrate deploy
npx prisma db seed
```

### Paso 7: Dominio personalizado

1. En Railway, ve a **Settings** → **Domains**
2. Añade tu dominio: `apeme-alicante.es`
3. Configura los DNS en tu registrador

---

## Opción 2: VPS propio (Más control)

**Coste:** ~$10-20/mes (Hetzner, DigitalOcean, OVH) | **Tiempo:** 1-2 horas

### Requisitos del servidor

- **CPU:** 2 cores mínimo
- **RAM:** 2GB mínimo
- **Disco:** 20GB SSD
- **SO:** Ubuntu 22.04 LTS

### Paso 1: Preparar el servidor

```bash
# Conectar al servidor
ssh root@tu-servidor.com

# Actualizar sistema
apt update && apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instalar PM2 (gestor de procesos)
npm install -g pm2

# Instalar Nginx
apt install -y nginx

# Instalar PostgreSQL
apt install -y postgresql postgresql-contrib

# Instalar Redis
apt install -y redis-server
```

### Paso 2: Configurar PostgreSQL

```bash
# Crear usuario y base de datos
sudo -u postgres psql
CREATE USER apeme WITH PASSWORD 'tu-password-seguro';
CREATE DATABASE apeme_db OWNER apeme;
\q

# Configurar acceso local
# Editar /etc/postgresql/15/main/pg_hba.conf
# Asegurar que localhost use md5 o scram-sha-256
```

### Paso 3: Desplegar la aplicación

```bash
# Crear directorio
mkdir -p /opt/apeme
cd /opt/apeme

# Clonar repositorio
git clone https://github.com/tu-repo/FOROAPEME.git .

# Backend
cd backend
npm install --production
cp .env.example .env
# Editar .env con tus credenciales

# Generar Prisma y migrar
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

# Build
npm run build

# Iniciar con PM2
pm2 start dist/index.js --name apeme-backend
pm2 save
pm2 startup
```

### Paso 4: Frontend

```bash
cd /opt/apeme/frontend
npm install

# Build
npm run build

# Los archivos estáticos estarán en dist/
```

### Paso 5: Configurar Nginx

```nginx
# /etc/nginx/sites-available/apeme
server {
    listen 80;
    server_name apeme-alicante.es www.apeme-alicante.es;

    # Frontend (estáticos)
    location / {
        root /opt/apeme/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend (API)
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activar configuración
ln -s /etc/nginx/sites-available/apeme /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Paso 6: SSL con Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d apeme-alicante.es -d www.apeme-alicante.es
```

### Paso 7: Firewall

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

---

## Opción 3: Docker Compose (Todo en uno)

**Coste:** Igual que VPS | **Tiempo:** 30 minutos

### docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: apeme_db
      POSTGRES_USER: apeme
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    restart: always

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://apeme:${DB_PASSWORD}@postgres:5432/apeme_db
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    depends_on:
      - postgres
      - redis
    restart: always

  frontend:
    build: ./frontend
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    restart: always

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on:
      - backend
      - frontend
    restart: always

volumes:
  postgres_data:
  caddy_data:
```

### Caddyfile (SSL automático)

```
apeme-alicante.es {
    reverse_proxy /api/* backend:3000
    reverse_proxy /* frontend:80
}
```

### Iniciar

```bash
docker compose up -d
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

---

## Variables de Entorno (Producción)

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/apeme_db"

# JWT (generar con: openssl rand -hex 32)
JWT_SECRET="clave-aleatoria-de-64-caracteres"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# Server
PORT=3000
NODE_ENV="production"
CORS_ORIGIN="https://apeme-alicante.es"

# Telegram
TELEGRAM_BOT_TOKEN="tu-token-del-bot"
WEB_URL="https://apeme-alicante.es"

# SMS (Twilio)
TWILIO_ACCOUNT_SID="tu-account-sid"
TWILIO_AUTH_TOKEN="tu-auth-token"
TWILIO_PHONE_NUMBER="+34XXXXXXXXX"

# OpenAI (opcional, para IA)
OPENAI_API_KEY="tu-openai-api-key"

# Redis
REDIS_URL="redis://host:6379"

# Cloudinary (subida de archivos)
CLOUDINARY_CLOUD_NAME="tu-cloud-name"
CLOUDINARY_API_KEY="tu-api-key"
CLOUDINARY_API_SECRET="tu-api-secret"
```

---

## Checklist de Producción

### Antes de lanzar

- [ ] PostgreSQL configurado con contraseña segura
- [ ] JWT_SECRET generado aleatoriamente (no el de desarrollo)
- [ ] CORS_ORIGIN apunta al dominio real
- [ ] SSL/HTTPS configurado
- [ ] Bot de Telegram creado y token configurado
- [ ] Twilio configurado para envío de SMS
- [ ] Migraciones ejecutadas (`prisma migrate deploy`)
- [ ] Seed ejecutado con datos iniciales
- [ ] Backups automáticos de la base de datos configurados
- [ ] Firewall activo (solo puertos 80, 443, 22)
- [ ] Monitorización básica (PM2, UptimeRobot)

### Después de lanzar

- [ ] Probar registro con teléfono real
- [ ] Probar creación de votación
- [ ] Probar voto desde web y Telegram
- [ ] Probar creación de hilo en foro
- [ ] Verificar que las notificaciones llegan
- [ ] Comprobar que el SSL funciona
- [ ] Configurar backups automáticos

---

## Mantenimiento

### Backups

```bash
# Backup manual de PostgreSQL
pg_dump -U apeme apeme_db > backup-$(date +%Y%m%d).sql

# Backup automático (cron)
0 3 * * * pg_dump -U apeme apeme_db | gzip > /backups/apeme-$(date +\%Y\%m\%d).sql.gz
```

### Actualizaciones

```bash
# Actualizar aplicación
cd /opt/apeme
git pull
cd backend
npm install
npx prisma migrate deploy
npm run build
pm2 restart apeme-backend

cd ../frontend
npm install
npm run build
```

### Logs

```bash
# Backend logs
pm2 logs apeme-backend

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-15-main.log
```

---

## Soporte

- 📧 Email: soporte@apeme-alicante.es
- 💬 Telegram: @apeme_soporte
- 🐛 Issues: GitHub Issues del repositorio
