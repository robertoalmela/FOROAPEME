import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { forumService } from '../services/forum';
import { ArrowLeft } from 'lucide-react';

export function NewThreadPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: forumService.getCategories,
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; content: string; categoryId: string; tags?: string[] }) =>
      forumService.createThread(data),
    onSuccess: (thread) => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      navigate(`/forum/thread/${thread.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !categoryId) return;

    const tagsArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    createMutation.mutate({
      title,
      content,
      categoryId,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/forum')}
        className="flex items-center gap-2 text-gray-600 hover:text-primary"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al foro
      </button>

      <h1 className="text-2xl font-bold text-gray-900">Crear nuevo hilo</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          >
            <option value="">Selecciona una categoría</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título del hilo"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contenido
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe el contenido de tu hilo..."
            rows={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Etiquetas (opcional)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Separadas por comas: ayuda, urgente, pregunta"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {createMutation.isPending ? 'Creando...' : 'Crear hilo'}
        </button>
      </form>
    </div>
  );
}
