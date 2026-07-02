import prisma from '../lib/prisma';
import notificationService from './notification.service';

export class VotingService {
  /**
   * Crea una nueva votación
   */
  async createPoll(data: {
    title: string;
    description: string;
    pollType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'YES_NO';
    options: string[];
    isAnonymous?: boolean;
    allowMultiple?: boolean;
    maxChoices?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    const poll = await prisma.poll.create({
      data: {
        title: data.title,
        description: data.description,
        pollType: data.pollType,
        isAnonymous: data.isAnonymous || false,
        allowMultiple: data.allowMultiple || false,
        maxChoices: data.maxChoices,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'DRAFT',
        options: {
          create: data.options.map((text, index) => ({
            text,
            order: index,
          })),
        },
      },
      include: {
        options: true,
      },
    });

    return poll;
  }

  /**
   * Publica una votación (la activa)
   */
  async publishPoll(pollId: string) {
    const poll = await prisma.poll.update({
      where: { id: pollId },
      data: {
        status: 'ACTIVE',
        startDate: new Date(),
      },
      include: {
        options: true,
      },
    });

    await notificationService.notifyNewPoll(pollId);

    return poll;
  }

  /**
   * Registra un voto
   */
  async castVote(
    userId: string,
    pollId: string,
    optionIds: string[],
    ipAddress?: string,
    userAgent?: string
  ) {
    // 1. Obtener votación
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });

    if (!poll) {
      throw new Error('Votación no encontrada');
    }

    // 2. Validar estado
    if (poll.status !== 'ACTIVE') {
      throw new Error('La votación no está activa');
    }

    // 3. Validar fechas
    const now = new Date();
    if (poll.startDate && now < poll.startDate) {
      throw new Error('La votación aún no ha comenzado');
    }
    if (poll.endDate && now > poll.endDate) {
      throw new Error('La votación ha finalizado');
    }

    // 4. Verificar si ya votó
    const existingVote = await prisma.vote.findFirst({
      where: { userId, pollId },
    });

    if (existingVote) {
      throw new Error('Ya has votado en esta encuesta');
    }

    // 5. Validar opciones
    if (poll.pollType === 'SINGLE_CHOICE' && optionIds.length > 1) {
      throw new Error('Solo puedes seleccionar una opción');
    }

    if (poll.pollType === 'YES_NO' && optionIds.length > 1) {
      throw new Error('Solo puedes seleccionar una opción');
    }

    if (poll.allowMultiple && poll.maxChoices && optionIds.length > poll.maxChoices) {
      throw new Error(`Máximo ${poll.maxChoices} opciones permitidas`);
    }

    // Verificar que las opciones existen
    const validOptions = poll.options.filter((opt: { id: string }) => optionIds.includes(opt.id));
    if (validOptions.length !== optionIds.length) {
      throw new Error('Una o más opciones no son válidas');
    }

    // 6. Registrar voto(s) en transacción
    const votes = await prisma.$transaction(
      optionIds.map((optionId) =>
        prisma.vote.create({
          data: {
            userId,
            pollId,
            optionId,
            ipAddress,
            userAgent,
          },
        })
      )
    );

    // 7. Auditoría
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'VOTE_CAST',
        entity: 'Poll',
        entityId: pollId,
        details: { optionIds },
        ipAddress,
        userAgent,
      },
    });

    return votes;
  }

  /**
   * Obtiene resultados de una votación
   */
  async getResults(pollId: string, userId?: string) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true },
            },
          },
        },
        _count: {
          select: { votes: true },
        },
      },
    });

    if (!poll) {
      throw new Error('Votación no encontrada');
    }

    // Contar votos únicos por usuario
    const uniqueVoters = await prisma.vote.findMany({
      where: { pollId },
      select: { userId: true },
      distinct: ['userId'],
    });

    const totalVoters = uniqueVoters.length;
    const totalVotes = poll._count.votes;

    const results = poll.options.map((option: { id: string; text: string; _count: { votes: number } }) => ({
      id: option.id,
      text: option.text,
      votes: option._count.votes,
      percentage: totalVoters > 0 ? (option._count.votes / totalVoters) * 100 : 0,
    }));

    // Si el usuario ha votado, incluir su voto
    let userVote = null;
    if (userId) {
      const votes = await prisma.vote.findMany({
        where: { userId, pollId },
        select: { optionId: true },
      });
      userVote = votes.map((v: { optionId: string }) => v.optionId);
    }

    return {
      poll: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        pollType: poll.pollType,
        status: poll.status,
        isAnonymous: poll.isAnonymous,
        startDate: poll.startDate,
        endDate: poll.endDate,
      },
      results,
      totalVoters,
      totalVotes,
      userHasVoted: userVote !== null && userVote.length > 0,
      userVote,
    };
  }

  /**
   * Obtiene reporte de participación
   */
  async getParticipationReport(pollId: string) {
    // Usuarios que votaron
    const voted = await prisma.vote.findMany({
      where: { pollId },
      select: { userId: true },
      distinct: ['userId'],
    });

    const votedUserIds = voted.map((v: { userId: string }) => v.userId);

    // Total de usuarios activos
    const totalUsers = await prisma.user.count({
      where: { isActive: true, isBanned: false },
    });

    // Usuarios que NO votaron
    const notVoted = await prisma.user.findMany({
      where: {
        isActive: true,
        isBanned: false,
        id: {
          notIn: votedUserIds,
        },
      },
      select: {
        id: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        telegramId: true,
      },
    });

    return {
      totalUsers,
      votedCount: voted.length,
      notVotedCount: notVoted.length,
      participationRate: totalUsers > 0 ? (voted.length / totalUsers) * 100 : 0,
      notVotedUsers: notVoted,
    };
  }

  /**
   * Cierra una votación
   */
  async closePoll(pollId: string) {
    const poll = await prisma.poll.update({
      where: { id: pollId },
      data: {
        status: 'CLOSED',
        endDate: new Date(),
      },
    });

    await notificationService.notifyPollClosed(pollId);

    return poll;
  }

  /**
   * Elimina una votación
   */
  async deletePoll(pollId: string) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      throw new Error('Votación no encontrada');
    }

    if (poll.status === 'ACTIVE') {
      throw new Error('No se puede eliminar una votación activa. Ciérrala primero.');
    }

    await prisma.poll.delete({
      where: { id: pollId },
    });
  }

  /**
   * Lista todas las votaciones
   */
  async listPolls(filters?: {
    status?: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'CANCELLED';
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters?.status) {
      where.status = filters.status;
    }

    const polls = await prisma.poll.findMany({
      where,
      include: {
        options: true,
        _count: {
          select: { votes: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });

    return polls;
  }

  /**
   * Obtiene votaciones activas
   */
  async getActivePolls() {
    const now = new Date();

    const polls = await prisma.poll.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      include: {
        options: true,
        _count: {
          select: { votes: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return polls;
  }
}

export default new VotingService();
