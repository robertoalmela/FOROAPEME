# 🏛️ ARQUITECTURA COMPLETA - PLATAFORMA APEME ALICANTE

## 📋 ÍNDICE
1. [Visión General](#visión-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Base de Datos](#base-de-datos)
5. [Flujos de Usuario](#flujos-de-usuario)
6. [Sistema de Votación](#sistema-de-votación)
7. [Integración Telegram](#integración-telegram)
8. [Implementación IA](#implementación-ia)
9. [Seguridad](#seguridad)
10. [MVP y Roadmap](#mvp-y-roadmap)

---

## 🎯 VISIÓN GENERAL

### Objetivo
Plataforma de gobernanza digital para 800 usuarios de APEME Alicante que permita:
- ✅ Participación democrática (votaciones)
- ✅ Gestión de conocimiento (foro/hilos)
- ✅ Comunicación eficiente (Telegram)
- ✅ Autenticación sin contraseñas (OTP)

### Principios de Diseño
1. **Simplicidad**: Interfaz intuitiva para usuarios no técnicos
2. **Robustez**: Sistema confiable para votaciones críticas
3. **Escalabilidad**: Preparado para crecer más allá de 800 usuarios
4. **Seguridad**: Un usuario = una cuenta = un voto
5. **Transparencia**: Auditoría completa de acciones

---

## 🛠️ STACK TECNOLÓGICO

### Backend
```
✅ Node.js + TypeScript (ya configurado)
✅ Fastify (framework rápido y moderno)
✅ Prisma ORM (gestión de BD)
✅ PostgreSQL (base de datos)
✅ Telegraf (bot de Telegram)
✅ JWT (autenticación)
```

**Justificación**:
- **Fastify**: 2x más rápido que Express, ideal para 800 usuarios concurrentes
- **Prisma**: Type-safety, migraciones automáticas, excelente DX
- **PostgreSQL**: ACID compliance crítico para votaciones
- **TypeScript**: Prevención de errores en tiempo de desarrollo

### Frontend
```
✅ React 19 + TypeScript (ya configurado)
✅ Vite (build tool)
✅ Axios (HTTP client)
✅ Framer Motion (animaciones)
✅ Lucide React (iconos)
+ React Router (navegación)
+ Zustand (state management)
+ React Query (cache y sincronización)
+ TailwindCSS (estilos)
```

### Bot & Notificaciones
```
✅ Telegraf (ya instalado)
+ Twilio/Vonage (SMS OTP)
+ Bull/BullMQ (cola de trabajos)
+ Redis (cache y sesiones)
```

### IA & Búsqueda
```
+ OpenAI API (GPT-4 para clasificación y resúmenes)
+ Pinecone/Qdrant (búsqueda vectorial)
+ Langchain (orquestación IA)
```

### DevOps & Hosting
```
+ Docker + Docker Compose
+ GitHub Actions (CI/CD)
+ Railway/Render/Fly.io (hosting económico)
+ Cloudflare (CDN y protección DDoS)
```

---

## 🏗️ ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────┐
│                         USUARIOS                             │
│  (Web Browser)              (Telegram App)                   │
└────────┬─────────────────────────────┬──────────────────────┘
         │                             │
         │                             │
    ┌────▼─────┐                  ┌────▼─────┐
    │ Frontend │                  │ Telegram │
    │  React   │                  │   Bot    │
    └────┬─────┘                  └────┬─────┘
         │                             │
         │         ┌───────────────────┘
         │         │
    ┌────▼─────────▼─────┐
    │   API Gateway      │
    │   (Fastify)        │
    └────┬───────────────┘
         │
    ┌────▼───────────────────────────────────────┐
    │           SERVICIOS BACKEND                │
    ├────────────────────────────────────────────┤
    │ • AuthService (OTP, Magic Links)           │
    │ • VotingService (lógica votaciones)        │
    │ • ForumService (hilos, respuestas)         │
    │ • NotificationService (push, email, SMS)   │
    │ • AIService (clasificación, búsqueda)      │
    │ • TelegramService (bot handlers)           │
    │ • FileService (subida archivos)            │
    │ • AuditService (logs, trazabilidad)        │
    └────┬───────────────────────────────────────┘
         │
    ┌────▼─────────────────┐
    │   PostgreSQL         │
    │   (Base de Datos)    │
    └──────────────────────┘
         │
    ┌────▼─────────────────┐
    │   Redis              │
    │   (Cache + Sesiones) │
    └──────────────────────┘
         │
    ┌────▼─────────────────┐
    │   Bull Queue         │
    │   (Jobs Async)       │
    └──────────────────────┘
         │
    ┌────▼─────────────────┐
    │   Servicios Externos │
    ├──────────────────────┤
    │ • OpenAI API         │
    │ • Twilio (SMS)       │
    │ • Telegram API       │
    │ • S3/Cloudinary      │
    └──────────────────────┘
```

### Flujo de Datos
1. **Usuario** → Interactúa vía Web o Telegram
2. **Frontend/Bot** → Envía petición a API Gateway
3. **API Gateway** → Valida JWT, enruta a servicio
4. **Servicio** → Ejecuta lógica de negocio
5. **Base de Datos** → Persiste datos
6. **Queue** → Procesa tareas asíncronas (notificaciones, IA)
7. **Respuesta** → Vuelve al usuario

---

## 🗄️ BASE DE DATOS

### Esquema Prisma Completo

```prisma
// Usuarios
model User {
  id                String    @id @default(cuid())
  phoneNumber       String    @unique
  phoneVerified     Boolean   @default(false)
  telegramId        String?   @unique
  telegramUsername  String?
  
  // Perfil
  firstName         String?
  lastName          String?
  email             String?   @unique
  avatar            String?
  
  // Roles
  role              UserRole  @default(MEMBER)
  isActive          Boolean   @default(true)
  isBanned          Boolean   @default(false)
  
  // Metadata
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  lastLoginAt       DateTime?
  
  // Relaciones
  votes             Vote[]
  threads           Thread[]
  replies           Reply[]
  notifications     Notification[]
  auditLogs         AuditLog[]
  sessions          Session[]
  
  @@index([phoneNumber])
  @@index([telegramId])
}

enum UserRole {
  ADMIN
  MODERATOR
  MEMBER
}

// Sesiones y Autenticación
model Session {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  token         String   @unique
  refreshToken  String?  @unique
  expiresAt     DateTime
  
  ipAddress     String?
  userAgent     String?
  
  createdAt     DateTime @default(now())
  
  @@index([userId])
  @@index([token])
}

model OTPCode {
  id            String   @id @default(cuid())
  phoneNumber   String
  code          String
  expiresAt     DateTime
  verified      Boolean  @default(false)
  attempts      Int      @default(0)
  
  createdAt     DateTime @default(now())
  
  @@index([phoneNumber, code])
}

// Sistema de Votaciones
model Poll {
  id            String      @id @default(cuid())
  title         String
  description   String      @db.Text
  
  // Configuración
  pollType      PollType
  isAnonymous   Boolean     @default(false)
  allowMultiple Boolean     @default(false)
  maxChoices    Int?
  
  // Estado
  status        PollStatus  @default(DRAFT)
  
  // Fechas
  startDate     DateTime?
  endDate       DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  // Relaciones
  options       PollOption[]
  votes         Vote[]
  
  @@index([status])
  @@index([startDate, endDate])
}

enum PollType {
  SINGLE_CHOICE
  MULTIPLE_CHOICE
  YES_NO
}

enum PollStatus {
  DRAFT
  ACTIVE
  CLOSED
  CANCELLED
}

model PollOption {
  id          String   @id @default(cuid())
  pollId      String
  poll        Poll     @relation(fields: [pollId], references: [id], onDelete: Cascade)
  
  text        String
  order       Int
  
  votes       Vote[]
  
  @@index([pollId])
}

model Vote {
  id          String      @id @default(cuid())
  
  userId      String
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  pollId      String
  poll        Poll        @relation(fields: [pollId], references: [id], onDelete: Cascade)
  
  optionId    String
  option      PollOption  @relation(fields: [optionId], references: [id], onDelete: Cascade)
  
  // Auditoría
  ipAddress   String?
  userAgent   String?
  votedAt     DateTime    @default(now())
  
  // Prevención de duplicados
  @@unique([userId, pollId, optionId])
  @@index([pollId])
  @@index([userId])
}

// Sistema de Foro
model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  icon        String?
  color       String?
  order       Int      @default(0)
  
  threads     Thread[]
  
  @@index([slug])
}

model Thread {
  id            String      @id @default(cuid())
  
  title         String
  content       String      @db.Text
  
  // Autor
  authorId      String
  author        User        @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  // Categoría
  categoryId    String
  category      Category    @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  // Estado
  isPinned      Boolean     @default(false)
  isLocked      Boolean     @default(false)
  isResolved    Boolean     @default(false)
  
  // Metadata
  views         Int         @default(0)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  // Relaciones
  replies       Reply[]
  tags          ThreadTag[]
  attachments   Attachment[]
  
  @@index([categoryId])
  @@index([authorId])
  @@index([createdAt])
}

model Reply {
  id            String       @id @default(cuid())
  
  content       String       @db.Text
  
  // Autor
  authorId      String
  author        User         @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  // Thread
  threadId      String
  thread        Thread       @relation(fields: [threadId], references: [id], onDelete: Cascade)
  
  // Respuesta a otra respuesta (opcional)
  parentId      String?
  parent        Reply?       @relation("ReplyToReply", fields: [parentId], references: [id])
  children      Reply[]      @relation("ReplyToReply")
  
  // Metadata
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  
  attachments   Attachment[]
  
  @@index([threadId])
  @@index([authorId])
  @@index([parentId])
}

model Tag {
  id          String      @id @default(cuid())
  name        String      @unique
  slug        String      @unique
  
  threads     ThreadTag[]
  
  @@index([slug])
}

model ThreadTag {
  threadId    String
  thread      Thread   @relation(fields: [threadId], references: [id], onDelete: Cascade)
  
  tagId       String
  tag         Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([threadId, tagId])
}

model Attachment {
  id          String   @id @default(cuid())
  
  filename    String
  originalName String
  mimeType    String
  size        Int
  url         String
  
  // Puede estar en Thread o Reply
  threadId    String?
  thread      Thread?  @relation(fields: [threadId], references: [id], onDelete: Cascade)
  
  replyId     String?
  reply       Reply?   @relation(fields: [replyId], references: [id], onDelete: Cascade)
  
  uploadedAt  DateTime @default(now())
  
  @@index([threadId])
  @@index([replyId])
}

// Sistema de Notificaciones
model Notification {
  id          String            @id @default(cuid())
  
  userId      String
  user        User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type        NotificationType
  title       String
  message     String            @db.Text
  
  // Metadata
  data        Json?
  isRead      Boolean           @default(false)
  
  // Canales
  sentViaApp      Boolean       @default(false)
  sentViaTelegram Boolean       @default(false)
  sentViaSMS      Boolean       @default(false)
  
  createdAt   DateTime          @default(now())
  readAt      DateTime?
  
  @@index([userId, isRead])
  @@index([createdAt])
}

enum NotificationType {
  NEW_POLL
  POLL_REMINDER
  POLL_CLOSED
  THREAD_REPLY
  MENTION
  SYSTEM
}

// Sistema de Auditoría
model AuditLog {
  id          String   @id @default(cuid())
  
  userId      String?
  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  action      String
  entity      String
  entityId    String?
  
  // Detalles
  details     Json?
  ipAddress   String?
  userAgent   String?
  
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([entity, entityId])
  @@index([createdAt])
}

// Preferencias de Usuario
model UserPreferences {
  id                    String  @id @default(cuid())
  userId                String  @unique
  
  // Notificaciones
  notifyNewPoll         Boolean @default(true)
  notifyPollReminder    Boolean @default(true)
  notifyThreadReply     Boolean @default(true)
  notifyMention         Boolean @default(true)
  
  // Canales preferidos
  preferTelegram        Boolean @default(true)
  preferSMS             Boolean @default(false)
  
  // Privacidad
  showProfile           Boolean @default(true)
  showActivity          Boolean @default(true)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### Índices y Optimización
- **Índices compuestos** para queries frecuentes
- **Cascade deletes** para integridad referencial
- **Unique constraints** para prevenir duplicados
- **Text fields** para contenido largo

---

## 👤 FLUJOS DE USUARIO

### 1. Registro y Autenticación

```
┌─────────────────────────────────────────────────────────┐
│ FLUJO: Registro con Teléfono                            │
└─────────────────────────────────────────────────────────┘

1. Usuario ingresa número de teléfono
   ↓
2. Sistema valida formato (+34 XXX XXX XXX)
   ↓
3. Sistema genera código OTP (6 dígitos)
   ↓
4. Envía código vía SMS (Twilio) o Telegram
   ↓
5. Usuario ingresa código
   ↓
6. Sistema valida código (3 intentos máx, 5 min expiración)
   ↓
7. Si válido:
   - Crea/actualiza usuario
   - Genera JWT token
   - Crea sesión
   - Redirige a dashboard
   ↓
8. Usuario autenticado ✅
```

### 2. Votación

```
┌─────────────────────────────────────────────────────────┐
│ FLUJO: Participar en Votación                           │
└─────────────────────────────────────────────────────────┘

1. Admin crea votación (título, opciones, fechas)
   ↓
2. Sistema publica votación (status: ACTIVE)
   ↓
3. Sistema envía notificación a todos los usuarios
   ↓
4. Usuario recibe notificación (Telegram/App)
   ↓
5. Usuario abre votación
   ↓
6. Sistema verifica:
   - Usuario autenticado ✅
   - Votación activa ✅
   - Usuario NO ha votado ✅
   ↓
7. Usuario selecciona opción(es)
   ↓
8. Sistema registra voto:
   - Crea registro Vote
   - Incrementa contador
   - Registra en AuditLog
   - Marca usuario como "votado"
   ↓
9. Usuario ve confirmación + resultados (si no es anónimo)
   ↓
10. Sistema previene segundo voto (constraint DB)
```

### 3. Crear Hilo en Foro

```
┌─────────────────────────────────────────────────────────┐
│ FLUJO: Crear Hilo                                       │
└─────────────────────────────────────────────────────────┘

1. Usuario hace clic en "Nuevo Hilo"
   ↓
2. Selecciona categoría (Ofertas, Dudas, etc.)
   ↓
3. Escribe título y contenido
   ↓
4. (Opcional) Sube archivos (PDF, imágenes)
   ↓
5. (Opcional) Añade tags
   ↓
6. Sistema procesa:
   - Valida contenido
   - Sube archivos a S3/Cloudinary
   - Crea Thread en DB
   - IA clasifica y sugiere tags
   ↓
7. Sistema notifica a usuarios interesados
   ↓
8. Hilo publicado ✅
```

---

## 🗳️ SISTEMA DE VOTACIÓN (CRÍTICO)

### Requisitos de Seguridad
1. **Un usuario = Un voto**: Constraint en DB
2. **Prevención duplicados**: Unique index (userId, pollId)
3. **Auditoría completa**: Registro de IP, timestamp, user agent
4. **Inmutabilidad**: Votos no se pueden editar/borrar
5. **Anonimato opcional**: Separar identidad de voto

### Lógica de Votación

```typescript
// backend/src/services/VotingService.ts

class VotingService {
  async castVote(userId: string, pollId: string, optionIds: string[]) {
    // 1. Validaciones
    const poll = await this.getPoll(pollId);
    
    if (poll.status !== 'ACTIVE') {
      throw new Error('Votación no activa');
    }
    
    if (poll.endDate && new Date() > poll.endDate) {
      throw new Error('Votación cerrada');
    }
    
    // 2. Verificar si ya votó
    const existingVote = await prisma.vote.findFirst({
      where: { userId, pollId }
    });
    
    if (existingVote) {
      throw new Error('Ya has votado en esta encuesta');
    }
    
    // 3. Validar opciones
    if (poll.pollType === 'SINGLE_CHOICE' && optionIds.length > 1) {
      throw new Error('Solo puedes seleccionar una opción');
    }
    
    if (poll.maxChoices && optionIds.length > poll.maxChoices) {
      throw new Error(`Máximo ${poll.maxChoices} opciones`);
    }
    
    // 4. Registrar voto(s) en transacción
    const votes = await prisma.$transaction(
      optionIds.map(optionId =>
        prisma.vote.create({
          data: {
            userId,
            pollId,
            optionId,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          }
        })
      )
    );
    
    // 5. Auditoría
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'VOTE_CAST',
        entity: 'Poll',
        entityId: pollId,
        details: { optionIds }
      }
    });
    
    // 6. Notificar (opcional)
    await this.notifyVoteConfirmation(userId, pollId);
    
    return votes;
  }
  
  async getResults(pollId: string, userId?: string) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        },
        _count: {
          select: { votes: true }
        }
      }
    });
    
    const totalVotes = poll._count.votes;
    
    const results = poll.options.map(option => ({
      id: option.id,
      text: option.text,
      votes: option._count.votes,
      percentage: totalVotes > 0 
        ? (option._count.votes / totalVotes) * 100 
        : 0
    }));
    
    // Si el usuario ha votado, incluir su voto
    let userVote = null;
    if (userId) {
      userVote = await prisma.vote.findFirst({
        where: { userId, pollId }
      });
    }
    
    return {
      poll,
      results,
      totalVotes,
      userHasVoted: !!userVote,
      userVote: userVote?.optionId
    };
  }
  
  async getParticipationReport(pollId: string) {
    // Usuarios que votaron
    const voted = await prisma.vote.findMany({
      where: { pollId },
      select: { userId: true },
      distinct: ['userId']
    });
    
    // Total de usuarios activos
    const totalUsers = await prisma.user.count({
      where: { isActive: true, isBanned: false }
    });
    
    // Usuarios que NO votaron
    const notVoted = await prisma.user.findMany({
      where: {
        isActive: true,
        isBanned: false,
        id: {
          notIn: voted.map(v => v.userId)
        }
      },
      select: {
        id: true,
        phoneNumber: true,
        firstName: true,
        lastName: true
      }
    });
    
    return {
      totalUsers,
      votedCount: voted.length,
      notVotedCount: notVoted.length,
      participationRate: (voted.length / totalUsers) * 100,
      notVotedUsers: notVoted
    };
  }
}
```

### Prevención de Fraude
1. **Rate limiting**: Máximo 1 voto cada X segundos
2. **IP tracking**: Detectar múltiples votos desde misma IP
3. **Device fingerprinting**: Identificar dispositivos únicos
4. **Captcha**: Para votaciones críticas
5. **Verificación manual**: Admin puede revisar votos sospechosos

---

## 📱 INTEGRACIÓN TELEGRAM

### Arquitectura del Bot

```
┌─────────────────────────────────────────────────────────┐
│ TELEGRAM BOT - Comandos y Funcionalidades               │
└─────────────────────────────────────────────────────────┘

/start          → Vincular cuenta Telegram con teléfono
/login          → Generar magic link para web
/votar          → Ver votaciones activas
/hilos          → Ver últimos hilos del foro
/crear          → Crear nuevo hilo desde Telegram
/perfil         → Ver mi perfil y estadísticas
/notificaciones → Configurar preferencias
/ayuda          → Mostrar comandos disponibles
```

### Implementación del Bot

```typescript
// bot/src/index.ts

import { Telegraf, Markup } from 'telegraf';
import { PrismaClient } from '@prisma/client';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const prisma = new PrismaClient();

// Comando /start - Vincular cuenta
bot.command('start', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  
  // Verificar si ya está vinculado
  const user = await prisma.user.findUnique({
    where: { telegramId }
  });
  
  if (user) {
    return ctx.reply(
      `¡Hola ${user.firstName}! Tu cuenta ya está vinculada. ✅\n\n` +
      `Usa /ayuda para ver los comandos disponibles.`
    );
  }
  
  // Generar código de vinculación
  const linkCode = generateLinkCode();
  
  await prisma.linkCode.create({
    data: {
      code: linkCode,
      telegramId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 min
    }
  });
  
  ctx.reply(
    `¡Bienvenido a APEME Alicante! 🎉\n\n` +
    `Para vincular tu cuenta:\n` +
    `1. Ve a ${process.env.WEB_URL}/link\n` +
    `2. Ingresa este código: *${linkCode}*\n\n` +
    `El código expira en 10 minutos.`,
    { parse_mode: 'Markdown' }
  );
});

// Comando /votar - Ver votaciones activas
bot.command('votar', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  
  const user = await prisma.user.findUnique({
    where: { telegramId }
  });
  
  if (!user) {
    return ctx.reply('Primero debes vincular tu cuenta con /start');
  }
  
  const activePolls = await prisma.poll.findMany({
    where: {
      status: 'ACTIVE',
      startDate: { lte: new Date() },
      OR: [
        { endDate: null },
        { endDate: { gte: new Date() } }
      ]
    },
    include: {
      votes: {
        where: { userId: user.id }
      }
    }
  });
  
  if (activePolls.length === 0) {
    return ctx.reply('No hay votaciones activas en este momento.');
  }
  
  const buttons = activePolls.map(poll => {
    const hasVoted = poll.votes.length > 0;
    const emoji = hasVoted ? '✅' : '🗳️';
    
    return [
      Markup.button.callback(
        `${emoji} ${poll.title}`,
        `poll_${poll.id}`
      )
    ];
  });
  
  ctx.reply(
    '📊 *Votaciones Activas*\n\n' +
    'Selecciona una votación:',
    Markup.inlineKeyboard(buttons)
  );
});

// Callback: Ver detalles de votación
bot.action(/poll_(.+)/, async (ctx) => {
  const pollId = ctx.match[1];
  const telegramId = ctx.from.id.toString();
  
  const user = await prisma.user.findUnique({
    where: { telegramId }
  });
  
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      options: true,
      votes: {
        where: { userId: user!.id }
      }
    }
  });
  
  if (!poll) {
    return ctx.answerCbQuery('Votación no encontrada');
  }
  
  const hasVoted = poll.votes.length > 0;
  
  if (hasVoted) {
    // Mostrar resultados
    const results = await getVotingResults(pollId);
    
    let message = `📊 *${poll.title}*\n\n`;
    message += `${poll.description}\n\n`;
    message += `*Resultados:*\n`;
    
    results.forEach(r => {
      message += `• ${r.text}: ${r.votes} votos (${r.percentage.toFixed(1)}%)\n`;
    });
    
    message += `\n✅ Ya has votado en esta encuesta.`;
    
    return ctx.editMessageText(message, { parse_mode: 'Markdown' });
  }
  
  // Mostrar opciones para votar
  const buttons = poll.options.map(option => [
    Markup.button.callback(
      option.text,
      `vote_${pollId}_${option.id}`
    )
  ]);
  
  ctx.editMessageText(
    `🗳️ *${poll.title}*\n\n` +
    `${poll.description}\n\n` +
    `Selecciona tu opción:`,
    Markup.inlineKeyboard(buttons)
  );
});

// Callback: Registrar voto
bot.action(/vote_(.+)_(.+)/, async (ctx) => {
  const [pollId, optionId] = [ctx.match[1], ctx.match[2]];
  const telegramId = ctx.from.id.toString();
  
  const user = await prisma.user.findUnique({
    where: { telegramId }
  });
  
  try {
    await votingService.castVote(user!.id, pollId, [optionId]);
    
    ctx.answerCbQuery('✅ Voto registrado correctamente');
    
    // Mostrar resultados
    const results = await getVotingResults(pollId);
    
    let message = `✅ *¡Voto registrado!*\n\n`;
    message += `*Resultados actuales:*\n`;
    
    results.forEach(r => {
      message += `• ${r.text}: ${r.votes} votos (${r.percentage.toFixed(1)}%)\n`;
    });
    
    ctx.editMessageText(message, { parse_mode: 'Markdown' });
    
  } catch (error) {
    ctx.answerCbQuery(`❌ Error: ${error.message}`);
  }
});

// Comando /crear - Crear hilo desde Telegram
bot.command('crear', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  
  const user = await prisma.user.findUnique({
    where: { telegramId }
  });
  
  if (!user) {
    return ctx.reply('Primero debes vincular tu cuenta con /start');
  }
  
  // Mostrar categorías
  const categories = await prisma.category.findMany({
    orderBy: { order: 'asc' }
  });
  
  const buttons = categories.map(cat => [
    Markup.button.callback(
      `${cat.icon} ${cat.name}`,
      `create_thread_${cat.id}`
    )
  ]);
  
  ctx.reply(
    '📝 *Crear Nuevo Hilo*\n\n' +
    'Selecciona una categoría:',
    Markup.inlineKeyboard(buttons)
  );
});

// Notificaciones automáticas
export async function notifyNewPoll(pollId: string) {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId }
  });
  
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      telegramId: { not: null }
    }
  });
  
  for (const user of users) {
    try {
      await bot.telegram.sendMessage(
        user.telegramId!,
        `🗳️ *Nueva Votación Disponible*\n\n` +
        `*${poll.title}*\n\n` +
        `${poll.description}\n\n` +
        `Usa /votar para participar.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              Markup.button.callback('Votar Ahora', `poll_${pollId}`)
            ]]
          }
        }
      );
    } catch (error) {
      console.error(`Error enviando notificación a ${user.id}:`, error);
    }
  }
}

