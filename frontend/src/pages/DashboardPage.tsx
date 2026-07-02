import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { pollService } from '../services/polls';
import { forumService } from '../services/forum';
import { notificationService } from '../services/notifications';
import { useAuth } from '../hooks/useAuth';
import { Vote, MessageSquare, Bell } from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();

  const { data: activePolls } = useQuery({
    queryKey: ['activePolls'],
    queryFn: pollService.getActivePolls,
  });

  const { data: threads } = useQuery({
    queryKey: ['recentThreads'],
    queryFn: () => forumService.getThreads({ limit: 5, sortBy: 'newest' }),
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['unreadNotifications'],
    queryFn: notificationService.getUnreadCount,
  });

  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Usuario';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#074E63]">
          Bienvenido, {userName}
        </h1>
        <p className="text-[#4C4A45] mt-1">Tu panel de participación</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/polls"
          className="bg-white p-6 rounded-lg shadow-sm border border-[#e5e9dd] hover:border-[#00738B] transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#00738B]/10 rounded-lg">
              <Vote className="w-6 h-6 text-[#00738B]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#074E63]">{activePolls?.length || 0}</p>
              <p className="text-[#4C4A45]">Votaciones activas</p>
            </div>
          </div>
        </Link>

        <Link
          to="/forum"
          className="bg-white p-6 rounded-lg shadow-sm border border-[#e5e9dd] hover:border-[#00738B] transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#75AAB1]/10 rounded-lg">
              <MessageSquare className="w-6 h-6 text-[#75AAB1]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#074E63]">{threads?.length || 0}</p>
              <p className="text-[#4C4A45]">Hilos recientes</p>
            </div>
          </div>
        </Link>

        <Link
          to="/notifications"
          className="bg-white p-6 rounded-lg shadow-sm border border-[#e5e9dd] hover:border-[#00738B] transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#f59e0b]/10 rounded-lg">
              <Bell className="w-6 h-6 text-[#f59e0b]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#074E63]">{unreadCount?.count || 0}</p>
              <p className="text-[#4C4A45]">Notificaciones sin leer</p>
            </div>
          </div>
        </Link>
      </div>

      {activePolls && activePolls.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#074E63]">Votaciones Activas</h2>
            <Link to="/polls" className="text-[#00738B] text-sm hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="space-y-3">
            {activePolls.slice(0, 3).map((poll) => (
              <Link
                key={poll.id}
                to={`/polls/${poll.id}`}
                className="block bg-white p-4 rounded-lg shadow-sm border border-[#e5e9dd] hover:border-[#00738B] transition-colors"
              >
                <h3 className="font-medium text-[#074E63]">{poll.title}</h3>
                <p className="text-sm text-[#4C4A45] mt-1 line-clamp-1">
                  {poll.description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-[#9ca3af]">
                  <span>{poll._count?.votes || 0} votos</span>
                  <span className="capitalize">
                    {poll.pollType === 'SINGLE_CHOICE'
                      ? 'Elección única'
                      : poll.pollType === 'MULTIPLE_CHOICE'
                      ? 'Elección múltiple'
                      : 'Sí/No'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {threads && threads.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#074E63]">Hilos Recientes</h2>
            <Link to="/forum" className="text-[#00738B] text-sm hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                to={`/forum/thread/${thread.id}`}
                className="block bg-white p-4 rounded-lg shadow-sm border border-[#e5e9dd] hover:border-[#00738B] transition-colors"
              >
                <div className="flex items-start gap-3">
                  {thread.isPinned && (
                    <span className="px-2 py-0.5 bg-[#f59e0b]/10 text-[#f59e0b] text-xs rounded">
                      Fijado
                    </span>
                  )}
                  <div>
                    <h3 className="font-medium text-[#074E63]">{thread.title}</h3>
                    <p className="text-sm text-[#4C4A45] mt-1">
                      {thread.category.name} · {thread._count?.replies || 0} respuestas
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
