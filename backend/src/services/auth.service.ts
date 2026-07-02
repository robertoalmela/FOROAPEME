import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import { Twilio } from 'twilio';

const twilioConfigured = Boolean(
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER
);

const twilioClient = twilioConfigured
  ? new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export class AuthService {
  async sendOTP(phoneNumber: string): Promise<void> {
    if (!phoneNumber.match(/^\+\d{10,15}$/)) {
      throw new Error('Formato de teléfono inválido. Usa formato internacional: +34XXXXXXXXX');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.oTPCode.create({
      data: { phoneNumber, code, expiresAt },
    });

    if (twilioClient) {
      try {
        await twilioClient.messages.create({
          body: `Tu código de verificación APEME es: ${code}. Válido por 5 minutos.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phoneNumber,
        });
      } catch (error) {
        console.error('Error enviando SMS:', error);
        console.log(`📱 Código OTP para ${phoneNumber}: ${code}`);
      }
    } else {
      // Sin Twilio configurado (modo demo): el código solo es visible en el log del servidor
      console.log(`📱 [SMS no configurado] Código OTP para ${phoneNumber}: ${code}`);
    }
  }

  async verifyOTP(phoneNumber: string, code: string): Promise<{ token?: string; refreshToken?: string; user?: any; needsRegistration?: boolean; tempToken?: string }> {
    const otpRecord = await prisma.oTPCode.findFirst({
      where: {
        phoneNumber,
        code,
        verified: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      await prisma.oTPCode.updateMany({
        where: { phoneNumber, code },
        data: { attempts: { increment: 1 } },
      });
      throw new Error('Código inválido o expirado');
    }

    if (otpRecord.attempts >= 3) {
      throw new Error('Demasiados intentos. Solicita un nuevo código.');
    }

    await prisma.oTPCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Buscar usuario existente
    let user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    // Si no existe O existe pero no tiene DNI → necesita registro
    if (!user || !user.dni) {
      const tempToken = jwt.sign(
        { phoneNumber, type: 'temp_registration' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '15m' }
      );
      return { needsRegistration: true, tempToken };
    }

    // Usuario completo → login normal
    user = await prisma.user.update({
      where: { id: user.id },
      data: { phoneVerified: true, lastLoginAt: new Date() },
    });

    const token = this.generateToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

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

  async registerWithDni(
    tempToken: string,
    dni: string,
    firstName: string,
    lastName: string
  ): Promise<{ token: string; refreshToken: string; user: any }> {
    // Verificar token temporal
    let decoded: { phoneNumber: string; type: string };
    try {
      decoded = jwt.verify(
        tempToken,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as { phoneNumber: string; type: string };
    } catch {
      throw new Error('Token de registro expirado. Solicita un nuevo código OTP.');
    }

    if (decoded.type !== 'temp_registration') {
      throw new Error('Token inválido');
    }

    // Validar DNI/NIE formato español
    const dniClean = dni.replace(/[\s.-]/g, '').toUpperCase();
    const dniRegex = /^(\d{8}[A-Z]|[XYZ]\d{7}[A-Z])$/;
    if (!dniRegex.test(dniClean)) {
      throw new Error('DNI no válido. Formato: 12345678A o X1234567A');
    }

    // Verificar que el DNI no está en uso
    const existingDni = await prisma.user.findUnique({
      where: { dni: dniClean },
    });
    if (existingDni) {
      throw new Error('Este DNI ya está registrado en la plataforma');
    }

    // Crear usuario completo
    let user = await prisma.user.findUnique({
      where: { phoneNumber: decoded.phoneNumber },
    });

    if (user) {
      // Usuario parcial → completar
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          dni: dniClean,
          firstName,
          lastName,
          phoneVerified: true,
          lastLoginAt: new Date(),
        },
      });
    } else {
      // Usuario nuevo
      user = await prisma.user.create({
        data: {
          phoneNumber: decoded.phoneNumber,
          dni: dniClean,
          firstName,
          lastName,
          phoneVerified: true,
          lastLoginAt: new Date(),
        },
      });

      await prisma.userPreferences.create({
        data: { userId: user.id },
      });
    }

    const token = this.generateToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        entity: 'User',
        entityId: user.id,
        details: { dni: dniClean },
      },
    });

    return { token, refreshToken, user };
  }

  async generateLinkCode(telegramId: string): Promise<string> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.linkCode.create({
      data: { code, telegramId, expiresAt },
    });

    return code;
  }

  async linkTelegram(userId: string, code: string): Promise<void> {
    const linkCode = await prisma.linkCode.findFirst({
      where: { code, used: false, expiresAt: { gte: new Date() } },
    });

    if (!linkCode) {
      throw new Error('Código inválido o expirado');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { telegramId: linkCode.telegramId },
    });

    await prisma.linkCode.update({
      where: { id: linkCode.id },
      data: { used: true },
    });
  }

  private generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' } as jwt.SignOptions
    );
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as { userId: string; type: string };

      if (decoded.type !== 'refresh') {
        throw new Error('Token inválido');
      }

      const session = await prisma.session.findFirst({
        where: { refreshToken, expiresAt: { gte: new Date() } },
      });

      if (!session) {
        throw new Error('Sesión inválida o expirada');
      }

      const newToken = this.generateToken(decoded.userId);
      const newRefreshToken = this.generateRefreshToken(decoded.userId);

      await prisma.session.update({
        where: { id: session.id },
        data: {
          token: newToken,
          refreshToken: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return { token: newToken, refreshToken: newRefreshToken };
    } catch {
      throw new Error('Token inválido o expirado');
    }
  }

  async logout(token: string): Promise<void> {
    await prisma.session.deleteMany({ where: { token } });
  }
}

export default new AuthService();