// Recordatorios automáticos
export async function sendVotingReminders(pollId: string) {
  const report = await votingService.getParticipationReport(pollId);
  
  const poll = await prisma.poll.findUnique({
    where: { id: pollId }
  });
  
  for (const user of report.notVotedUsers) {
    if (!user.telegramId) continue;
    
    try {
      await bot.telegram.sendMessage(
        user.telegramId,
        `⏰ *Recordatorio de Votación*\n\n` +
        `Aún no has votado en:\n` +
        `*${poll.title}*\n\n` +
        `La votación cierra pronto. ¡No te quedes sin participar!`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              Markup.button.callback('Votar Ahora', `poll_${pollId}`)
            ]]
          }
        }
      );
    } catch (error) {
      console.error(`Error enviando recordatorio a ${user.id}:`, error);
    }
  }
}

bot.launch();
console.log('🤖 Bot de Telegram iniciado');
```

---

## 🤖 IMPLEMENTACIÓN IA

### 1. Clasificación Automática de Hilos

```typescript
// backend/src/services/AIService.ts

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class AIService {
  async classifyThread(title: string, content: string) {
    const prompt = `
Clasifica el siguiente hilo de foro en una de estas categorías:
- OFERTA_TRABAJO: Ofertas de empleo
- BUSCA_TRABAJADOR: Búsqueda de empleados
- DUDA_TECNICA: Consultas técnicas
- NORMATIVA: Temas legales o normativos
- COMPRA_VENTA: Compra/venta de productos o servicios
- GENERAL: Otros temas

Título: ${title}
Contenido: ${content}

Responde solo con el nombre de la categoría.
    `;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    });
    
    return response.choices[0].message.content?.trim();
  }
  
  async suggestTags(title: string, content: string) {
    const prompt = `
Sugiere 3-5 tags relevantes para el siguiente hilo de foro.
Los tags deben ser palabras clave cortas y específicas.

Título: ${title}
Contenido: ${content}

Responde solo con los tags separados por comas.
    `;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5
    });
    
    const tags = response.choices[0].message.content
      ?.split(',')
      .map(t => t.trim().toLowerCase());
    
    return tags || [];
  }
  
  async detectDuplicates(title: string, content: string) {
    // Buscar hilos similares usando embeddings
    const embedding = await this.getEmbedding(title + ' ' + content);
    
    // Buscar en base de datos vectorial (Pinecone/Qdrant)
    const similar = await vectorDB.query({
      vector: embedding,
      topK: 5,
      threshold: 0.85
    });
    
    return similar;
  }
  
  async generateWeeklySummary(userId: string) {
    // Obtener actividad de la semana
    const threads = await prisma.thread.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        author: true,
        category: true,
        _count: {
          select: { replies: true }
        }
      },
      orderBy: { views: 'desc' },
      take: 10
    });
    
    const polls = await prisma.poll.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    const prompt = `
Genera un resumen semanal atractivo para un usuario de APEME Alicante.

Hilos más populares:
${threads.map(t => `- ${t.title} (${t._count.replies} respuestas, ${t.views} vistas)`).join('\n')}

Votaciones:
${polls.map(p => `- ${p.title}`).join('\n')}

El resumen debe ser:
- Conciso (máximo 200 palabras)
- Amigable y motivador
- Destacar lo más importante
- Incluir emojis relevantes
    `;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });
    
    return response.choices[0].message.content;
  }
  
  async semanticSearch(query: string) {
    // Generar embedding de la búsqueda
    const queryEmbedding = await this.getEmbedding(query);
    
    // Buscar en base de datos vectorial
    const results = await vectorDB.query({
      vector: queryEmbedding,
      topK: 20
    });
    
    // Obtener hilos completos
    const threadIds = results.map(r => r.id);
    
    const threads = await prisma.thread.findMany({
      where: {
        id: { in: threadIds }
      },
      include: {
        author: true,
        category: true,
        tags: { include: { tag: true } }
      }
    });
    
    return threads;
  }
  
  private async getEmbedding(text: string) {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });
    
    return response.data[0].embedding;
  }
}
```

### 2. Búsqueda Semántica

```typescript
// Usar Qdrant para búsqueda vectorial
import { QdrantClient } from '@qdrant/js-client-rest';

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY
});

