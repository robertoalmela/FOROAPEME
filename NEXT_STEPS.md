# 🚀 PRÓXIMOS PASOS - Guía de Implementación

## 📊 Estado Actual del Proyecto

### ✅ Completado
- [x] Arquitectura completa diseñada
- [x] Esquema de base de datos (Prisma)
- [x] Estructura de backend configurada
- [x] Servicios de autenticación y votación
- [x] Configuración de TypeScript
- [x] Variables de entorno definidas
- [x] Documentación completa

### 🔄 Pendiente de Implementar
- [ ] Rutas de API (routes/)
- [ ] Middleware de autenticación
- [ ] Servicios de foro y notificaciones
- [ ] Frontend completo
- [ ] Bot de Telegram
- [ ] Integración con IA
- [ ] Tests

---

## 🎯 PLAN DE ACCIÓN - 4 SEMANAS

### **SEMANA 1: Backend Core**

#### Día 1-2: Configuración Inicial
```bash
cd backend

# 1. Instalar dependencias
npm install

# 2. Configurar base de datos PostgreSQL
# Crear base de datos: apeme_db
# Actualizar DATABASE_URL en .env

# 3. Generar cliente Prisma
npm run prisma:generate

# 4. Crear y ejecutar migraciones
npm run prisma:migrate

# 5. Verificar que el servidor arranca
npm run dev
```

#### Día 3-4: Rutas de Autenticación
Crear archivos:
- `backend/src/routes/auth.routes.ts`
- `backend/src/middleware/auth.middleware.ts`

**Endpoints a implementar:**
```typescript
POST /api/auth/send-otp          // Enviar código OTP
POST /api/auth/verify-otp        // Verificar código y login
POST /api/auth/refresh           // Refrescar token
POST /api/auth/logout            // Cerrar sesión
POST /api/auth/link-telegram     // Vincular Telegram
```

#### Día 5-7: Rutas de Votación
Crear archivo: `backend/src/routes/poll.routes.ts`

**Endpoints a implementar:**
```typescript
POST   /api/polls                // Crear votación (admin)
GET    /api/polls                // Listar votaciones
GET    /api/polls/active         // Votaciones activas
GET    /api/polls/:id            // Detalle de votación
POST   /api/polls/:id/publish    // Publicar votación (admin)
POST   /api/polls/:id/vote       // Votar
GET    /api/polls/:id/results    // Ver resultados
GET    /api/polls/:id/report     // Reporte participación (admin)
POST   /api/polls/:id/close      // Cerrar votación (admin)
```

---

### **SEMANA 2: Foro y Notificaciones**

#### Día 1-3: Sistema de Foro
Crear archivos:
- `backend/src/services/forum.service.ts`
- `backend/src/routes/forum.routes.ts`

**Endpoints a implementar:**
```typescript
// Categorías
GET    /api/forum/categories

// Hilos
POST   /api/forum/threads
GET    /api/forum/threads
GET    /api/forum/threads/:id
PUT    /api/forum/threads/:id
DELETE /api/forum/threads/:id

// Respuestas
POST   /api/forum/threads/:id/replies
GET    /api/forum/threads/:id/replies
PUT    /api/forum/replies/:id
DELETE /api/forum/replies/:id

// Búsqueda
GET    /api/forum/search?q=...
```

#### Día 4-5: Sistema de Notificaciones
Crear archivos:
- `backend/src/services/notification.service.ts`
- `backend/src/routes/notification.routes.ts`
- `backend/src/lib/queue.ts` (BullMQ)

**Funcionalidades:**
- Cola de trabajos para envío asíncrono
- Notificaciones por Telegram
- Notificaciones por SMS (opcional)
- Preferencias de usuario

#### Día 6-7: Subida de Archivos
Crear archivo: `backend/src/services/file.service.ts`

**Integración con Cloudinary:**
```typescript
POST /api/files/upload    // Subir archivo
GET  /api/files/:id       // Obtener archivo
```

---

### **SEMANA 3: Frontend**

#### Día 1-2: Setup y Autenticación
```bash
cd frontend

# Instalar dependencias adicionales
npm install react-router-dom @tanstack/react-query zustand tailwindcss

# Configurar TailwindCSS
npx tailwindcss init -p
```

**Páginas a crear:**
- `/login` - Login con OTP
- `/dashboard` - Dashboard principal
- `/profile` - Perfil de usuario

#### Día 3-4: Sistema de Votación
**Páginas a crear:**
- `/polls` - Lista de votaciones
- `/polls/:id` - Detalle y votar
- `/polls/:id/results` - Resultados
- `/admin/polls` - Gestión de votaciones (admin)

**Componentes:**
- `PollCard` - Tarjeta de votación
- `PollForm` - Formulario crear/editar
- `VoteButton` - Botón para votar
- `ResultsChart` - Gráfico de resultados

#### Día 5-7: Sistema de Foro
**Páginas a crear:**
- `/forum` - Lista de categorías
- `/forum/:category` - Hilos de categoría
- `/forum/thread/:id` - Detalle de hilo
- `/forum/new` - Crear hilo

