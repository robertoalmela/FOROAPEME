import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma';
import { authMiddleware, adminMiddleware, getUser } from '../middleware/auth.middleware';

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/me', { preHandler: authMiddleware }, async (request) => {
    const user = await prisma.user.findUnique({
      where: { id: getUser(request).id },
      select: {
        id: true,
        phoneNumber: true,
        phoneVerified: true,
        telegramId: true,
        telegramUsername: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    return user;
  });

  fastify.put('/me', { preHandler: authMiddleware }, async (request, reply) => {
    const body = request.body as any;

    const updateData: any = {};
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.avatar !== undefined) updateData.avatar = body.avatar;
    if (body.telegramUsername !== undefined) updateData.telegramUsername = body.telegramUsername;

    try {
      const user = await prisma.user.update({
        where: { id: getUser(request).id },
        data: updateData,
        select: {
          id: true,
          phoneNumber: true,
          phoneVerified: true,
          telegramId: true,
          telegramUsername: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });
      return user;
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.get('/me/preferences', { preHandler: authMiddleware }, async (request) => {
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: getUser(request).id },
    });

    return preferences;
  });

  fastify.put('/me/preferences', { preHandler: authMiddleware }, async (request, reply) => {
    const body = request.body as any;

    const updateData: any = {};
    if (body.notifyNewPoll !== undefined) updateData.notifyNewPoll = body.notifyNewPoll;
    if (body.notifyPollReminder !== undefined) updateData.notifyPollReminder = body.notifyPollReminder;
    if (body.notifyThreadReply !== undefined) updateData.notifyThreadReply = body.notifyThreadReply;
    if (body.notifyMention !== undefined) updateData.notifyMention = body.notifyMention;
    if (body.preferTelegram !== undefined) updateData.preferTelegram = body.preferTelegram;
    if (body.preferSMS !== undefined) updateData.preferSMS = body.preferSMS;
    if (body.showProfile !== undefined) updateData.showProfile = body.showProfile;
    if (body.showActivity !== undefined) updateData.showActivity = body.showActivity;

    try {
      const preferences = await prisma.userPreferences.upsert({
        where: { userId: getUser(request).id },
        create: {
          userId: getUser(request).id,
          ...updateData,
        },
        update: updateData,
      });
      return preferences;
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.get('/me/stats', { preHandler: authMiddleware }, async (request) => {
    const userId = getUser(request).id;

    const [threadsCount, repliesCount, votesCount] = await Promise.all([
      prisma.thread.count({ where: { authorId: userId } }),
      prisma.reply.count({ where: { authorId: userId } }),
      prisma.vote.count({ where: { userId } }),
    ]);

    return {
      threadsCount,
      repliesCount,
      votesCount,
    };
  });

  fastify.get('/', { preHandler: [authMiddleware, adminMiddleware] }, async (request) => {
    const query = request.query as any;
    const limit = query.limit ? parseInt(query.limit, 10) : 50;
    const offset = query.offset ? parseInt(query.offset, 10) : 0;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        phoneNumber: true,
        phoneVerified: true,
        telegramId: true,
        telegramUsername: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        isBanned: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.user.count();

    return { users, total };
  });

  fastify.put('/:id/role', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { role: 'ADMIN' | 'MODERATOR' | 'MEMBER' };

    if (!body.role || !['ADMIN', 'MODERATOR', 'MEMBER'].includes(body.role)) {
      return reply.status(400).send({ error: 'Rol no válido' });
    }

    try {
      const user = await prisma.user.update({
        where: { id },
        data: { role: body.role },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });
      return user;
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.put('/:id/ban', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const user = await prisma.user.update({
        where: { id },
        data: { isBanned: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          isBanned: true,
        },
      });
      return user;
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.put('/:id/unban', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const user = await prisma.user.update({
        where: { id },
        data: { isBanned: false },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          isBanned: true,
        },
      });
      return user;
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });
}