// Indexar nuevo hilo
async function indexThread(thread: Thread) {
  const embedding = await aiService.getEmbedding(
    thread.title + ' ' + thread.content
  );
  
  await qdrant.upsert('threads', {
    points: [{
      id: thread.id,
      vector: embedding,
      payload: {
        title: thread.title,
        categoryId: thread.categoryId,
        createdAt: thread.createdAt.toISOString()
      }
    }]
  });
}
```

---

## 🔒 SEGURIDAD

### Medidas Implementadas

1. **Autenticación**
   - OTP con expiración (5 minutos)
   - JWT con refresh tokens
   - Rate limiting en endpoints sensibles
   - Sesiones con IP tracking

2. **Prevención de Duplicados**
   - Unique constraint en phoneNumber
   - Unique constraint en (userId, pollId) para votos
   - Validación de teléfono con formato internacional

3. **Protección de Datos**
   - Encriptación de datos sensibles
   - HTTPS obligatorio
   - CORS configurado
   - Sanitización de inputs

4. **Auditoría**
   - Logs de todas las acciones críticas
   - IP y user agent en votos
   - Timestamps inmutables
   - Exportación de auditoría

5. **Rate Limiting**
   ```typescript
   // backend/src/middleware/rateLimit.ts
   import rateLimit from '@fastify/rate-limit';
   
   fastify.register(rateLimit, {
     max: 100,
     timeWindow: '15 minutes',
     cache: 10000,
     allowList: ['127.0.0.1'],
     redis: redisClient,
     skipOnError: false
   });
   
   // Límite específico para votaciones
   fastify.register(rateLimit, {
     max: 1,
     timeWindow: '10 seconds',
     keyGenerator: (req) => req.user.id,
     errorResponseBuilder: () => ({
       error: 'Demasiados intentos de voto'
     })
   });
   ```

---

## 🚀 MVP Y ROADMAP

### MVP (Producto Mínimo Viable) - 4 semanas

**Semana 1: Infraestructura Base**
- ✅ Setup backend (Fastify + Prisma)
- ✅ Setup frontend (React + Vite)
- ✅ Base de datos PostgreSQL
- ✅ Autenticación con OTP (SMS)
- ✅ Panel de admin básico

**Semana 2: Sistema de Votación**
- ✅ CRUD votaciones
- ✅ Lógica de voto único
- ✅ Resultados en tiempo real
- ✅ Auditoría de votos
- ✅ Exportación de resultados

**Semana 3: Foro Básico**
- ✅ Categorías predefinidas
- ✅ Crear hilos
- ✅ Responder hilos
- ✅ Subida de archivos
- ✅ Buscador simple

**Semana 4: Telegram Bot**
- ✅ Vinculación de cuentas
- ✅ Notificaciones de votaciones
- ✅ Votar desde Telegram
- ✅ Ver hilos desde Telegram
- ✅ Testing y deployment

### Fase 2: Mejoras (4-8 semanas)
- 🔄 IA para clasificación automática
- 🔄 Búsqueda semántica
- 🔄 Resúmenes semanales
- 🔄 Sistema de tags inteligente
- 🔄 Detección de duplicados
- 🔄 Moderación automática
- 🔄 Analytics avanzados
- 🔄 App móvil (React Native)

### Fase 3: Escalabilidad (8-12 semanas)
- 🔄 Microservicios
- 🔄 CDN para archivos
- 🔄 Cache distribuido
- 🔄 Load balancing
- 🔄 Backup automático
- 🔄 Monitoreo (Grafana)

---

## 📦 DEPLOYMENT

### Opción 1: Railway (Recomendado para MVP)

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Crear proyecto
railway init

# 4. Añadir PostgreSQL
railway add postgresql

# 5. Añadir Redis
railway add redis

# 6. Deploy backend
cd backend
railway up

# 7. Deploy frontend
cd ../frontend
railway up

# 8. Configurar variables de entorno
railway variables set DATABASE_URL=...
railway variables set TELEGRAM_BOT_TOKEN=...
railway variables set OPENAI_API_KEY=...
```

