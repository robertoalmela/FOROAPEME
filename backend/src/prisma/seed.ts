import { PrismaClient } from '../../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('🌱 Seeding database...');

  // ==========================================
  // CATEGORÍAS PRINCIPALES (Foros globales)
  // ==========================================
  const general = await prisma.category.create({
    data: {
      name: 'General',
      slug: 'general',
      description: 'Temas generales de APEME',
      icon: '💬',
      color: '#3B82F6',
      order: 1,
    },
  });

  const ofertas = await prisma.category.create({
    data: {
      name: 'Ofertas de Trabajo',
      slug: 'ofertas-trabajo',
      description: 'Ofertas y oportunidades laborales',
      icon: '💼',
      color: '#10B981',
      order: 2,
    },
  });

  await prisma.category.create({
    data: {
      name: 'Formación',
      slug: 'formacion',
      description: 'Cursos y eventos de formación',
      icon: '📚',
      color: '#8B5CF6',
      order: 3,
    },
  });

  await prisma.category.create({
    data: {
      name: 'Normativa General',
      slug: 'normativa-general',
      description: 'Normativa aplicable a toda la provincia',
      icon: '📋',
      color: '#F59E0B',
      order: 4,
    },
  });

  // ==========================================
  // SUBFOROS POR COMARCAS
  // ==========================================

  // Vega Baja
  const vegaBaja = await prisma.category.create({
    data: {
      name: 'Vega Baja',
      slug: 'vega-baja',
      description: 'Foro de la comarca de la Vega Baja',
      icon: '🏘️',
      color: '#06B6D4',
      order: 10,
    },
  });

  await prisma.category.createMany({
    data: [
      {
        name: 'Normativa Vega Baja',
        slug: 'normativa-vega-baja',
        description: 'Normativa específica de la Vega Baja',
        icon: '📜',
        color: '#F97316',
        order: 1,
        parentId: vegaBaja.id,
      },
      {
        name: 'Directores Vega Baja',
        slug: 'directores-vega-baja',
        description: 'Espacio para directores de la Vega Baja',
        icon: '👔',
        color: '#DC2626',
        order: 2,
        parentId: vegaBaja.id,
      },
      {
        name: 'Ofertas Vega Baja',
        slug: 'ofertas-vega-baja',
        description: 'Ofertas de trabajo en la Vega Baja',
        icon: '💼',
        color: '#059669',
        order: 3,
        parentId: vegaBaja.id,
      },
    ],
  });

  // Baix Vinalopó
  const baixVinalopo = await prisma.category.create({
    data: {
      name: 'Baix Vinalopó',
      slug: 'baix-vinalopo',
      description: 'Foro de la comarca del Baix Vinalopó',
      icon: '🏘️',
      color: '#06B6D4',
      order: 11,
    },
  });

  await prisma.category.createMany({
    data: [
      {
        name: 'Normativa Baix Vinalopó',
        slug: 'normativa-baix-vinalopo',
        description: 'Normativa específica del Baix Vinalopó',
        icon: '📜',
        color: '#F97316',
        order: 1,
        parentId: baixVinalopo.id,
      },
      {
        name: 'Directores Baix Vinalopó',
        slug: 'directores-baix-vinalopo',
        description: 'Espacio para directores del Baix Vinalopó',
        icon: '👔',
        color: '#DC2626',
        order: 2,
        parentId: baixVinalopo.id,
      },
      {
        name: 'Ofertas Baix Vinalopó',
        slug: 'ofertas-baix-vinalopo',
        description: 'Ofertas de trabajo en el Baix Vinalopó',
        icon: '💼',
        color: '#059669',
        order: 3,
        parentId: baixVinalopo.id,
      },
    ],
  });

  // Alacantí
  const alacanti = await prisma.category.create({
    data: {
      name: 'Alacantí',
      slug: 'alacanti',
      description: 'Foro de la comarca del Alacantí',
      icon: '🏘️',
      color: '#06B6D4',
      order: 12,
    },
  });

  await prisma.category.createMany({
    data: [
      {
        name: 'Normativa Alacantí',
        slug: 'normativa-alacanti',
        description: 'Normativa específica del Alacantí',
        icon: '📜',
        color: '#F97316',
        order: 1,
        parentId: alacanti.id,
      },
      {
        name: 'Directores Alacantí',
        slug: 'directores-alacanti',
        description: 'Espacio para directores del Alacantí',
        icon: '👔',
        color: '#DC2626',
        order: 2,
        parentId: alacanti.id,
      },
    ],
  });

  // Vinalopó Mitjà
  const vinalopoMidja = await prisma.category.create({
    data: {
      name: 'Vinalopó Mitjà',
      slug: 'vinalopo-midja',
      description: 'Foro de la comarca del Vinalopó Mitjà',
      icon: '🏘️',
      color: '#06B6D4',
      order: 13,
    },
  });

  await prisma.category.createMany({
    data: [
      {
        name: 'Normativa Vinalopó Mitjà',
        slug: 'normativa-vinalopo-midja',
        description: 'Normativa específica del Vinalopó Mitjà',
        icon: '📜',
        color: '#F97316',
        order: 1,
        parentId: vinalopoMidja.id,
      },
      {
        name: 'Directores Vinalopó Mitjà',
        slug: 'directores-vinalopo-midja',
        description: 'Espacio para directores del Vinalopó Mitjà',
        icon: '👔',
        color: '#DC2626',
        order: 2,
        parentId: vinalopoMidja.id,
      },
    ],
  });

  // ==========================================
  // USUARIOS
  // ==========================================
  const admin = await prisma.user.create({
    data: {
      phoneNumber: '+34600000001',
      phoneVerified: true,
      dni: '12345678A',
      firstName: 'Admin',
      lastName: 'APEME',
      role: 'ADMIN',
    },
  });

  const users = await Promise.all([
    prisma.user.create({
      data: {
        phoneNumber: '+34600000002',
        phoneVerified: true,
        dni: '87654321B',
        firstName: 'María',
        lastName: 'García',
        role: 'MEMBER',
      },
    }),
    prisma.user.create({
      data: {
        phoneNumber: '+34600000003',
        phoneVerified: true,
        dni: '11223344C',
        firstName: 'Carlos',
        lastName: 'López',
        role: 'MEMBER',
      },
    }),
    prisma.user.create({
      data: {
        phoneNumber: '+34600000004',
        phoneVerified: true,
        dni: '55667788D',
        firstName: 'Ana',
        lastName: 'Martínez',
        role: 'MODERATOR',
      },
    }),
  ]);

  // ==========================================
  // VOTACIONES
  // ==========================================
  const poll = await prisma.poll.create({
    data: {
      title: '¿Apoyas la nueva propuesta de convenio colectivo?',
      description: 'Se somete a votación la propuesta de convenio colectivo negociada por la junta directiva.',
      pollType: 'YES_NO',
      isAnonymous: false,
      allowMultiple: false,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      options: {
        create: [
          { text: 'Sí', order: 1 },
          { text: 'No', order: 2 },
          { text: 'Abstención', order: 3 },
        ],
      },
    },
    include: { options: true },
  });

  if (poll.options.length > 0) {
    await prisma.vote.createMany({
      data: [
        { userId: users[0].id, pollId: poll.id, optionId: poll.options[0].id, ipAddress: '192.168.1.10' },
        { userId: users[1].id, pollId: poll.id, optionId: poll.options[0].id, ipAddress: '192.168.1.11' },
        { userId: users[2].id, pollId: poll.id, optionId: poll.options[1].id, ipAddress: '192.168.1.12' },
      ],
    });
  }

  await prisma.poll.create({
    data: {
      title: '¿Qué temas te gustaría ver en la próxima asamblea?',
      description: 'Selecciona todos los temas que te interesen.',
      pollType: 'MULTIPLE_CHOICE',
      isAnonymous: false,
      allowMultiple: true,
      maxChoices: 3,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      options: {
        create: [
          { text: 'Actualización de tarifas', order: 1 },
          { text: 'Nuevas herramientas digitales', order: 2 },
          { text: 'Formación continua', order: 3 },
          { text: 'Relaciones institucionales', order: 4 },
          { text: 'Servicios para asociados', order: 5 },
        ],
      },
    },
  });

  // ==========================================
  // HILOS DE EJEMPLO
  // ==========================================
  const threads = await Promise.all([
    prisma.thread.create({
      data: {
        title: 'Bienvenidos a la nueva plataforma de APEME',
        content: 'Estrenamos plataforma digital para mejorar la comunicación y participación de todos los asociados.',
        authorId: admin.id,
        categoryId: general.id,
        isPinned: true,
      },
    }),
    prisma.thread.create({
      data: {
        title: 'Nueva normativa de la Vega Baja 2026',
        content: 'Se ha publicado la nueva normativa aplicable a las empresas de la Vega Baja. Revisad los cambios principales.',
        authorId: admin.id,
        categoryId: vegaBaja.id,
        isPinned: true,
      },
    }),
    prisma.thread.create({
      data: {
        title: 'Oferta: Programador web en Elche',
        content: 'Empresa del sector busca desarrollador full-stack con experiencia en React y Node.js.',
        authorId: users[0].id,
        categoryId: ofertas.id,
      },
    }),
    prisma.thread.create({
      data: {
        title: 'Directores Baix Vinalopó: reunión mensual',
        content: 'Convocatoria de reunión mensual de directores del Baix Vinalopó. Próximo jueves a las 18:00.',
        authorId: users[2].id,
        categoryId: baixVinalopo.id,
      },
    }),
  ]);

  await Promise.all([
    prisma.reply.create({
      data: { content: '¡Genial iniciativa!', authorId: users[0].id, threadId: threads[0].id },
    }),
    prisma.reply.create({
      data: { content: '¿Podrías compartir el rango salarial?', authorId: users[1].id, threadId: threads[2].id },
    }),
  ]);

  await prisma.notification.createMany({
    data: [
      {
        userId: users[0].id,
        type: 'NEW_POLL',
        title: 'Nueva votación disponible',
        message: 'Se ha publicado una nueva votación: "¿Apoyas la nueva propuesta de convenio colectivo?"',
        sentViaApp: true,
      },
      {
        userId: users[1].id,
        type: 'THREAD_REPLY',
        title: 'Nueva respuesta en tu hilo',
        message: 'Carlos López ha respondido a tu hilo',
        sentViaApp: true,
      },
      {
        userId: users[0].id,
        type: 'SYSTEM',
        title: 'Bienvenido a la plataforma',
        message: 'Tu cuenta ha sido creada exitosamente.',
        sentViaApp: true,
      },
    ],
  });

  console.log('✅ Seed completed!');
  console.log(`   - 4 foros principales + 4 comarcas con subforos`);
  console.log(`   - 4 usuarios (1 admin)`);
  console.log(`   - 2 votaciones`);
  console.log(`   - 4 hilos`);
  console.log('');
  console.log('🔑 Usuarios demo:');
  console.log(`   Admin:    +34600000001`);
  console.log(`   María:    +34600000002`);
  console.log(`   Carlos:   +34600000003`);
  console.log(`   Ana (Mod): +34600000004`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
