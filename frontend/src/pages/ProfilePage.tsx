import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import api from '../services/api';
import type { UserPreferences } from '../types';
import { User, Settings, Save } from 'lucide-react';

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');

  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ['preferences'],
    queryFn: async () => {
      const { data } = await api.get('/users/me/preferences');
      return data;
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName?: string; lastName?: string; email?: string }) => {
      const { data: result } = await api.put('/users/me', data);
      return result;
    },
    onSuccess: (data) => {
      updateUser(data);
      setEditing(false);
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: Partial<UserPreferences>) => {
      const { data: result } = await api.put('/users/me/preferences', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ firstName, lastName, email });
  };

  const handlePreferenceChange = (key: string, value: boolean) => {
    updatePreferencesMutation.mutate({ [key]: value });
  };

  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Usuario';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{userName}</h2>
            <p className="text-gray-600">{user?.phoneNumber}</p>
            <span
              className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${
                user?.role === 'ADMIN'
                  ? 'bg-danger/10 text-danger'
                  : user?.role === 'MODERATOR'
                  ? 'bg-warning/10 text-warning'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {user?.role === 'ADMIN'
                ? 'Administrador'
                : user?.role === 'MODERATOR'
                ? 'Moderador'
                : 'Miembro'}
            </span>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellidos
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-primary hover:underline"
          >
            Editar perfil
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Preferencias de notificación</h2>
        </div>

        {preferences && (
          <div className="space-y-3">
            {[
              { key: 'notifyNewPoll', label: 'Nuevas votaciones' },
              { key: 'notifyPollReminder', label: 'Recordatorios de votación' },
              { key: 'notifyThreadReply', label: 'Respuestas en mis hilos' },
              { key: 'notifyMention', label: 'Menciones' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between py-2">
                <span className="text-gray-700">{label}</span>
                <input
                  type="checkbox"
                  checked={preferences[key as keyof UserPreferences] as boolean}
                  onChange={(e) => handlePreferenceChange(key, e.target.checked)}
                  className="w-5 h-5 text-primary rounded focus:ring-primary"
                />
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Cuenta vinculada</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Teléfono</span>
            <span
              className={user?.phoneVerified ? 'text-success' : 'text-warning'}
            >
              {user?.phoneNumber}{' '}
              {user?.phoneVerified ? '✓' : '(sin verificar)'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Telegram</span>
            <span className={user?.telegramId ? 'text-success' : 'text-gray-400'}>
              {user?.telegramId
                ? `@${user.telegramUsername || 'vinculado'}`
                : 'No vinculado'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Miembro desde</span>
            <span>
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('es-ES')
                : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