### Opción 2: Docker Compose (Local/VPS)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: apeme
      POSTGRES_USER: apeme
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://apeme:${DB_PASSWORD}@postgres:5432/apeme
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
  
  bot:
    build: ./bot
    environment:
      DATABASE_URL: postgresql://apeme:${DB_PASSWORD}@postgres:5432/apeme
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
    depends_on:
      - postgres
      - backend
  
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Opción 3: AWS (Producción Escalable)

```
- EC2: Backend + Bot
- RDS: PostgreSQL
- ElastiCache: Redis
- S3: Archivos estáticos
- CloudFront: CDN
- Route53: DNS
- Certificate Manager: SSL
```

---

## 📊 COSTOS ESTIMADOS

### MVP (800 usuarios)
- **Hosting (Railway)**: $20-30/mes
- **PostgreSQL**: Incluido
- **Redis**: Incluido
- **Twilio SMS**: $0.01/SMS × 800 = $8/mes
- **OpenAI API**: $20-50/mes (uso moderado)
- **Total**: **~$50-100/mes**

### Producción (escalado)
- **VPS/Cloud**: $50-100/mes
- **Base de datos**: $30-50/mes
- **SMS**: $10-20/mes
- **IA**: $50-100/mes
- **CDN**: $10-20/mes
- **Total**: **~$150-300/mes**

---

## ✅ CONCLUSIÓN

Esta arquitectura proporciona:
1. ✅ **Seguridad robusta** para votaciones críticas
2. ✅ **Escalabilidad** para crecer más allá de 800 usuarios
3. ✅ **Simplicidad** en la experiencia de usuario
4. ✅ **Flexibilidad** para añadir funcionalidades
5. ✅ **Costos controlados** con opciones económicas

**Próximos pasos**: Implementar el MVP en 4 semanas siguiendo el roadmap definido.
