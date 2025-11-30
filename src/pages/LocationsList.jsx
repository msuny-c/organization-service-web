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
    placeholderData: (prevData) => prevData,
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

      <Card>
        <CardBody>
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col md:w-64">
              <label
                htmlFor="search-field"
                className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Поле для поиска
              </label>
              <select
                id="search-field"
                value={searchField}
                onChange={(e) => {
                  setSearchField(e.target.value);
                  setPage(0);
                }}
                className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                {searchOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

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
                  <SortHeader field="id">ID</SortHeader>
                  <SortHeader field="name">Название</SortHeader>
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
            <div className="flex flex-wrap justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={page === i ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