**Componentes:**
- `ThreadCard` - Tarjeta de hilo
- `ThreadForm` - Formulario crear hilo
- `ReplyList` - Lista de respuestas
- `ReplyForm` - Formulario responder

---

### **SEMANA 4: Bot de Telegram y Testing**

#### Día 1-3: Bot de Telegram
```bash
cd bot

# Crear estructura
mkdir -p src/commands src/handlers

# Instalar dependencias
npm install telegraf dotenv
npm install -D typescript @types/node ts-node-dev
```

**Archivos a crear:**
- `bot/src/index.ts` - Punto de entrada
- `bot/src/commands/start.ts` - Comando /start
- `bot/src/commands/votar.ts` - Comando /votar
- `bot/src/commands/hilos.ts` - Comando /hilos
- `bot/src/handlers/callbacks.ts` - Callbacks inline

**Comandos a implementar:**
```
/start          - Vincular cuenta
/votar          - Ver votaciones activas
/hilos          - Ver últimos hilos
/crear          - Crear hilo
/perfil         - Ver perfil
/ayuda          - Ayuda
```

#### Día 4-5: Integración y Testing
- Conectar bot con backend
- Probar flujos completos
- Testing manual de todas las funcionalidades
- Corrección de bugs

#### Día 6-7: Deployment y Documentación
- Preparar para deployment
- Configurar CI/CD (opcional)
- Documentar API
- Crear guía de usuario

---

## 📝 CÓDIGO FALTANTE CRÍTICO

### 1. Middleware de Autenticación

```typescript
// backend/src/middleware/auth.middleware.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return reply.status(401).send({ error: 'No autorizado' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive || user.isBanned) {
      return reply.status(401).send({ error: 'Usuario inválido' });
    }

    request.user = user;
  } catch (error) {
    return reply.status(401).send({ error: 'Token inválido' });
  }
}

// Middleware para admin
export async function adminMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (request.user?.role !== 'ADMIN') {
    return reply.status(403).send({ error: 'Acceso denegado' });
  }
}
```

### 2. Rutas de Autenticación

```typescript
// backend/src/routes/auth.routes.ts
import { FastifyInstance } from 'fastify';
import authService from '../services/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';

export default async function authRoutes(fastify: FastifyInstance) {
  // Enviar OTP
  fastify.post('/send-otp', async (request, reply) => {
    const { phoneNumber } = request.body as { phoneNumber: string };
    
    try {
      await authService.sendOTP(phoneNumber);
      return { success: true, message: 'Código enviado' };
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // Verificar OTP
  fastify.post('/verify-otp', async (request, reply) => {
    const { phoneNumber, code } = request.body as {
      phoneNumber: string;
      code: string;
    };
    
    try {
      const result = await authService.verifyOTP(phoneNumber, code);
      return result;
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // Refrescar token
  fastify.post('/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };
    
    try {
      const result = await authService.refreshToken(refreshToken);
      return result;
    } catch (error: any) {
      return reply.status(401).send({ error: error.message });
    }
  });

  // Logout
  fastify.post('/logout', {
    preHandler: authMiddleware,
  }, async (request, reply) => {
    const token = request.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      await authService.logout(token);
    }
    
    return { success: true };
  });

  // Vincular Telegram
  fastify.post('/link-telegram', {
    preHandler: authMiddleware,
  }, async (request, reply) => {
    const { code } = request.body as { code: string };
    
    try {
      await authService.linkTelegram(request.user!.id, code);
      return { success: true, message: 'Telegram vinculado' };
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });
}
```

### 3. Rutas de Votación

```typescript
// backend/src/routes/poll.routes.ts
import { FastifyInstance } from 'fastify';
import votingService from '../services/voting.service';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

export default async function pollRoutes(fastify: FastifyInstance) {
  // Listar votaciones
  fastify.get('/', {
    preHandler: authMiddleware,
  }, async (request) => {
    const { status, limit, offset } = request.query as any;
    return votingService.listPolls({ status, limit, offset });
  });

  // Votaciones activas
  fastify.get('/active', {
    preHandler: authMiddleware,
  }, async () => {
    return votingService.getActivePolls();
  });

  // Crear votación (admin)
  fastify.post('/', {
    preHandler: [authMiddleware, adminMiddleware],
  }, async (request, reply) => {
    try {
      const poll = await votingService.createPoll(request.body as any);
      return poll;
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // Detalle de votación
  fastify.get('/:id', {
    preHandler: authMiddleware,
  }, async (request) => {
    const { id } = request.params as { id: string };
    return votingService.getResults(id, request.user!.id);
  });

  // Votar
  fastify.post('/:id/vote', {
    preHandler: authMiddleware,
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { optionIds } = request.body as { optionIds: string[] };
    
    try {
      const votes = await votingService.castVote(
        request.user!.id,
        id,
        optionIds,
        request.ip,
        request.headers['user-agent']
      );
      return { success: true, votes };
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // Publicar votación (admin)
  fastify.post('/:id/publish', {
    preHandler: [authMiddleware, adminMiddleware],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    try {
      const poll = await votingService.publishPoll(id);
      return poll;
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // Reporte de participación (admin)
  fastify.get('/:id/report', {
    preHandler: [authMiddleware, adminMiddleware],
  }, async (request) => {
    const { id } = request.params as { id: string };
    return votingService.getParticipationReport(id);
  });

  // Cerrar votación (admin)
  fastify.post('/:id/close', {
    preHandler: [authMiddleware, adminMiddleware],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    try {
      const poll = await votingService.closePoll(id);
      return poll;
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });
}
```

