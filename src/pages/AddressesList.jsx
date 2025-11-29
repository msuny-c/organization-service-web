import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { addressesApi } from '../lib/api';
import Button from '../components/Button';
import Card, { CardBody } from '../components/Card';
import Alert from '../components/Alert';

export default function AddressesList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['addresses-list'],
    queryFn: () => addressesApi.getAll(),
    retry: false,
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить этот адрес?')) return;
    try {
      await addressesApi.delete(id);
      queryClient.invalidateQueries({ queryKey: ['addresses-list'] });
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || 'Ошибка удаления');
    }
  };

  const addresses = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Адреса</h1>
          <p className="mt-1 text-sm text-gray-500">Справочник адресов</p>
        </div>
        <Button onClick={() => navigate('/addresses/create')} className="w-full md:w-auto">
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
            <span>Не удалось загрузить адреса: {error?.response?.data?.error || error?.message}</span>
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
        <Card>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sm:px-6">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sm:px-6">Индекс</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sm:px-6">Город</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {addresses.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap sm:px-6 sm:py-4">{a.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap sm:px-6 sm:py-4">{a.zipCode || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap sm:px-6 sm:py-4">{a.town?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-right whitespace-nowrap sm:px-6 sm:py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/addresses/${a.id}/edit`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(a.id)}
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
          </CardBody>
        </Card>
      )}
    </div>
  );
}
