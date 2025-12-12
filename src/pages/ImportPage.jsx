import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UploadCloud, FileText, Clock } from 'lucide-react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import Button from '../components/Button';
import Card, { CardBody, CardHeader } from '../components/Card';
import Alert from '../components/Alert';
import { importsApi } from '../lib/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';

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
  const { user, isAuthenticated, becomeAdmin, becomeUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [file, setFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [adminMode, setAdminMode] = useState(user?.role === 'ADMIN');
  const [importedOrgs, setImportedOrgs] = useState([]);
  const [jsonText, setJsonText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const shouldFetchHistory = isAuthenticated;

  useEffect(() => {
    setAdminMode(user?.role === 'ADMIN');
  }, [user?.role]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['importHistory'],
    queryFn: () => importsApi.list(),
    select: (response) => response.data || [],
    keepPreviousData: true,
    refetchInterval: (data) =>
      Array.isArray(data) && data.some((op) => op.status === 'IN_PROGRESS') ? 4000 : false,
    enabled: shouldFetchHistory,
  });

  useWebSocket(
    shouldFetchHistory ? '/topic/imports' : null,
    () => {
      queryClient.invalidateQueries({ queryKey: ['importHistory'] });
      queryClient.refetchQueries({ queryKey: ['importHistory'] });
    },
    { enabled: shouldFetchHistory }
  );

  const uploadMutation = useMutation({
    mutationFn: ({ file }) => importsApi.upload(file),
    onSuccess: (response) => {
      setUploadError(null);
      setImportedOrgs(response.data.createdOrganizations || []);
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

  const history = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const hasHistory = history.length > 0;
  const isUploading = uploadMutation.isPending;
  const goToLogin = () => navigate('/login', { state: { from: location, backgroundLocation: location } });

  const handleFileChange = (e) => {
    const next = e.target.files?.[0];
    setFile(next || null);
  };

  const handleUpload = () => {
    if (!isAuthenticated) {
      setUploadError('Для импорта необходимо войти в систему');
      return;
    }
    if (!file) {
      setUploadError('Выберите файл для импорта');
      return;
    }
    setUploadError(null);
    uploadMutation.mutate({ file });
  };

  const humanizeError = (err) => {
    if (!err) return [];
    const raw = typeof err === 'string' ? err : String(err);
    const parts = raw.split(/;|,/).map((p) => p.trim()).filter(Boolean);
    if (!parts.length) return [raw];

    const first = parts[0];
    const match = first.match(/Ошибка в записи #(\d+)/);
    if (match) {
      const prefix = `Ошибка в записи #${match[1]}`;
      return parts.map((p, idx) => (idx === 0 ? p : `${prefix}: ${p}`));
    }
    return parts;
  };

  const errorItems = useMemo(() => humanizeError(uploadError), [uploadError]);

  const highlight = (code) => Prism.highlight(code, Prism.languages.json, 'json');

  const renderStatus = (status) => {
    const meta = STATUS_MAP[status] || {
      label: status || '—',
      className: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${meta.className}`}>
        {meta.label}
      </span>
    );
  };

  const historyError = shouldFetchHistory ? error : null;
  const errorMessage = historyError?.response?.data?.error || historyError?.message;
  const historyLoading = shouldFetchHistory && isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Импорт организаций</h1>
          <p className="mt-1 text-sm text-gray-500">Загрузка JSON-файла с организациями и просмотр истории импортов</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          {isAuthenticated && (
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={adminMode}
                onChange={async (e) => {
                  const next = e.target.checked;
                  setAdminMode(next);
                  try {
                    if (next) {
                      await becomeAdmin();
                    } else {
                      await becomeUser();
                    }
                    queryClient.invalidateQueries({ queryKey: ['importHistory'] });
                    queryClient.refetchQueries({ queryKey: ['importHistory'] });
                  } catch (err) {
                    setUploadError(err?.response?.data?.error || err.message || 'Не удалось сменить роль');
                    setAdminMode(!next);
                  }
                }}
                disabled={!isAuthenticated}
              />
              <span>Режим администратора</span>
            </label>
          )}
          <Button
            variant="secondary"
            onClick={() => templateMutation.mutate()}
            disabled={templateMutation.isPending}
            className="whitespace-nowrap"
          >
            <FileText className="h-4 w-4 mr-2" />
            Шаблон
          </Button>
          {isAuthenticated && (
            <Button variant="outline" onClick={() => setIsModalOpen(true)} className="whitespace-nowrap">
              Вставить JSON
            </Button>
          )}
        </div>
      </div>

      {uploadError && (
        <Alert type="error" onClose={() => setUploadError(null)}>
          <div className="space-y-2">
            <div>Не удалось выполнить импорт:</div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {errorItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
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
          <CardBody className="space-y-6">
            <div className="space-y-5">
              <label className="block text-sm font-medium text-gray-700">Файл</label>
              <label className="flex-1 cursor-pointer">
                <div className="w-full rounded-md border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-700 transition">
                  {file ? file.name : 'Выберите .json файл'}
                </div>
                <input type="file" accept=".json,application/json" className="hidden" onChange={handleFileChange} />
              </label>
              {importedOrgs.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Импортированные организации</div>
                  <select
                    className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                      const orgId = e.target.value;
                      if (orgId) {
                        window.location.hash = `#/organizations/${orgId}`;
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Выберите организацию
                    </option>
                    {importedOrgs.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} (ID: {org.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {isAuthenticated ? (
                <Button onClick={handleUpload} disabled={isUploading} className="w-full mt-4">
                  <UploadCloud className="h-4 w-4 mr-2" />
                  Импортировать
                </Button>
              ) : (
                <Button variant="secondary" onClick={goToLogin} className="w-full mt-4">
                  Войти для импорта
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        <Card className="xl:col-span-2 h-full">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">История импортов</h2>
                  <p className="text-sm text-gray-500">История последних импортов</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {!shouldFetchHistory && (
              <div className="py-10 text-center text-gray-500">
                История доступна после входа в систему.
                <div className="mt-3 flex justify-center">
                  <Button variant="outline" size="sm" onClick={goToLogin}>
                    Войти
                  </Button>
                </div>
              </div>
            )}
            {shouldFetchHistory && historyLoading && <div className="py-10 text-center text-gray-500">Загрузка истории...</div>}
            {shouldFetchHistory && !historyLoading && historyError && (
              <Alert type="error" onClose={() => queryClient.removeQueries({ queryKey: ['importHistory'] })}>
                Не удалось загрузить историю: {errorMessage || 'Попробуйте обновить страницу'}
              </Alert>
            )}

            {shouldFetchHistory && !historyLoading && !historyError && !hasHistory && (
              <div className="py-10 text-center text-gray-500">Операции импорта пока не выполнялись</div>
            )}

            {shouldFetchHistory && !historyLoading && !historyError && hasHistory && (
              <div className="overflow-x-auto max-h-[520px]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                      {user?.role === 'ADMIN' && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Пользователь</th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Добавлено</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата загрузки</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {history.map((op) => (
                      <tr key={op.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{op.id}</td>
                        <td className="px-4 py-3 text-sm">{renderStatus(op.status)}</td>
                        {user?.role === 'ADMIN' && <td className="px-4 py-3 text-sm text-gray-700">{op.username || '—'}</td>}
                        <td className="px-4 py-3 text-sm text-gray-700">{op.status === 'SUCCESS' ? op.addedCount ?? 0 : '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(op.startedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h3 className="text-lg font-semibold text-gray-900">Вставка JSON</h3>
              <button type="button" className="text-gray-500 hover:text-gray-700" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3">
              <label className="block text-sm font-medium text-gray-700">JSON</label>

              <div className="space-y-3">
                <Editor
                  className="json-editor"
                  value={jsonText}
                  onValueChange={setJsonText}
                  highlight={highlight}
                  padding={12}
                  textareaId="json-editor"
                  textareaClassName="json-editor__textarea focus:outline-none"
                  preClassName="json-editor__pre"
                  textareaProps={{ spellCheck: false }}
                  placeholder='[ { "name": "Org", "coordinates": { "x": 1, "y": 2 }, ... } ]'
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-4 py-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Отмена
              </Button>
              <Button
                onClick={() => {
                  try {
                    const parsed = JSON.parse(jsonText);
                    const blob = new Blob([JSON.stringify(parsed)], { type: 'application/json' });
                    const virtualFile = new File([blob], 'pasted-import.json', { type: 'application/json' });
                    setUploadError(null);
                    uploadMutation.mutate({ file: virtualFile });
                    setIsModalOpen(false);
                    setJsonText('');
                  } catch (err) {
                    setUploadError('Некорректный JSON: ' + (err.message || ''));
                  }
                }}
                disabled={isUploading}
              >
                Импортировать JSON
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
