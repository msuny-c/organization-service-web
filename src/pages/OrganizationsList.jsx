import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2, Search, Plus, ArrowUpDown } from 'lucide-react';
import { organizationsApi } from '../lib/api';
import { getTypeName } from '../lib/constants';
import Button from '../components/Button';
import Card, { CardBody } from '../components/Card';
import Alert from '../components/Alert';

export default function OrganizationsList() {
  const [search, setSearch] = useState('');
  const [searchField, setSearchField] = useState('name');
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState('id');
  const [dir, setDir] = useState('asc');
  const [displayOrganizations, setDisplayOrganizations] = useState([]);
  const [displayTotalPages, setDisplayTotalPages] = useState(0);
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [redirectNotice, setRedirectNotice] = useState(location.state?.removedOrganizationNotice || null);

  useEffect(() => {
    if (location.state?.removedOrganizationNotice) {
      setRedirectNotice(location.state.removedOrganizationNotice);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);
  
  const searchOptions = [
    { value: 'name', label: 'Название' },
    { value: 'fullName', label: 'Полное название' },
    { value: 'postalAddress.zipCode', label: 'Индекс' },
    { value: 'postalAddress.town.name', label: 'Город' },
  ];
  
  const placeholderByField = {
    name: 'Поиск по названию',
    fullName: 'Поиск по полному названию',
    'postalAddress.zipCode': 'Поиск по индексу',
    'postalAddress.town.name': 'Поиск по городу',
  };
  const searchPlaceholder = placeholderByField[searchField] || 'Поиск...';

  const getErrorMessage = (error, fallback = 'Неизвестная ошибка') => {
    return error?.response?.data?.error || error?.message || fallback;
  };

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['organizations', { search, searchField, page, sort, dir }],
    queryFn: () => {
      const params = { page, size: 10, sort, dir };
      const trimmedSearch = search.trim();
      if (trimmedSearch) {
        params.search = trimmedSearch;
        params.searchField = searchField || 'name';
      }
      return organizationsApi.getAll(params);
    },
    retry: false,
    refetchInterval: (query) => (query.state.status === 'success' ? 1000 : false),
    refetchIntervalInBackground: true,
    keepPreviousData: true,
    placeholderData: (prevData) => prevData,
  });

  useEffect(() => {
    if (!isFetching && data?.data) {
      setDisplayOrganizations(data.data.content || []);
      setDisplayTotalPages(data.data.totalPages || 0);
    }
  }, [isFetching, data]);

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту организацию?')) {
      try {
        await organizationsApi.delete(id);
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
      } catch (error) {
        alert('Ошибка при удалении: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const organizations = displayOrganizations;
  const totalPages = displayTotalPages;

  const handleSort = (field) => {
    if (sort === field) {
      setDir(dir === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(field);
      setDir('asc');
    }
  };

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

  const handleRowClick = (id) => {
    navigate(`/organizations/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Организации</h1>
          <p className="mt-1 text-sm text-gray-500">
            Управление всеми организациями системы
          </p>
        </div>
        <Link to="/create" className="block w-full md:inline-block md:w-auto">
          <Button className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Создать
          </Button>
        </Link>
      </div>

      {redirectNotice && (
        <Alert type="warning" onClose={() => setRedirectNotice(null)}>
          {redirectNotice}
        </Alert>
      )}

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

      {isLoading && !data ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : isError ? (
        <Alert type="error">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Не удалось загрузить список организаций: {getErrorMessage(error, 'Попробуйте повторить попытку позже.')}
            </span>
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
        <>
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <SortHeader field="id">ID</SortHeader>
                    <SortHeader field="name">Название</SortHeader>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sm:px-6">
                      Координаты
                    </th>
                    <SortHeader field="postalAddress.zipCode">Индекс</SortHeader>
                    <SortHeader field="postalAddress.town.name">Город</SortHeader>
                    <SortHeader field="employeesCount">Сотрудники</SortHeader>
                    <SortHeader field="rating">Рейтинг</SortHeader>
                    <SortHeader field="type">Тип</SortHeader>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {organizations.map((org) => (
                    <tr
                      key={org.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleRowClick(org.id)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap sm:px-6 sm:py-4">
                        {org.id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap sm:px-6 sm:py-4">
                        <div className="text-sm font-medium text-gray-900">{org.name}</div>
                        {org.fullName && <div className="text-sm text-gray-500">{org.fullName}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap sm:px-6 sm:py-4">
                        {org.coordinates && `X: ${org.coordinates.x}, Y: ${org.coordinates.y}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap sm:px-6 sm:py-4">
                        {org.postalAddress?.zipCode || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap sm:px-6 sm:py-4">
                        {org.postalAddress?.town?.name || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap sm:px-6 sm:py-4">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {org.employeesCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap sm:px-6 sm:py-4">
                        {org.rating != null ? (
                          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                            {org.rating}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap sm:px-6 sm:py-4">
                        {getTypeName(org.type)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-right whitespace-nowrap sm:px-6 sm:py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link
                            to={`/organizations/${org.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link
                            to={`/organizations/${org.id}/edit`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="outline" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(org.id);
                            }}
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
        </>
      )}
    </div>
  );
}
