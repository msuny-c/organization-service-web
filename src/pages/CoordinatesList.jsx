import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Plus, ArrowUpDown } from 'lucide-react';
import { coordinatesApi } from '../lib/api';
import Button from '../components/Button';
import Card, { CardBody } from '../components/Card';
import Alert from '../components/Alert';

export default function CoordinatesList() {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState('id');
  const [dir, setDir] = useState('asc');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const SortHeader = ({ field, children }) => (
    <th 
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sm:px-6"
      aria-sort={
        sort === field ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'
      }
    >
      <button
        type="button"
        onClick={() => handleSort(field)}
        className="flex items-center gap-1 text-nowrap uppercase text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        {children}
        <ArrowUpDown className="h-3 w-3" />
        {sort === field && (
          <span className="text-blue-600">{dir === 'asc' ? '↑' : '↓'}</span>
        )}
      </button>
    </th>
  );

  const handleSort = (field) => {
    if (sort === field) {
      setDir(dir === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(field);
      setDir('asc');
    }
    setPage(0);
  };

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['coordinates', { page, sort, dir }],
    queryFn: () => coordinatesApi.getAll({ page, size: 10, sort: `${sort},${dir}` }),
    retry: false,
    refetchInterval: (query) => (query.state.status === 'success' ? 1000 : false),
    refetchIntervalInBackground: true,
    keepPreviousData: true,
    placeholderData: (prevData) => prevData,
  });

  const handleDelete = async (id) => {
    const confirmMessage = 'Удалить эти координаты?';
    const confirm = window.confirm(confirmMessage);
    if (!confirm) return;
    try {
      await coordinatesApi.delete(id);
      queryClient.invalidateQueries({ queryKey: ['coordinates'] });
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Ошибка удаления';
      if (msg.includes('cascadeDelete=true')) {
        const cascade = window.confirm('Координаты используются организациями.\n\nУдалить их вместе со всеми связанными организациями?');
        if (cascade) {
          try {
            await coordinatesApi.delete(id, { cascadeDelete: true });
            queryClient.invalidateQueries({ queryKey: ['coordinates'] });
          } catch (e2) {
            alert(e2?.response?.data?.error || e2?.message || 'Ошибка каскадного удаления');
          }
        }
      } else {
        alert(msg);
      }
    }
  };

  const totalPages = data?.data?.totalPages || 0;
  const coords = Array.isArray(data?.data?.content) ? data.data.content : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Координаты</h1>
          <p className="mt-1 text-sm text-gray-500">Справочник координат</p>
        </div>
        <Button onClick={() => navigate('/coordinates/create')} className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Создать
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : isError ? (
        <Alert type="error">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>Не удалось загрузить координаты: {error?.response?.data?.error || error?.message}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? 'Повторная попытка...' : 'Повторить запрос'}
            </Button>
          </div>
        </Alert>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <SortHeader field="id">ID</SortHeader>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sm:px-6">X</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sm:px-6">Y</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {coords.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap sm:px-6 sm:py-4">{c.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap sm:px-6 sm:py-4">{c.x}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap sm:px-6 sm:py-4">{c.y}</td>
                    <td className="px-4 py-3 text-sm font-medium text-right whitespace-nowrap sm:px-6 sm:py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/coordinates/${c.id}/edit`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(c.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                >
                  Назад
                </Button>
                <span className="text-sm text-gray-700">
                  Страница {page + 1} из {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1}
                >
                  Вперед
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
