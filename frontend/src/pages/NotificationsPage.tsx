import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notifications';
import { Bell, Check, Trash2 } from 'lucide-react';

export function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications({ limit: 50 }),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_POLL':
        return '🗳️';
      case 'POLL_CLOSED':
        return '📊';
      case 'THREAD_REPLY':
        return '💬';
      case 'MENTION':
        return '@';
      case 'SYSTEM':
        return '⚙️';
      default:
        return '📢';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12">Cargando notificaciones...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
        {notifications?.some((n) => !n.isRead) && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            className="text-sm text-primary hover:underline"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {!notifications || notifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Sin notificaciones</h3>
          <p className="text-gray-600 mt-1">
            No tienes notificaciones en este momento.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow-sm border p-4 ${
                notification.isRead
                  ? 'border-gray-200'
                  : 'border-primary/30 bg-primary/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{notification.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                  <p className="text-gray-400 text-xs mt-2">
                    {new Date(notification.createdAt).toLocaleString('es-ES')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsReadMutation.mutate(notification.id)}
                      className="p-1 text-gray-400 hover:text-success"
                      title="Marcar como leída"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(notification.id)}
                    className="p-1 text-gray-400 hover:text-danger"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
