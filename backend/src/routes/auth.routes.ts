import { FastifyInstance } from 'fastify';
import authService from '../services/auth.service';
import prisma from '../lib/prisma';
import { authMiddleware, getUser } from '../middleware/auth.middleware';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/send-otp', async (request, reply) => {
    const { phoneNumber } = request.body as { phoneNumber: string };

    if (!phoneNumber) {
      return reply.status(400).send({ error: 'El número de teléfono es requerido' });
    }

    try {
      await authService.sendOTP(phoneNumber);
      return { success: true, message: 'Código OTP enviado' };
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.post('/verify-otp', async (request, reply) => {
    const { phoneNumber, code } = request.body as {
      phoneNumber: string;
      code: string;
    };

    if (!phoneNumber || !code) {
      return reply.status(400).send({ error: 'Teléfono y código son requeridos' });
    }

    try {
      const result = await authService.verifyOTP(phoneNumber, code);
      return result;
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.post('/register', async (request, reply) => {
    const { tempToken, dni, firstName, lastName } = request.body as {
      tempToken: string;
      dni: string;
      firstName: string;
      lastName: string;
    };

    if (!tempToken || !dni || !firstName || !lastName) {
      return reply.status(400).send({ error: 'Todos los campos son requeridos' });
    }

    try {
      const result = await authService.registerWithDni(tempToken, dni, firstName, lastName);
      return result;
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.post('/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };

    if (!refreshToken) {
      return reply.status(400).send({ error: 'Refresh token es requerido' });
    }

    try {
      const result = await authService.refreshToken(refreshToken);
      return result;
    } catch (error: any) {
      return reply.status(401).send({ error: error.message });
    }
  });

  fastify.post('/logout', { preHandler: authMiddleware }, async (request) => {
    const authHeader = request.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      await authService.logout(token);
    }

    return { success: true, message: 'Sesión cerrada' };
  });

  fastify.post('/link-telegram', { preHandler: authMiddleware }, async (request, reply) => {
    const { code } = request.body as { code: string };

    if (!code) {
      return reply.status(400).send({ error: 'El código de vinculación es requerido' });
    }

    try {
      await authService.linkTelegram(getUser(request).id, code);
      return { success: true, message: 'Telegram vinculado correctamente' };
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.post('/generate-link-code', { preHandler: authMiddleware }, async (request, reply) => {
    const { telegramId } = request.body as { telegramId: string };

    if (!telegramId) {
      return reply.status(400).send({ error: 'Telegram ID es requerido' });
    }

    try {
      const code = await authService.generateLinkCode(telegramId);
      return { success: true, code };
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.post('/telegram-user', async (request, reply) => {
    const { telegramId } = request.body as { telegramId: string };

    if (!telegramId) {
      return reply.status(400).send({ error: 'telegramId es requerido' });
    }

    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: {
        id: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        role: true,
        telegramUsername: true,
      },
    });

    return { user };
  });

  fastify.post('/bot-login', async (request, reply) => {
    const { userId, botSecret } = request.body as { userId: string; botSecret: string };

    if (botSecret !== process.env.BOT_SECRET) {
      return reply.status(403).send({ error: 'Bot secret inválido' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive || user.isBanned) {
      return reply.status(401).send({ error: 'Usuario inválido' });
    }

    const token = fastify.jwt.sign({ userId: user.id }, { expiresIn: '5m' });
    return { token };
  });
}
