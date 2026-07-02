import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';
import { api } from './services/api';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

bot.use(async (ctx, next) => {
  try {
    await next();
  } catch (err: any) {
    console.error('Bot error:', err);
    ctx.reply(`❌ Error: ${err.message || 'Error interno'}`).catch(() => {});
  }
});

bot.start(async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const username = ctx.from.username;

  const user = await api.getUserByTelegram(telegramId).catch(() => null);
  if (user) {
    return ctx.reply(
      `👋 ¡Hola de nuevo${user.firstName ? ' ' + user.firstName : ''}!\n\n` +
      `Tu cuenta ya está vinculada. Usa /ayuda para ver los comandos.`
    );
  }

  const { code } = await api.generateLinkCode(telegramId);

  ctx.reply(
    `🎉 ¡Bienvenido a APEME Alicante!\n\n` +
    `Para vincular tu cuenta de Telegram:\n` +
    `1. Abre la plataforma web: ${process.env.WEB_URL || 'http://localhost:5173'}\n` +
    `2. Ve a tu Perfil > Vincular Telegram\n` +
    `3. Introduce este código: *${code}*\n\n` +
    `⏳ El código expira en 10 minutos.\n` +
    `💡 Usa /ayuda para ver todos los comandos.`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('ayuda', async (ctx) => {
  ctx.reply(
    `📋 *Comandos disponibles:*\n\n` +
    `/start - Vincular tu cuenta\n` +
    `/votar - Ver votaciones activas\n` +
    `/hilos - Últimos hilos del foro\n` +
    `/crear - Crear un nuevo hilo (responde a este comando)\n` +
    `/perfil - Ver tu perfil y estadísticas\n` +
    `/ayuda - Mostrar esta ayuda`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('votar', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const user = await api.getUserByTelegram(telegramId);

  if (!user) {
    return ctx.reply('Primero vincula tu cuenta con /start');
  }

  const polls = await api.getActivePolls();

  if (!polls || polls.length === 0) {
    return ctx.reply('📭 No hay votaciones activas en este momento.');
  }

  const buttons = polls.map((poll: any) => [
    Markup.button.callback(
      `${poll._count?.votes > 0 ? '✅' : '🗳️'} ${poll.title}`,
      `poll_${poll.id}`
    ),
  ]);

  ctx.reply(
    '📊 *Votaciones Activas*\n\nSelecciona una para ver detalles:',
    { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } }
  );
});

bot.action(/poll_(.+)/, async (ctx) => {
  const pollId = ctx.match[1];
  const telegramId = ctx.from.id.toString();

  const user = await api.getUserByTelegram(telegramId);
  if (!user) {
    return ctx.answerCbQuery('❌ Debes vincular tu cuenta primero');
  }

  const result = await api.getPollResults(pollId, user.id);

  if (result.userHasVoted) {
    let msg = `📊 *${result.poll.title}*\n\n*Resultados:*\n`;
    result.results.forEach((r: any) => {
      const bar = '█'.repeat(Math.round(r.percentage / 5));
      msg += `${bar} ${r.text}: ${r.votes} votos (${r.percentage.toFixed(1)}%)\n`;
    });
    msg += `\n✅ Ya has votado en esta encuesta.`;
    return ctx.editMessageText(msg, { parse_mode: 'Markdown' });
  }

  const buttons = result.results.map((opt: any) => [
    Markup.button.callback(opt.text, `vote_${pollId}_${opt.id}`),
  ]);

  ctx.editMessageText(
    `🗳️ *${result.poll.title}*\n\n${result.poll.description}\n\nSelecciona tu opción:`,
    { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } }
  );
});

bot.action(/vote_(.+)_(.+)/, async (ctx) => {
  const pollId = ctx.match[1];
  const optionId = ctx.match[2];
  const telegramId = ctx.from.id.toString();

  const user = await api.getUserByTelegram(telegramId);
  if (!user) return ctx.answerCbQuery('❌ Vincula tu cuenta primero');

  try {
    const token = await api.loginAsBot(user.id);
    await api.castVote(pollId, [optionId], token);

    ctx.answerCbQuery('✅ Voto registrado correctamente');

    const result = await api.getPollResults(pollId, user.id);
    let msg = `✅ *¡Voto registrado!*\n\n*Resultados:*\n`;
    result.results.forEach((r: any) => {
      const bar = '█'.repeat(Math.round(r.percentage / 5));
      msg += `${bar} ${r.text}: ${r.votes} votos (${r.percentage.toFixed(1)}%)\n`;
    });
    ctx.editMessageText(msg, { parse_mode: 'Markdown' });
  } catch (err: any) {
    ctx.answerCbQuery(`❌ ${err.message}`);
  }
});

bot.command('hilos', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const user = await api.getUserByTelegram(telegramId);

  if (!user) return ctx.reply('Primero vincula tu cuenta con /start');

  const threads = await api.getLatestThreads();

  if (!threads || threads.length === 0) {
    return ctx.reply('📭 No hay hilos en el foro todavía.');
  }

  let msg = '📝 *Últimos hilos del foro:*\n\n';
  threads.slice(0, 10).forEach((t: any, i: number) => {
    msg += `${i + 1}. *${t.title}*\n`;
    msg += `   📂 ${t.category?.name || 'General'} | 💬 ${t._count?.replies || 0} respuestas\n\n`;
  });
  msg += `🔗 ${process.env.WEB_URL || 'http://localhost:5173'}/forum`;

  ctx.reply(msg, { parse_mode: 'Markdown' });
});

bot.command('crear', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const user = await api.getUserByTelegram(telegramId);

  if (!user) return ctx.reply('Primero vincula tu cuenta con /start');

  const categories = await api.getCategories();
  if (!categories || categories.length === 0) {
    return ctx.reply('No hay categorías disponibles.');
  }

  const buttons = categories.map((cat: any) => [
    Markup.button.callback(
      `${cat.icon || '📁'} ${cat.name}`,
      `newthread_cat_${cat.id}`
    ),
  ]);

  ctx.reply(
    '📝 *Crear nuevo hilo*\n\nSelecciona una categoría:',
    { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } }
  );
});

