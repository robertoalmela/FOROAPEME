import prisma from '../lib/prisma';
import redis from '../lib/redis';
import jwt from 'jsonwebtoken';
import { Twilio } from 'twilio';

const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export class AuthService {
  /**
   * Genera y envía código OTP al teléfono
   */
  async sendOTP(phoneNumber: string): Promise<void> {
    // Validar formato de teléfono
    if (!phoneNumber.match(/^\+\d{10,15}$/)) {
      throw new Error('Formato de teléfono inválido. Usa formato internacional: +34XXXXXXXXX');
    }

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

    // Guardar en base de datos
    await prisma.oTPCode.create({
      data: {
        phoneNumber,
        code,
        expiresAt,
      },
    });

    // Enviar SMS
    try {
      await twilioClient.messages.create({
        body: `Tu código de verificación APEME es: ${code}. Válido por 5 minutos.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });
    } catch (error) {
      console.error('Error enviando SMS:', error);
      // En desarrollo, mostrar el código en consola
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 Código OTP para ${phoneNumber}: ${code}`);
      }
    }
  }

  /**
   * Verifica el código OTP y crea/actualiza usuario
   */
  async verifyOTP(phoneNumber: string, code: string): Promise<{ token: string; refreshToken: string; user: any }> {
    // Buscar código válido
    const otpRecord = await prisma.oTPCode.findFirst({
      where: {
        phoneNumber,
        code,
        verified: false,
        expiresAt: {
          gte: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      // Incrementar intentos
      await prisma.oTPCode.updateMany({
        where: {
          phoneNumber,
          code,
        },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      throw new Error('Código inválido o expirado');
    }

    // Verificar intentos
    if (otpRecord.attempts >= 3) {
      throw new Error('Demasiados intentos. Solicita un nuevo código.');
    }

    // Marcar como verificado
    await prisma.oTPCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Crear o actualizar usuario
    let user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber,
          phoneVerified: true,
          lastLoginAt: new Date(),
        },
      });

      // Crear preferencias por defecto
      await prisma.userPreferences.create({
        data: {
          userId: user.id,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          phoneVerified: true,
          lastLoginAt: new Date(),
        },
      });
    }

    // Generar tokens
    const token = this.generateToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Guardar sesión
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      },
    });

    // Auditoría
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
      },
    });

    return { token, refreshToken, user };
  }

  /**
   * Genera código de vinculación para Telegram
   */
  async generateLinkCode(telegramId: string): Promise<string> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    await prisma.linkCode.create({
      data: {
        code,
        telegramId,
        expiresAt,
      },
    });

    return code;
  }

  /**
   * Vincula cuenta de Telegram con usuario
   */
  async linkTelegram(userId: string, code: string): Promise<void> {
    const linkCode = await prisma.linkCode.findFirst({
      where: {
        code,
        used: false,
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    if (!linkCode) {
      throw new Error('Código inválido o expirado');
    }

    // Actualizar usuario
    await prisma.user.update({
      where: { id: userId },
      data: {
        telegramId: linkCode.telegramId,
      },
    });

    // Marcar código como usado
    await prisma.linkCode.update({
      where: { id: linkCode.id },
      data: { used: true },
    });

    // Auditoría
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'TELEGRAM_LINKED',
        entity: 'User',
        entityId: userId,
      },
    });
  }

  /**
   * Genera JWT token
   */
  private generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  /**
   * Genera refresh token
   */
  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );
  }

  /**
   * Refresca el token
   */
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as { userId: string; type: string };

      if (decoded.type !== 'refresh') {
        throw new Error('Token inválido');
      }

      // Verificar que la sesión existe
      const session = await prisma.session.findFirst({
        where: {
          refreshToken,
          expiresAt: {
            gte: new Date(),
          },
        },
      });

      if (!session) {
        throw new Error('Sesión inválida o expirada');
      }

      // Generar nuevos tokens
      const newToken = this.generateToken(decoded.userId);
      const newRefreshToken = this.generateRefreshToken(decoded.userId);

      // Actualizar sesión
      await prisma.session.update({
        where: { id: session.id },
        data: {
          token: newToken,
          refreshToken: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return { token: newToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  }

  /**
   * Cierra sesión
   */
  async logout(token: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { token },
    });
  }
}

export default new AuthService();
