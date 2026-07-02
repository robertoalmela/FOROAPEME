import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { pollService } from '../services/polls';
import { useAuthStore } from '../store/auth';
import { Vote, Clock, CheckCircle, XCircle } from 'lucide-react';

export function PollsPage() {
  const isAdmin = useAuthStore((state) => state.user?.role === 'ADMIN');

  const { data: polls, isLoading } = useQuery({
    queryKey: ['polls'],
    queryFn: () => pollService.getPolls(),
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Clock className="w-5 h-5 text-success" />;
      case 'CLOSED':
        return <CheckCircle className="w-5 h-5 text-gray-400" />;
      case 'DRAFT':
        return <XCircle className="w-5 h-5 text-warning" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Activa';
      case 'CLOSED':
        return 'Cerrada';
      case 'DRAFT':
        return 'Borrador';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return status;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12">Cargando votaciones...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Votaciones</h1>
        {isAdmin && (
          <Link
            to="/polls/new"
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Nueva votación
          </Link>
        )}
      </div>

      {!polls || polls.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Vote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No hay votaciones</h3>
          <p className="text-gray-600 mt-1">
            No se han creado votaciones todavía.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {polls.map((poll) => (
            <Link
              key={poll.id}
              to={`/polls/${poll.id}`}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{poll.title}</h3>
                    {getStatusIcon(poll.status)}
                  </div>
                  <p className="text-gray-600 mt-1 line-clamp-2">
                    {poll.description}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Vote className="w-4 h-4" />
                      {poll._count?.votes || 0} votos
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                      {getStatusLabel(poll.status)}
                    </span>
                    <span className="capitalize">
                      {poll.pollType === 'SINGLE_CHOICE'
                        ? 'Elección única'
                        : poll.pollType === 'MULTIPLE_CHOICE'
                        ? 'Elección múltiple'
                        : 'Sí/No'}
                    </span>
                    {poll.isAnonymous && (
                      <span className="text-gray-400">Anónima</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
