import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';

// Routes
import authRoutes from './routes/auth.routes';
import pollRoutes from './routes/poll.routes';
import forumRoutes from './routes/forum.routes';
import userRoutes from './routes/user.routes';
import notificationRoutes from './routes/notification.routes';

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

async function start() {
  try {
    // Plugins
    await fastify.register(cors, {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    });

    await fastify.register(jwt, {
      secret: process.env.JWT_SECRET || 'your-secret-key',
    });

    await fastify.register(multipart, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    });

    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '15 minutes',
    });

    // Health check
    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Routes
    await fastify.register(authRoutes, { prefix: '/api/auth' });
    await fastify.register(pollRoutes, { prefix: '/api/polls' });
    await fastify.register(forumRoutes, { prefix: '/api/forum' });
    await fastify.register(userRoutes, { prefix: '/api/users' });
    await fastify.register(notificationRoutes, { prefix: '/api/notifications' });

    // Start server
    const port = parseInt(process.env.PORT || '3000', 10);
    await fastify.listen({ port, host: '0.0.0.0' });

    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
