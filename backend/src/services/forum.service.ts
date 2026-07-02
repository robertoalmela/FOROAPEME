import prisma from '../lib/prisma';

export class ForumService {
  async getCategories() {
    return prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { threads: true },
        },
      },
    });
  }

  async createCategory(data: {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    color?: string;
    order?: number;
  }) {
    const existing = await prisma.category.findFirst({
      where: { slug: data.slug, parentId: null },
    });

    if (existing) {
      throw new Error('Ya existe una categoría con ese slug');
    }

    return prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        color: data.color,
        order: data.order ?? 0,
      },
    });
  }

  async getThreads(filters?: {
    categoryId?: string;
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: 'newest' | 'oldest' | 'most_viewed' | 'most_replied';
  }) {
    const where: any = {};
    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' as const } },
        { content: { contains: filters.search, mode: 'insensitive' as const } },
      ];
    }

    const orderBy: any[] = [];
    switch (filters?.sortBy) {
      case 'oldest':
        orderBy.push({ createdAt: 'asc' });
        break;
      case 'most_viewed':
        orderBy.push({ views: 'desc' });
        break;
      case 'most_replied':
        orderBy.push({ replies: { _count: 'desc' } });
        break;
      default:
        orderBy.push({ isPinned: 'desc' });
        orderBy.push({ createdAt: 'desc' });
    }

    const threads = await prisma.thread.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            icon: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: { replies: true },
        },
      },
      orderBy,
      take: filters?.limit ?? 20,
      skip: filters?.offset ?? 0,
    });

    return threads;
  }

  async getThread(threadId: string) {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        attachments: true,
        _count: {
          select: { replies: true },
        },
      },
    });

    if (!thread) {
      throw new Error('Hilo no encontrado');
    }

    await prisma.thread.update({
      where: { id: threadId },
      data: { views: { increment: 1 } },
    });

    return thread;
  }

  async createThread(data: {
    title: string;
    content: string;
    categoryId: string;
    authorId: string;
    tags?: string[];
  }) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new Error('Categoría no encontrada');
    }

    const thread = await prisma.thread.create({
      data: {
        title: data.title,
        content: data.content,
        authorId: data.authorId,
        categoryId: data.categoryId,
        tags: data.tags
          ? {
              create: data.tags.map((tagName) => ({
                tag: {
                  connectOrCreate: {
                    where: { slug: tagName.toLowerCase().replace(/\s+/g, '-') },
                    create: {
                      name: tagName,
                      slug: tagName.toLowerCase().replace(/\s+/g, '-'),
                    },
                  },
                },
              })),
            }
          : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return thread;
  }

  async updateThread(
    threadId: string,
    authorId: string,
    data: { title?: string; content?: string; categoryId?: string; tags?: string[] }
  ) {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new Error('Hilo no encontrado');
    }

    if (thread.authorId !== authorId) {
      throw new Error('No tienes permiso para editar este hilo');
    }

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.content) updateData.content = data.content;
    if (data.categoryId) updateData.categoryId = data.categoryId;

    if (data.tags) {
      await prisma.threadTag.deleteMany({
        where: { threadId },
      });

      updateData.tags = {
        create: data.tags.map((tagName: string) => ({
          tag: {
            connectOrCreate: {
              where: { slug: tagName.toLowerCase().replace(/\s+/g, '-') },
              create: {
                name: tagName,
                slug: tagName.toLowerCase().replace(/\s+/g, '-'),
              },
            },
          },
        })),
      };
    }

    return prisma.thread.update({
      where: { id: threadId },
      data: updateData,
    });
  }

  async deleteThread(threadId: string, authorId: string, isAdmin: boolean) {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new Error('Hilo no encontrado');
    }

    if (thread.authorId !== authorId && !isAdmin) {
      throw new Error('No tienes permiso para eliminar este hilo');
    }

    await prisma.thread.delete({
      where: { id: threadId },
    });
  }

  async togglePin(threadId: string, isAdmin: boolean) {
    if (!isAdmin) {
      throw new Error('Solo administradores pueden fijar hilos');
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new Error('Hilo no encontrado');
    }

    return prisma.thread.update({
      where: { id: threadId },
      data: { isPinned: !thread.isPinned },
    });
  }

  async toggleLock(threadId: string, authorId: string, isAdmin: boolean) {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new Error('Hilo no encontrado');
    }

    if (thread.authorId !== authorId && !isAdmin) {
      throw new Error('No tienes permiso para bloquear este hilo');
    }

    return prisma.thread.update({
      where: { id: threadId },
      data: { isLocked: !thread.isLocked },
    });
  }

  async toggleResolve(threadId: string, authorId: string, isAdmin: boolean) {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new Error('Hilo no encontrado');
    }

    if (thread.authorId !== authorId && !isAdmin) {
      throw new Error('No tienes permiso para resolver este hilo');
    }

    return prisma.thread.update({
      where: { id: threadId },
      data: { isResolved: !thread.isResolved },
    });
  }

  async getReplies(threadId: string, options?: { limit?: number; offset?: number }) {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new Error('Hilo no encontrado');
    }

    return prisma.reply.findMany({
      where: { threadId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        attachments: true,
        parent: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });
  }

  async createReply(data: {
    content: string;
    threadId: string;
    authorId: string;
    parentId?: string;
  }) {
    const thread = await prisma.thread.findUnique({
      where: { id: data.threadId },
    });

    if (!thread) {
      throw new Error('Hilo no encontrado');
    }

    if (thread.isLocked) {
      throw new Error('Este hilo está bloqueado');
    }

    if (data.parentId) {
      const parent = await prisma.reply.findUnique({
        where: { id: data.parentId },
      });

      if (!parent || parent.threadId !== data.threadId) {
        throw new Error('Respuesta padre no válida');
      }
    }

    const reply = await prisma.reply.create({
      data: {
        content: data.content,
        threadId: data.threadId,
        authorId: data.authorId,
        parentId: data.parentId,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    return reply;
  }

  async updateReply(replyId: string, authorId: string, content: string) {
    const reply = await prisma.reply.findUnique({
      where: { id: replyId },
    });

    if (!reply) {
      throw new Error('Respuesta no encontrada');
    }

    if (reply.authorId !== authorId) {
      throw new Error('No tienes permiso para editar esta respuesta');
    }

    return prisma.reply.update({
      where: { id: replyId },
      data: { content },
    });
  }

  async deleteReply(replyId: string, authorId: string, isAdmin: boolean) {
    const reply = await prisma.reply.findUnique({
      where: { id: replyId },
    });

    if (!reply) {
      throw new Error('Respuesta no encontrada');
    }

    if (reply.authorId !== authorId && !isAdmin) {
      throw new Error('No tienes permiso para eliminar esta respuesta');
    }

    await prisma.reply.delete({
      where: { id: replyId },
    });
  }

  async searchThreads(query: string, options?: { limit?: number; offset?: number }) {
    const threads = await prisma.thread.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' as const } },
          { content: { contains: query, mode: 'insensitive' as const } },
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        _count: {
          select: { replies: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
    });

    return threads;
  }

  async getTags() {
    return prisma.tag.findMany({
      include: {
        _count: {
          select: { threads: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}

export default new ForumService();
