import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Plus, Search, ArrowUpDown } from 'lucide-react';
import { locationsApi } from '../lib/api';
import Button from '../components/Button';
import Card, { CardBody } from '../components/Card';
import Alert from '../components/Alert';

export default function LocationsList() {
  const [search, setSearch] = useState('');
  const [searchField, setSearchField] = useState('name');
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState('id');
  const [dir, setDir] = useState('asc');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const searchOptions = [
    { value: 'name', label: 'Название' },
  ];

  const placeholderByField = {
    name: 'Поиск по названию',
  };
  const searchPlaceholder = placeholderByField[searchField] || 'Поиск...';

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['locations', { search, searchField, page, sort, dir }],
    queryFn: () => {
      const params = { page, size: 10, sort: `${sort},${dir}` };
      const trimmedSearch = search.trim();
      if (trimmedSearch) {
        params.search = trimmedSearch;
        params.searchField = searchField || 'name';
      }
      return locationsApi.getAll(params);
    },
    retry: false,
    refetchInterval: (query) => (query.state.status === 'success' ? 1000 : false),
    refetchIntervalInBackground: true,
    keepPreviousData: true,
  });

  const handleDelete = async (id) => {
    const confirmMessage = 'Удалить эту локацию?';
    const confirm = window.confirm(confirmMessage);
    if (!confirm) return;
    try {
      await locationsApi.delete(id);
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Ошибка удаления';
      if (msg.includes('cascadeDelete=true')) {
        const cascade = window.confirm('Локация используется адресами.\n\nУдалить её вместе со всеми связанными адресами и организациями?');
        if (cascade) {
          try {
            await locationsApi.delete(id, { cascadeDelete: true });
            queryClient.invalidateQueries({ queryKey: ['locations'] });
          } catch (e2) {
            alert(e2?.response?.data?.error || e2?.message || 'Ошибка каскадного удаления');
          }
        }
      } else {
        alert(msg);
      }
    }
  };

  const handleSort = (field) => {
    if (sort === field) {
      setDir(dir === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(field);
      setDir('asc');
    }
    setPage(0);
  };

  const totalPages = data?.data?.totalPages || 0;
  const locations = Array.isArray(data?.data?.content) ? data.data.content : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Локации</h1>
          <p className="mt-1 text-sm text-gray-500">Справочник локаций</p>
        </div>
        <Button onClick={() => navigate('/locations/create')} className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Создать
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
            />
          </div>
          <select
            value={searchField}
            onChange={(e) => { setSearchField(e.target.value); setPage(0); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {searchOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : isError ? (
        <Alert type="error">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>Не удалось загрузить локации: {error?.response?.data?.error || error?.message}</span>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sm:px-6">
                    <button onClick={() => handleSort('id')} className="flex items-center gap-1 hover:text-gray-700">
                      ID <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sm:px-6">
                    <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-gray-700">
                      Название <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sm:px-6">X</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sm:px-6">Y</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sm:px-6">Z</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {locations.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap sm:px-6 sm:py-4">{l.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap sm:px-6 sm:py-4">{l.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap sm:px-6 sm:py-4">{l.x}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap sm:px-6 sm:py-4">{l.y}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap sm:px-6 sm:py-4">{l.z}</td>
                    <td className="px-4 py-3 text-sm font-medium text-right whitespace-nowrap sm:px-6 sm:py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/locations/${l.id}/edit`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(l.id)}
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
