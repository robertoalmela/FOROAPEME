import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma';

export interface APEMEUser {
  id: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  isBanned: boolean;
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.status(401).send({ error: 'No autorizado' });
    }

    const token = authHeader.replace('Bearer ', '');

    const decoded = request.server.jwt.verify<{ userId: string }>(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive || user.isBanned) {
      return reply.status(401).send({ error: 'Usuario inválido' });
    }

    (request as any).apeUser = {
      id: user.id,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isActive: user.isActive,
      isBanned: user.isBanned,
    } as APEMEUser;
  } catch (error) {
    return reply.status(401).send({ error: 'Token inválido o expirado' });
  }
}

export async function adminMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = (request as any).apeUser as APEMEUser | undefined;
  if (user?.role !== 'ADMIN') {
    return reply.status(403).send({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
  }
}

export async function moderatorMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = (request as any).apeUser as APEMEUser | undefined;
  if (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR') {
    return reply.status(403).send({ error: 'Acceso denegado. Se requieren permisos de moderador.' });
  }
}

export function getUser(request: FastifyRequest): APEMEUser {
  return (request as any).apeUser as APEMEUser;
}
