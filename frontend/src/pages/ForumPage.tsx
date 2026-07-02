import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { forumService } from '../services/forum';
import { MessageSquare, Plus, Search } from 'lucide-react';
import { useState } from 'react';

export function ForumPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: forumService.getCategories,
  });

  const { data: threads, isLoading } = useQuery({
    queryKey: ['threads', selectedCategory, search],
    queryFn: () =>
      search
        ? forumService.search(search)
        : forumService.getThreads({
            categoryId: selectedCategory,
            sortBy: 'newest',
          }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Foro</h1>
        <Link
          to="/forum/new"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo hilo
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en el foro..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              !selectedCategory
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.icon && <span className="mr-1">{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">Cargando hilos...</div>
      ) : !threads || threads.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No hay hilos</h3>
          <p className="text-gray-600 mt-1">
            Sé el primero en crear un hilo en esta categoría.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <Link
              key={thread.id}
              to={`/forum/thread/${thread.id}`}
              className="block bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-primary transition-colors"
            >
              <div className="flex items-start gap-3">
                {thread.isPinned && (
                  <span className="px-2 py-0.5 bg-warning/10 text-warning text-xs rounded font-medium">
                    Fijado
                  </span>
                )}
                {thread.isResolved && (
                  <span className="px-2 py-0.5 bg-success/10 text-success text-xs rounded">
                    Resuelto
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{thread.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span>{thread.category.name}</span>
                    <span>·</span>
                    <span>{thread._count?.replies || 0} respuestas</span>
                    <span>·</span>
                    <span>{thread.views} vistas</span>
                  </div>
                  {thread.tags && thread.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {thread.tags.map((t) => (
                        <span
                          key={t.tag.id}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          {t.tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
