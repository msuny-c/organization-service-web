import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UploadCloud, FileText, RefreshCcw, ShieldCheck, UserCircle, Clock } from 'lucide-react';
import Button from '../components/Button';
import Card, { CardBody, CardHeader } from '../components/Card';
import Input from '../components/Input';
import Alert from '../components/Alert';
import { importsApi } from '../lib/api';

const STATUS_MAP = {
  IN_PROGRESS: { label: 'В процессе', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  SUCCESS: { label: 'Готово', className: 'bg-green-100 text-green-800 border-green-200' },
  FAILED: { label: 'Ошибка', className: 'bg-red-100 text-red-800 border-red-200' },
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('ru-RU');
};

export default function ImportPage() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [username, setUsername] = useState('');
  const [admin, setAdmin] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['importHistory', { username, admin }],
    queryFn: () => importsApi.list({ username: username.trim(), admin }),
    select: (response) => response.data || [],
    keepPreviousData: true,
    refetchInterval: (data) =>
      data?.some((op) => op.status === 'IN_PROGRESS') ? 4000 : false,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, username, admin }) => importsApi.upload(file, { username, admin }),
    onSuccess: (response) => {
      setUploadError(null);
      setUploadSuccess({
        id: response.data.id,
        status: response.data.status,
        added: response.data.addedCount,
      });
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['importHistory'] });
      queryClient.refetchQueries({ queryKey: ['importHistory'] });
    },
    onError: (err) => {
      setUploadSuccess(null);
      setUploadError(err?.response?.data?.error || err.message || 'Не удалось выполнить импорт');
    },
  });

  const templateMutation = useMutation({
    mutationFn: () => importsApi.getTemplate(),
    onSuccess: (response) => {
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'import-template.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
    onError: (err) => {
      setUploadError(err?.response?.data?.error || err.message || 'Не удалось скачать шаблон');
    },
  });

  const hasHistory = useMemo(() => (data?.length || 0) > 0, [data]);
  const isUploading = uploadMutation.isPending;

  const handleFileChange = (e) => {
    const next = e.target.files?.[0];
    setFile(next || null);
  };

  const handleUpload = () => {
    if (!file) {
      setUploadError('Выберите файл для импорта');
      return;
    }
    setUploadError(null);
    uploadMutation.mutate({ file, username: username.trim(), admin });
  };

  const renderStatus = (status) => {
    const meta = STATUS_MAP[status] || { label: status || '—', className: 'bg-gray-100 text-gray-700 border-gray-200' };
    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${meta.className}`}>
        {meta.label}
      </span>
    );
  };

  const errorMessage = error?.response?.data?.error || error?.message;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Импорт организаций</h1>
          <p className="mt-1 text-sm text-gray-500">
            Загрузка JSON-файла с организациями и просмотр истории импортов
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="whitespace-nowrap"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
          <Button
            variant="secondary"
            onClick={() => templateMutation.mutate()}
            disabled={templateMutation.isPending}
            className="whitespace-nowrap"
          >
            <FileText className="h-4 w-4 mr-2" />
            Шаблон
          </Button>
        </div>
      </div>

      {uploadError && (
        <Alert type="error" onClose={() => setUploadError(null)}>
          {uploadError}
        </Alert>
      )}
      {uploadSuccess && (
        <Alert type="success" onClose={() => setUploadSuccess(null)}>
          Импорт #{uploadSuccess.id} — {STATUS_MAP[uploadSuccess.status]?.label || uploadSuccess.status}
          {uploadSuccess.added != null && `, добавлено: ${uploadSuccess.added}`}
        </Alert>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <UploadCloud className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Новый импорт</h2>
                <p className="text-sm text-gray-500">JSON-массив организаций</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Файл</label>
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer">
                  <div className="w-full rounded-md border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-700 transition">
                    {file ? file.name : 'Выберите .json файл'}
                  </div>
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="whitespace-nowrap"
                >
                  <UploadCloud className="h-4 w-4 mr-2" />
                  Импортировать
                </Button>
              </div>
            </div>

            <Input
              label="Имя пользователя (для истории)"
              placeholder="Например, student1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={admin}
                onChange={(e) => setAdmin(e.target.checked)}
              />
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-gray-500" />
                Администратор (видеть все операции)
              </span>
            </label>

            <div className="text-xs text-gray-500">
              Файл должен содержать массив объектов OrganizationDto. Вложенные поля
              (coordinates, postalAddress, officialAddress, town) указываются в той же записи.
            </div>
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">История импортов</h2>
                  <p className="text-sm text-gray-500">
                    {admin ? 'Все операции (режим администратора)' : 'Операции выбранного пользователя'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <UserCircle className="h-4 w-4" />
                {username.trim() || 'anonymous'}
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {isLoading && (
              <div className="py-10 text-center text-gray-500">Загрузка истории...</div>
            )}
            {!isLoading && error && (
              <Alert type="error" onClose={() => queryClient.removeQueries({ queryKey: ['importHistory'] })}>
                Не удалось загрузить историю: {errorMessage || 'Попробуйте обновить страницу'}
              </Alert>
            )}

            {!isLoading && !error && !hasHistory && (
              <div className="py-10 text-center text-gray-500">Операции импорта пока не выполнялись</div>
            )}

            {!isLoading && !error && hasHistory && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Пользователь</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Файл</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Добавлено</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Начало</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Завершено</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ошибка</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((op) => (
                      <tr key={op.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{op.id}</td>
                        <td className="px-4 py-3 text-sm">{renderStatus(op.status)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{op.username || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{op.filename || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {op.status === 'SUCCESS' ? op.addedCount ?? 0 : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(op.startedAt)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(op.finishedAt)}</td>
                        <td className="px-4 py-3 text-sm text-red-600 max-w-xs">
                          {op.errorMessage || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
