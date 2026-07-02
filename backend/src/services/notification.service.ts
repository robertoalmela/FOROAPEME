import prisma from '../lib/prisma';
import redis from '../lib/redis';

export class NotificationService {
  async createNotification(data: {
    userId: string;
    type: 'NEW_POLL' | 'POLL_REMINDER' | 'POLL_CLOSED' | 'THREAD_REPLY' | 'MENTION' | 'SYSTEM';
    title: string;
    message: string;
    data?: Record<string, any>;
  }) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data as any,
        sentViaApp: true,
      },
    });

    await this.invalidateCache(data.userId);

    return notification;
  }

  async notifyNewPoll(pollId: string) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) return;

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        isBanned: false,
        preferences: {
          notifyNewPoll: true,
        },
      },
      select: { id: true },
    });

    for (const user of users) {
      await this.createNotification({
        userId: user.id,
        type: 'NEW_POLL',
        title: 'Nueva votación disponible',
        message: `Se ha publicado una nueva votación: ${poll.title}`,
        data: { pollId },
      });
    }
  }

  async notifyPollClosed(pollId: string) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) return;

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        isBanned: false,
        preferences: {
          notifyNewPoll: true,
        },
      },
      select: { id: true },
    });

    for (const user of users) {
      await this.createNotification({
        userId: user.id,
        type: 'POLL_CLOSED',
        title: 'Votación cerrada',
        message: `La votación "${poll.title}" ha sido cerrada.`,
        data: { pollId },
      });
    }
  }

  async notifyThreadReply(
    threadId: string,
    replierId: string,
    exceptUserId?: string
  ) {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: { author: true },
    });

    if (!thread) return;

    const replier = await prisma.user.findUnique({
      where: { id: replierId },
      select: { firstName: true, lastName: true },
    });

    const replierName = [replier?.firstName, replier?.lastName].filter(Boolean).join(' ') || 'Alguien';

    if (thread.authorId !== exceptUserId) {
      await this.createNotification({
        userId: thread.authorId,
        type: 'THREAD_REPLY',
        title: 'Nueva respuesta en tu hilo',
        message: `${replierName} respondió a tu hilo "${thread.title}"`,
        data: { threadId },
      });
    }
  }

  async notifyMention(userId: string, mentionedBy: string, threadId: string) {
    const mentionedByUser = await prisma.user.findUnique({
      where: { id: mentionedBy },
      select: { firstName: true, lastName: true },
    });

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { title: true },
    });

    const name = [mentionedByUser?.firstName, mentionedByUser?.lastName].filter(Boolean).join(' ') || 'Alguien';

    await this.createNotification({
      userId,
      type: 'MENTION',
      title: 'Has sido mencionado',
      message: `${name} te mencionó en "${thread?.title}"`,
      data: { threadId },
    });
  }

  async notifySystem(userId: string, title: string, message: string, data?: Record<string, any>) {
    await this.createNotification({
      userId,
      type: 'SYSTEM',
      title,
      message,
      data,
    });
  }

  async getNotifications(userId: string, options?: { limit?: number; offset?: number; unreadOnly?: boolean }) {
    const where: any = { userId };
    if (options?.unreadOnly) {
      where.isRead = false;
    }

    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notificación no encontrada');
    }

    if (notification.userId !== userId) {
      throw new Error('No tienes permiso para esta notificación');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    await this.invalidateCache(userId);

    return { success: true };
  }

  async getUnreadCount(userId: string) {
    const cacheKey = `unread_count:${userId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return { count: parseInt(cached, 10) };
    }

    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    await redis.set(cacheKey, count.toString(), 'EX', 60);

    return { count };
  }

  async deleteNotification(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notificación no encontrada');
    }

    if (notification.userId !== userId) {
      throw new Error('No tienes permiso para esta notificación');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    await this.invalidateCache(userId);

    return { success: true };
  }

  private async invalidateCache(userId: string) {
    await redis.del(`unread_count:${userId}`);
  }
}

export default new NotificationService();
