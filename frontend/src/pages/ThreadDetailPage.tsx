import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { forumService } from '../services/forum';
import { ArrowLeft, Send } from 'lucide-react';

export function ThreadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [replyContent, setReplyContent] = useState('');

  const { data: thread, isLoading: threadLoading } = useQuery({
    queryKey: ['thread', id],
    queryFn: () => forumService.getThread(id!),
    enabled: !!id,
  });

  const { data: replies, isLoading: repliesLoading } = useQuery({
    queryKey: ['replies', id],
    queryFn: () => forumService.getReplies(id!),
    enabled: !!id,
  });

  const replyMutation = useMutation({
    mutationFn: (content: string) => forumService.createReply(id!, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['replies', id] });
      setReplyContent('');
    },
  });

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    replyMutation.mutate(replyContent);
  };

  if (threadLoading) {
    return <div className="flex justify-center py-12">Cargando hilo...</div>;
  }

  if (!thread) {
    return <div className="text-center py-12">Hilo no encontrado</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/forum')}
        className="flex items-center gap-2 text-gray-600 hover:text-primary"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al foro
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
            {thread.category.name}
          </span>
          {thread.isPinned && (
            <span className="px-2 py-0.5 bg-warning/10 text-warning text-xs rounded">
              Fijado
            </span>
          )}
          {thread.isLocked && (
            <span className="px-2 py-0.5 bg-danger/10 text-danger text-xs rounded">
              Bloqueado
            </span>
          )}
          {thread.isResolved && (
            <span className="px-2 py-0.5 bg-success/10 text-success text-xs rounded">
              Resuelto
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900">{thread.title}</h1>

        <div className="mt-4 text-gray-700 whitespace-pre-wrap">
          {thread.content}
        </div>

        {thread.tags && thread.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {thread.tags.map((t) => (
              <span
                key={t.tag.id}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
              >
                {t.tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
          Por{' '}
          {[thread.author.firstName, thread.author.lastName]
            .filter(Boolean)
            .join(' ') || 'Usuario'}{' '}
          · {new Date(thread.createdAt).toLocaleDateString('es-ES')}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          Respuestas ({replies?.length || 0})
        </h2>

        {repliesLoading ? (
          <div className="text-center py-8">Cargando respuestas...</div>
        ) : !replies || replies.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-600">
            No hay respuestas todavía.
          </div>
        ) : (
          replies.map((reply) => (
            <div
              key={reply.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              {reply.parent && (
                <div className="mb-3 p-3 bg-gray-50 rounded border-l-2 border-gray-300">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    <strong>
                      {[reply.parent.author.firstName, reply.parent.author.lastName]
                        .filter(Boolean)
                        .join(' ')}
                      :
                    </strong>{' '}
                    {reply.parent.content}
                  </p>
                </div>
              )}
              <div className="text-gray-700 whitespace-pre-wrap">
                {reply.content}
              </div>
              <div className="mt-3 text-sm text-gray-500">
                {[reply.author.firstName, reply.author.lastName]
                  .filter(Boolean)
                  .join(' ') || 'Usuario'}{' '}
                · {new Date(reply.createdAt).toLocaleDateString('es-ES')}
              </div>
            </div>
          ))
        )}
      </div>

      {!thread.isLocked && (
        <form onSubmit={handleSubmitReply} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-medium mb-3">Tu respuesta</h3>
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Escribe tu respuesta..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            required
          />
          <button
            type="submit"
            disabled={replyMutation.isPending || !replyContent.trim()}
            className="mt-3 flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {replyMutation.isPending ? 'Enviando...' : 'Responder'}
          </button>
        </form>
      )}
    </div>
  );
}
