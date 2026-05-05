# 🏛️ APEME Alicante - Plataforma de Gobernanza Digital

Plataforma completa de participación democrática, gestión de conocimiento y comunicación para APEME Alicante.

## 📋 Características Principales

### ✅ Sistema de Votación
- Votaciones de elección única, múltiple y Sí/No
- Un usuario = un voto (garantizado por BD)
- Resultados en tiempo real
- Auditoría completa de votos
- Anonimato configurable
- Reportes de participación

### 💬 Foro / Base de Conocimiento
- Hilos organizados por categorías
- Sistema de respuestas anidadas
- Subida de archivos (PDF, imágenes)
- Sistema de etiquetas
- Búsqueda avanzada
- Moderación

### 📱 Integración Telegram
- Bot interactivo
- Notificaciones en tiempo real
- Votar desde Telegram
- Crear hilos desde Telegram
- Vinculación segura de cuentas

### 🔐 Autenticación Sin Contraseñas
- Registro con número de teléfono
- Verificación OTP (SMS)
- Magic links
- Sesiones seguras con JWT

### 🤖 Inteligencia Artificial
- Clasificación automática de hilos
- Sugerencia de tags
- Detección de duplicados
- Búsqueda semántica
- Resúmenes semanales

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** + **TypeScript**
- **Fastify** (framework web)
- **Prisma** (ORM)
- **PostgreSQL** (base de datos)
- **Redis** (cache y sesiones)
- **BullMQ** (colas de trabajos)

### Frontend
- **React 19** + **TypeScript**
- **Vite** (build tool)
- **TailwindCSS** (estilos)
- **React Query** (gestión de estado)
- **Zustand** (state management)

### Bot & IA
- **Telegraf** (bot de Telegram)
- **OpenAI API** (GPT-4)
- **Twilio** (SMS)

## 🚀 Inicio Rápido

### Prerrequisitos

```bash
- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- npm o yarn
```

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/FOROAPEME.git
cd FOROAPEME
```

### 2. Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus credenciales
# DATABASE_URL, JWT_SECRET, TELEGRAM_BOT_TOKEN, etc.

# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# (Opcional) Seed de datos iniciales
npm run prisma:seed

# Iniciar servidor de desarrollo
npm run dev
```

El backend estará corriendo en `http://localhost:3000`

### 3. Configurar Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará corriendo en `http://localhost:5173`

### 4. Configurar Bot de Telegram

```bash
cd bot

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tu TELEGRAM_BOT_TOKEN

# Iniciar bot
npm run dev
```

## 📁 Estructura del Proyecto

```
FOROAPEME/
├── backend/                 # API REST con Fastify
│   ├── src/
│   │   ├── routes/         # Rutas de la API
│   │   ├── services/       # Lógica de negocio
│   │   ├── lib/            # Utilidades (prisma, redis)
│   │   ├── middleware/     # Middlewares (auth, etc)
│   │   └── index.ts        # Punto de entrada
│   ├── prisma/
│   │   └── schema.prisma   # Esquema de base de datos
│   └── package.json
│
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas de la app
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # Llamadas a API
│   │   └── App.tsx        # Componente principal
│   └── package.json
│
├── bot/                    # Bot de Telegram
│   ├── src/
│   │   ├── commands/      # Comandos del bot
│   │   ├── handlers/      # Manejadores de eventos
│   │   └── index.ts       # Punto de entrada
│   └── package.json
│
├── ARCHITECTURE.md         # Documentación de arquitectura
└── README.md              # Este archivo
```

## 🔧 Configuración

### Variables de Entorno (Backend)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/apeme_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"

# Telegram
TELEGRAM_BOT_TOKEN="your-bot-token"
WEB_URL="http://localhost:5173"

# SMS (Twilio)
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Redis
REDIS_URL="redis://localhost:6379"
```

### Obtener Token de Bot de Telegram

1. Habla con [@BotFather](https://t.me/botfather) en Telegram
2. Envía `/newbot`
3. Sigue las instrucciones
4. Copia el token que te proporciona
5. Pégalo en `TELEGRAM_BOT_TOKEN`

### Configurar Twilio (SMS)

1. Crea cuenta en [Twilio](https://www.twilio.com/)
2. Obtén tu Account SID y Auth Token
3. Compra un número de teléfono
4. Configura las variables en `.env`

## 📚 Documentación

- [Arquitectura Completa](./ARCHITECTURE.md) - Diseño detallado del sistema
- [API Documentation](./docs/API.md) - Endpoints y ejemplos
- [Database Schema](./docs/DATABASE.md) - Esquema de base de datos
- [Deployment Guide](./docs/DEPLOYMENT.md) - Guía de despliegue

## 🧪 Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📦 Deployment

### Opción 1: Railway (Recomendado para MVP)

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Opción 2: Docker

```bash
# Construir imágenes
docker-compose build

# Iniciar servicios
docker-compose up -d
```

### Opción 3: Manual (VPS)

Ver [Guía de Deployment](./docs/DEPLOYMENT.md)

## 🗺️ Roadmap

### MVP (4 semanas) ✅
- [x] Autenticación con OTP
- [x] Sistema de votación básico
- [x] Foro con categorías
- [x] Bot de Telegram
- [x] Notificaciones

### Fase 2 (4-8 semanas)
- [ ] IA para clasificación
- [ ] Búsqueda semántica
- [ ] Resúmenes automáticos
- [ ] Analytics avanzados
- [ ] App móvil

### Fase 3 (8-12 semanas)
- [ ] Microservicios
- [ ] Escalabilidad horizontal
- [ ] CDN para archivos
- [ ] Monitoreo avanzado

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Equipo

- **Arquitecto de Sistemas** - Diseño de arquitectura
- **Backend Developer** - API y servicios
- **Frontend Developer** - Interfaz de usuario
- **Bot Developer** - Integración Telegram
- **DevOps** - Deployment y CI/CD

## 📞 Soporte

- 📧 Email: soporte@apeme-alicante.es
- 💬 Telegram: [@apeme_soporte](https://t.me/apeme_soporte)
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/FOROAPEME/issues)

## 🙏 Agradecimientos

- APEME Alicante por confiar en este proyecto
- Comunidad open source por las herramientas utilizadas
- Todos los contribuidores

---

**Hecho con ❤️ para APEME Alicante**