---

## 🔧 COMANDOS ÚTILES

### Backend
```bash
# Desarrollo
npm run dev

# Generar cliente Prisma
npm run prisma:generate

# Crear migración
npm run prisma:migrate

# Abrir Prisma Studio (GUI para BD)
npm run prisma:studio

# Build para producción
npm run build

# Iniciar producción
npm start
```

### Frontend
```bash
# Desarrollo
npm run dev

# Build
npm run build

# Preview build
npm run preview
```

### Bot
```bash
# Desarrollo
npm run dev

# Build
npm run build

# Producción
npm start
```

---

## 📚 RECURSOS Y DOCUMENTACIÓN

### Tecnologías Principales
- [Fastify](https://www.fastify.io/) - Framework backend
- [Prisma](https://www.prisma.io/) - ORM
- [React](https://react.dev/) - Frontend
- [Telegraf](https://telegraf.js.org/) - Bot de Telegram
- [OpenAI](https://platform.openai.com/docs) - IA

### Tutoriales Recomendados
1. **Prisma + PostgreSQL**: https://www.prisma.io/docs/getting-started
2. **Fastify Authentication**: https://www.fastify.io/docs/latest/Guides/Getting-Started/
3. **React Query**: https://tanstack.com/query/latest
4. **Telegram Bot**: https://core.telegram.org/bots/tutorial

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### Seguridad
1. **Nunca** commitear el archivo `.env` con credenciales reales
2. Usar variables de entorno en producción
3. Implementar rate limiting en todos los endpoints
4. Validar todos los inputs del usuario
5. Sanitizar contenido HTML en el foro

### Performance
1. Usar índices en base de datos (ya definidos en schema)
2. Implementar cache con Redis para queries frecuentes
3. Paginar resultados de listas largas
4. Optimizar imágenes antes de subir

### Escalabilidad
1. Usar colas (BullMQ) para tareas pesadas
2. Separar servicios si crece mucho
3. Considerar CDN para archivos estáticos
4. Monitorear uso de recursos

---

## 🎯 CHECKLIST ANTES DE LANZAR

### Backend
- [ ] Todas las rutas implementadas
- [ ] Middleware de autenticación funcionando
- [ ] Validación de inputs
- [ ] Manejo de errores
- [ ] Logs configurados
- [ ] Rate limiting activo
- [ ] CORS configurado correctamente

### Frontend
- [ ] Todas las páginas implementadas
- [ ] Responsive design
- [ ] Manejo de errores
- [ ] Loading states
- [ ] Validación de formularios
- [ ] Accesibilidad básica

### Bot
- [ ] Todos los comandos funcionando
- [ ] Callbacks implementados
- [ ] Notificaciones activas
- [ ] Manejo de errores

### General
- [ ] Base de datos con datos de prueba
- [ ] Variables de entorno configuradas
- [ ] README actualizado
- [ ] Documentación API
- [ ] Tests básicos
- [ ] Backup de base de datos configurado

---

## 🚀 DEPLOYMENT RÁPIDO

### Opción 1: Railway (Más Fácil)
```bash
# 1. Crear cuenta en railway.app
# 2. Instalar CLI
npm install -g @railway/cli

# 3. Login
railway login

# 4. Iniciar proyecto
railway init

# 5. Añadir PostgreSQL
railway add

# 6. Deploy
railway up
```

### Opción 2: Docker Compose
```bash
# Crear docker-compose.yml en la raíz
# Luego ejecutar:
docker-compose up -d
```

---

## 💡 TIPS FINALES

1. **Empieza simple**: Implementa el MVP primero, luego añade features
2. **Testea constantemente**: Prueba cada feature antes de continuar
3. **Documenta mientras desarrollas**: Es más fácil que hacerlo al final
4. **Usa Git**: Commits frecuentes con mensajes descriptivos
5. **Pide feedback**: Muestra avances a usuarios reales temprano

---

## 📞 SOPORTE

Si tienes dudas durante la implementación:
1. Revisa la documentación en `ARCHITECTURE.md`
2. Consulta los ejemplos de código en este documento
3. Busca en la documentación oficial de cada tecnología
4. Pregunta en comunidades (Discord, Stack Overflow)

---

**¡Éxito con el desarrollo! 🚀**
