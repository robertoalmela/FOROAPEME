import { FastifyInstance } from 'fastify';
import notificationService from '../services/notification.service';
import { authMiddleware, getUser } from '../middleware/auth.middleware';

export default async function notificationRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: authMiddleware }, async (request) => {
    const query = request.query as any;
    const limit = query.limit ? parseInt(query.limit, 10) : undefined;
    const offset = query.offset ? parseInt(query.offset, 10) : undefined;
    const unreadOnly = query.unreadOnly === 'true';

    return notificationService.getNotifications(getUser(request).id, {
      limit,
      offset,
      unreadOnly,
    });
  });

  fastify.get('/unread-count', { preHandler: authMiddleware }, async (request) => {
    return notificationService.getUnreadCount(getUser(request).id);
  });

  fastify.post('/:id/read', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      return notificationService.markAsRead(id, getUser(request).id);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.post('/read-all', { preHandler: authMiddleware }, async (request) => {
    return notificationService.markAllAsRead(getUser(request).id);
  });

  fastify.delete('/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await notificationService.deleteNotification(id, getUser(request).id);
      return { success: true, message: 'Notificación eliminada' };
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });
}
