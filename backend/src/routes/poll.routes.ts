import { FastifyInstance } from 'fastify';
import votingService from '../services/voting.service';
import { authMiddleware, adminMiddleware, getUser } from '../middleware/auth.middleware';

export default async function pollRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: authMiddleware }, async (request) => {
    const query = request.query as any;
    const status = query.status as 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'CANCELLED' | undefined;
    const limit = query.limit ? parseInt(query.limit, 10) : undefined;
    const offset = query.offset ? parseInt(query.offset, 10) : undefined;

    return votingService.listPolls({ status, limit, offset });
  });

  fastify.get('/active', { preHandler: authMiddleware }, async () => {
    return votingService.getActivePolls();
  });

  fastify.get('/:id', { preHandler: authMiddleware }, async (request) => {
    const { id } = request.params as { id: string };
    return votingService.getResults(id, getUser(request).id);
  });

  fastify.post('/', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const body = request.body as any;

    if (!body.title || !body.description || !body.pollType || !body.options) {
      return reply.status(400).send({
        error: 'title, description, pollType y options son requeridos',
      });
    }

    try {
      const poll = await votingService.createPoll({
        title: body.title,
        description: body.description,
        pollType: body.pollType,
        options: body.options,
        isAnonymous: body.isAnonymous,
        allowMultiple: body.allowMultiple,
        maxChoices: body.maxChoices,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
      });
      return poll;
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.post('/:id/publish', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const poll = await votingService.publishPoll(id);
      return poll;
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.post('/:id/close', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const poll = await votingService.closePoll(id);
      return poll;
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.post('/:id/vote', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { optionIds } = request.body as { optionIds: string[] };

    if (!optionIds || optionIds.length === 0) {
      return reply.status(400).send({ error: 'Selecciona al menos una opción' });
    }

    try {
      const votes = await votingService.castVote(
        getUser(request).id,
        id,
        optionIds,
        request.ip,
        request.headers['user-agent'] as string
      );
      return { success: true, votes };
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.get('/:id/results', { preHandler: authMiddleware }, async (request) => {
    const { id } = request.params as { id: string };
    return votingService.getResults(id, getUser(request).id);
  });

  fastify.get('/:id/report', { preHandler: [authMiddleware, adminMiddleware] }, async (request) => {
    const { id } = request.params as { id: string };
    return votingService.getParticipationReport(id);
  });

  fastify.delete('/:id', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await votingService.deletePoll(id);
      return { success: true, message: 'Votación eliminada' };
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });
}
