import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pollService } from '../services/polls';
import { Check } from 'lucide-react';

export function PollDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const { data: results, isLoading } = useQuery({
    queryKey: ['poll', id],
    queryFn: () => pollService.getPoll(id!),
    enabled: !!id,
  });

  const voteMutation = useMutation({
    mutationFn: (optionIds: string[]) => pollService.vote(id!, optionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poll', id] });
      queryClient.invalidateQueries({ queryKey: ['polls'] });
    },
  });

  const handleVote = () => {
    if (selectedOptions.length === 0) return;
    voteMutation.mutate(selectedOptions);
  };

  const toggleOption = (optionId: string) => {
    if (results?.poll.pollType === 'SINGLE_CHOICE' || results?.poll.pollType === 'YES_NO') {
      setSelectedOptions([optionId]);
    } else {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((o) => o !== optionId)
          : [...prev, optionId]
      );
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12">Cargando votación...</div>;
  }

  if (!results) {
    return <div className="text-center py-12">Votación no encontrada</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/polls')}
        className="text-gray-600 hover:text-primary"
      >
        ← Volver a votaciones
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`px-2 py-0.5 rounded text-xs ${
              results.poll.status === 'ACTIVE'
                ? 'bg-success/10 text-success'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {results.poll.status === 'ACTIVE' ? 'Activa' : 'Cerrada'}
          </span>
          {results.poll.isAnonymous && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              Anónima
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900">{results.poll.title}</h1>
        <p className="text-gray-600 mt-2">{results.poll.description}</p>

        <div className="mt-6 space-y-3">
          {results.results.map((option) => (
            <div key={option.id}>
              <button
                onClick={() =>
                  !results.userHasVoted &&
                  results.poll.status === 'ACTIVE' &&
                  toggleOption(option.id)
                }
                disabled={results.userHasVoted || results.poll.status !== 'ACTIVE'}
                className={`w-full p-4 rounded-lg border text-left transition-colors ${
                  selectedOptions.includes(option.id)
                    ? 'border-primary bg-primary/5'
                    : results.userHasVoted
                    ? 'border-gray-200'
                    : 'border-gray-200 hover:border-primary'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {results.userHasVoted && results.userVote?.includes(option.id) && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                    <span className="font-medium">{option.text}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {option.votes} votos ({option.percentage.toFixed(1)}%)
                  </span>
                </div>
                {results.userHasVoted && (
                  <div className="mt-2 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${option.percentage}%` }}
                    />
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>

        {!results.userHasVoted && results.poll.status === 'ACTIVE' && (
          <button
            onClick={handleVote}
            disabled={selectedOptions.length === 0 || voteMutation.isPending}
            className="mt-6 w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {voteMutation.isPending ? 'Enviando...' : 'Votar'}
          </button>
        )}

        {results.userHasVoted && (
          <p className="mt-4 text-center text-success font-medium">
            Has votado en esta encuesta
          </p>
        )}

        <div className="mt-4 text-sm text-gray-500 text-center">
          {results.totalVoters} {results.totalVoters === 1 ? 'participante' : 'participantes'}
        </div>
      </div>
    </div>
  );
}