const pendingThreads = new Map<string, { step: string; categoryId: string; title?: string }>();

bot.action(/newthread_cat_(.+)/, async (ctx) => {
  const categoryId = ctx.match[1];
  const userId = ctx.from.id.toString();

  pendingThreads.set(userId, { step: 'title', categoryId });
  ctx.editMessageText(
    '✏️ Escribe el *título* del hilo:',
    { parse_mode: 'Markdown' }
  );
});

bot.on('text', async (ctx) => {
  if (!ctx.message || !ctx.message.text) return;
  if (ctx.message.text.startsWith('/')) return;

  const userId = ctx.from.id.toString();
  const pending = pendingThreads.get(userId);
  if (!pending) return;

  if (pending.step === 'title') {
    pending.title = ctx.message.text;
    pending.step = 'content';
    pendingThreads.set(userId, pending);
    ctx.reply('✏️ Ahora escribe el *contenido* del hilo:', { parse_mode: 'Markdown' });
  } else if (pending.step === 'content') {
    try {
      const user = await api.getUserByTelegram(userId);
      if (!user) {
        pendingThreads.delete(userId);
        return ctx.reply('❌ Debes vincular tu cuenta primero');
      }

      const token = await api.loginAsBot(user.id);
      await api.createThread({
        title: pending.title!,
        content: ctx.message.text,
        categoryId: pending.categoryId,
      }, token);

      pendingThreads.delete(userId);
      ctx.reply(`✅ ¡Hilo creado correctamente!\n🔗 ${process.env.WEB_URL || 'http://localhost:5173'}/forum`);
    } catch (err: any) {
      ctx.reply(`❌ Error al crear el hilo: ${err.message}`);
    }
  }
});

bot.command('perfil', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const user = await api.getUserByTelegram(telegramId);

  if (!user) return ctx.reply('Primero vincula tu cuenta con /start');

  const stats = await api.getUserStats(user.id, user.role === 'ADMIN');

  let msg = `👤 *Perfil de Usuario*\n\n`;
  msg += `*Nombre:* ${user.firstName || '—'} ${user.lastName || ''}\n`;
  msg += `*Teléfono:* ${user.phoneNumber}\n`;
  msg += `*Rol:* ${user.role === 'ADMIN' ? '👑 Administrador' : user.role === 'MODERATOR' ? '🛡️ Moderador' : '👤 Miembro'}\n`;
  if (stats) {
    msg += `*Hilos creados:* ${stats.threadsCount || 0}\n`;
    msg += `*Respuestas:* ${stats.repliesCount || 0}\n`;
    msg += `*Votos emitidos:* ${stats.votesCount || 0}\n`;
  }

  ctx.reply(msg, { parse_mode: 'Markdown' });
});

bot.launch();
console.log('🤖 Bot de Telegram APEME iniciado');
