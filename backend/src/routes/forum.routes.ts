import { FastifyInstance } from 'fastify';
import forumService from '../services/forum.service';
import { authMiddleware, adminMiddleware, getUser } from '../middleware/auth.middleware';

export default async function forumRoutes(fastify: FastifyInstance) {
  fastify.get('/categories', { preHandler: authMiddleware }, async () => {
    return forumService.getCategories();
  });

  fastify.post('/categories', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const body = request.body as any;

    if (!body.name || !body.slug) {
      return reply.status(400).send({ error: 'name y slug son requeridos' });
    }

    try {
      const category = await forumService.createCategory({
        name: body.name,
        slug: body.slug,
        description: body.description,
        icon: body.icon,
        color: body.color,
        order: body.order,
      });
      return category;
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.get('/threads', { preHandler: authMiddleware }, async (request) => {
    const query = request.query as any;
    return forumService.getThreads({
      categoryId: query.categoryId,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      offset: query.offset ? parseInt(query.offset, 10) : undefined,
      search: query.search,
      sortBy: query.sortBy,
    });
  });

  fastify.get('/threads/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      return forumService.getThread(id);
    } catch (error: any) {
      return reply.status(404).send({ error: error.message });
    }
  });

  fastify.post('/threads', { preHandler: authMiddleware }, async (request, reply) => {
    const body = request.body as any;

    if (!body.title || !body.content || !body.categoryId) {
      return reply.status(400).send({ error: 'title, content y categoryId son requeridos' });
    }

    try {
      const thread = await forumService.createThread({
        title: body.title,
        content: body.content,
        categoryId: body.categoryId,
        authorId: getUser(request).id,
        tags: body.tags,
      });
      return thread;
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.put('/threads/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    try {
      const thread = await forumService.updateThread(id, getUser(request).id, {
        title: body.title,
        content: body.content,
        categoryId: body.categoryId,
        tags: body.tags,
      });
      return thread;
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.delete('/threads/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const isAdmin = getUser(request).role === 'ADMIN';

    try {
      await forumService.deleteThread(id, getUser(request).id, isAdmin);
      return { success: true, message: 'Hilo eliminado' };
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.post('/threads/:id/pin', { preHandler: [authMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      return forumService.togglePin(id, true);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.post('/threads/:id/lock', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const isAdmin = getUser(request).role === 'ADMIN';

    try {
      return forumService.toggleLock(id, getUser(request).id, isAdmin);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.post('/threads/:id/resolve', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const isAdmin = getUser(request).role === 'ADMIN';

    try {
      return forumService.toggleResolve(id, getUser(request).id, isAdmin);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.get('/threads/:id/replies', { preHandler: authMiddleware }, async (request) => {
    const { id } = request.params as { id: string };
    const query = request.query as any;

    return forumService.getReplies(id, {
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      offset: query.offset ? parseInt(query.offset, 10) : undefined,
    });
  });

  fastify.post('/threads/:id/replies', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    if (!body.content) {
      return reply.status(400).send({ error: 'El contenido es requerido' });
    }

    try {
      const reply_ = await forumService.createReply({
        content: body.content,
        threadId: id,
        authorId: getUser(request).id,
        parentId: body.parentId,
      });
      return reply_;
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.put('/replies/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { content: string };

    if (!body.content) {
      return reply.status(400).send({ error: 'El contenido es requerido' });
    }

    try {
      return forumService.updateReply(id, getUser(request).id, body.content);
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.delete('/replies/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const isAdmin = getUser(request).role === 'ADMIN';

    try {
      await forumService.deleteReply(id, getUser(request).id, isAdmin);
      return { success: true, message: 'Respuesta eliminada' };
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.get('/search', { preHandler: authMiddleware }, async (request) => {
    const query = request.query as any;

    if (!query.q) {
      return { threads: [] };
    }

    return forumService.searchThreads(query.q, {
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      offset: query.offset ? parseInt(query.offset, 10) : undefined,
    });
  });

  fastify.get('/tags', { preHandler: authMiddleware }, async () => {
    return forumService.getTags();
  });
}
