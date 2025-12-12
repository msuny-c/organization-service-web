import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { MapPin, BarChart3, Calculator, UserX, ArrowDownUp, TrendingUp } from 'lucide-react';
import { operationsApi } from '../lib/api';
import { ORGANIZATION_TYPES } from '../lib/constants';
import Button from '../components/Button';
import Card, { CardHeader, CardBody } from '../components/Card';
import Input, { Select } from '../components/Input';
import Alert from '../components/Alert';
import { useAuth } from '../context/AuthContext';

const OPERATIONS = [
  { 
    id: 'minimal', 
    name: 'Минимальные координаты', 
    icon: MapPin, 
    color: 'blue',
    description: 'Найти организацию с минимальными координатами',
    requiresAuth: false,
  },
  { 
    id: 'rating', 
    name: 'Группировка по рейтингу', 
    icon: TrendingUp, 
    color: 'yellow',
    description: 'Статистика по рейтингам организаций',
    requiresAuth: false,
  },
  { 
    id: 'count', 
    name: 'Подсчет по типу', 
    icon: Calculator, 
    color: 'purple',
    description: 'Количество организаций определенного типа',
    requiresAuth: false,
  },
  { 
    id: 'dismiss', 
    name: 'Увольнение сотрудников', 
    icon: UserX, 
    color: 'orange',
    description: 'Уволить всех сотрудников организации',
    requiresAuth: true,
  },
  { 
    id: 'absorb', 
    name: 'Поглощение организации', 
    icon: ArrowDownUp, 
    color: 'red',
    description: 'Поглотить одну организацию другой',
    requiresAuth: true,
  },
];

export default function Operations() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [selectedOp, setSelectedOp] = useState('minimal');
  const [results, setResults] = useState({});
  const [errors, setErrors] = useState({});
  const [countType, setCountType] = useState('');
  const [dismissId, setDismissId] = useState('');
  const [absorbingId, setAbsorbingId] = useState('');
  const [absorbedId, setAbsorbedId] = useState('');

  const clearError = (key) => {
    setErrors(prev => ({ ...prev, [key]: null }));
  };

  const resolveAlert = (value) => {
    if (!value) return null;
    return typeof value === 'string' ? { message: value, type: 'error' } : value;
  };

  const renderLoginPrompt = (title, description) => (
    <Card className="border-blue-100 bg-gradient-to-r from-blue-50 via-white to-blue-50">
      <CardBody className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-gray-600 mt-1">{description}</p>
        </div>
        <Button
          onClick={() => navigate('/login', { state: { from: location, backgroundLocation: location } })}
          className="w-full sm:w-auto"
        >
          Войти
        </Button>
      </CardBody>
    </Card>
  );

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <Card className="border-blue-100 bg-gradient-to-r from-blue-50 via-white to-blue-50">
          <CardBody className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Спецоперации требуют входа</h1>
              <p className="text-gray-600 mt-1">Авторизуйтесь, чтобы выполнять поиск, группировки и служебные действия.</p>
            </div>
            <Button
              onClick={() => navigate('/login', { state: { from: location, backgroundLocation: location } })}
              className="w-full sm:w-auto"
            >
              Войти
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const minimalMutation = useMutation({
    mutationFn: operationsApi.findMinimalCoordinates,
    onSuccess: (data) => {
      setResults({ ...results, minimal: data.data });
      clearError('minimal');
    },
    onError: (error) => {
      setErrors({ ...errors, minimal: error.response?.data?.error || error.message });
    },
  });

  const ratingMutation = useMutation({
    mutationFn: operationsApi.groupByRating,
    onSuccess: (data) => {
      setResults({ ...results, rating: data.data });
      clearError('rating');
    },
    onError: (error) => {
      setErrors({ ...errors, rating: error.response?.data?.error || error.message });
    },
  });

  const countMutation = useMutation({
    mutationFn: operationsApi.countByType,
    onSuccess: (data) => {
      setResults({ ...results, count: data.data });
      clearError('count');
    },
    onError: (error) => {
      setErrors({ ...errors, count: error.response?.data?.error || error.message });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: operationsApi.dismissEmployees,
    onSuccess: (data) => {
      setResults({ ...results, dismiss: { success: data.data.message } });
      clearError('dismiss');
      setDismissId('');
    },
    onError: (error) => {
      setErrors({ ...errors, dismiss: error.response?.data?.error || error.message });
    },
  });

  const absorbMutation = useMutation({
    mutationFn: ({ absorbingId, absorbedId }) => operationsApi.absorb(absorbingId, absorbedId),
    onSuccess: (data) => {
      setResults({ ...results, absorb: { success: data.data.message } });
      clearError('absorb');
      setAbsorbingId('');
      setAbsorbedId('');
    },
    onError: (error) => {
      setErrors({ ...errors, absorb: error.response?.data?.error || error.message });
    },
  });

  const renderOperationContent = () => {
    const operation = OPERATIONS.find(op => op.id === selectedOp);
    if (!operation) return null;

    const Icon = operation.icon;
    const needsAuth = operation.requiresAuth && !isAuthenticated;

    switch (selectedOp) {
      case 'minimal': {
        const minimalError = resolveAlert(errors.minimal);
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-semibold">{operation.name}</h2>
                    <p className="text-sm text-gray-500">{operation.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <Button 
                  onClick={() => minimalMutation.mutate()} 
                  disabled={minimalMutation.isPending}
                  className="w-full"
                >
                  Найти организацию
                </Button>
              </CardBody>
            </Card>

            {minimalError && (
              <Alert type={minimalError.type} onClose={() => clearError('minimal')}>
                {minimalError.message}
              </Alert>
            )}

            {results.minimal && !errors.minimal && (
              <Card className="border-blue-200 bg-blue-50">
                <CardBody>
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Результат</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-blue-600 font-medium">Организация</div>
                      <div className="text-lg font-semibold text-blue-900">{results.minimal.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-blue-600 font-medium">ID</div>
                      <div className="text-lg font-semibold text-blue-900">{results.minimal.id}</div>
                    </div>
                    <div>
                      <div className="text-sm text-blue-600 font-medium">Координаты</div>
                      <div className="text-lg font-semibold text-blue-900">
                        X: {results.minimal.coordinates?.x}, Y: {results.minimal.coordinates?.y}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/organizations/${results.minimal.id}`)}
                    >
                      Открыть карточку
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        );
      }

      case 'rating': {
        const ratingError = resolveAlert(errors.rating);
        const ratingEntries = results.rating ? Object.entries(results.rating) : [];
        const hasRatingData = ratingEntries.length > 0;
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-semibold">{operation.name}</h2>
                    <p className="text-sm text-gray-500">{operation.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <Button 
                  onClick={() => ratingMutation.mutate()} 
                  disabled={ratingMutation.isPending}
                  className="w-full"
                >
                  Группировать по рейтингу
                </Button>
              </CardBody>
            </Card>

            {ratingError && (
              <Alert type={ratingError.type} onClose={() => clearError('rating')}>
                {ratingError.message}
              </Alert>
            )}

            {results.rating && !ratingError && !hasRatingData && (
              <Alert
                type="warning"
                onClose={() => setResults({ ...results, rating: null })}
              >
                Нет организаций для группировки по рейтингу
              </Alert>
            )}

            {hasRatingData && !ratingError && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardBody>
                  <h3 className="text-lg font-semibold text-yellow-900 mb-4">Статистика по рейтингам</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {ratingEntries.map(([rating, count]) => (
                      <div key={rating} className="bg-white rounded-lg p-4 text-center border border-yellow-200">
                        <div className="text-3xl font-bold text-yellow-600">{count}</div>
                        <div className="text-sm text-gray-600 mt-1">Рейтинг {rating}</div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        );
      }

      case 'count': {
        const countError = resolveAlert(errors.count);
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-semibold">{operation.name}</h2>
                    <p className="text-sm text-gray-500">{operation.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <Select
                  id="typeSelect"
                  value={countType}
                  onChange={(e) => {
                    setCountType(e.target.value);
                    clearError('count');
                  }}
                >
                  <option value="">Выберите тип...</option>
                  {Object.entries(ORGANIZATION_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </Select>
                <Button 
                  onClick={() => {
                    if (!countType) {
                      setErrors({ ...errors, count: { message: 'Пожалуйста, выберите тип организации', type: 'warning' } });
                      setResults({ ...results, count: null });
                      return;
                    }
                    countMutation.mutate(countType);
                  }} 
                  disabled={countMutation.isPending}
                  className="w-full"
                >
                  Подсчитать
                </Button>
              </CardBody>
            </Card>

            {countError && (
              <Alert type={countError.type} onClose={() => clearError('count')}>
                {countError.message}
              </Alert>
            )}

            {results.count && !errors.count && (
              <Card className="border-purple-200 bg-purple-50">
                <CardBody>
                  <div className="text-center">
                    <div className="text-sm text-purple-600 font-medium mb-2">
                      Тип: <span className="font-semibold">{ORGANIZATION_TYPES[results.count.type]}</span>
                    </div>
                    <div className="text-5xl font-bold text-purple-600">{results.count.count}</div>
                    <div className="text-sm text-gray-600 mt-2">организаций</div>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        );
      }

      case 'dismiss': {
        const dismissError = resolveAlert(errors.dismiss);
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-semibold">{operation.name}</h2>
                    <p className="text-sm text-gray-500">{operation.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                {needsAuth ? (
                  renderLoginPrompt('Требуется вход', 'Увольнение сотрудников доступно только авторизованным пользователям.')
                ) : (
                  <>
                    <Input 
                      id="dismissId" 
                      type="number"
                      label="ID организации"
                      placeholder="Введите ID"
                      min="1"
                      value={dismissId}
                      onChange={(e) => {
                        setDismissId(e.target.value);
                        clearError('dismiss');
                      }}
                    />
                    <Button 
                      variant="warning"
                      onClick={() => {
                        if (!dismissId) {
                          setErrors({ ...errors, dismiss: { message: 'Введите ID организации', type: 'warning' } });
                          setResults({ ...results, dismiss: null });
                          return;
                        }
                        dismissMutation.mutate(dismissId);
                      }} 
                      disabled={dismissMutation.isPending}
                      className="w-full"
                    >
                      Уволить всех сотрудников
                    </Button>
                  </>
                )}
              </CardBody>
            </Card>

            {dismissError && (
              <Alert type={dismissError.type} onClose={() => clearError('dismiss')}>
                {dismissError.message}
              </Alert>
            )}

            {results.dismiss?.success && !errors.dismiss && (
              <Alert type="success" onClose={() => setResults({ ...results, dismiss: null })}>
                {results.dismiss.success}
              </Alert>
            )}
          </div>
        );
      }

      case 'absorb': {
        const absorbError = resolveAlert(errors.absorb);
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-semibold">{operation.name}</h2>
                    <p className="text-sm text-gray-500">{operation.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                {needsAuth ? (
                  renderLoginPrompt('Требуется вход', 'Поглощение доступно только авторизованным пользователям.')
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Input 
                        id="absorbingId" 
                        type="number"
                        label="Поглощающая организация"
                        placeholder="ID"
                        min="1"
                        value={absorbingId}
                        onChange={(e) => {
                          setAbsorbingId(e.target.value);
                          clearError('absorb');
                        }}
                      />
                      <Input 
                        id="absorbedId" 
                        type="number"
                        label="Поглощаемая организация"
                        placeholder="ID"
                        min="1"
                        value={absorbedId}
                        onChange={(e) => {
                          setAbsorbedId(e.target.value);
                          clearError('absorb');
                        }}
                      />
                    </div>
                    <Button 
                      variant="danger"
                      onClick={() => {
                        if (!absorbingId || !absorbedId) {
                          setErrors({ ...errors, absorb: { message: 'Укажите оба ID организаций', type: 'warning' } });
                          setResults({ ...results, absorb: null });
                          return;
                        }
                        if (absorbingId === absorbedId) {
                          setErrors({ ...errors, absorb: { message: 'Организация не может поглотить саму себя', type: 'error' } });
                          setResults({ ...results, absorb: null });
                          return;
                        }
                        absorbMutation.mutate({ absorbingId, absorbedId });
                      }} 
                      disabled={absorbMutation.isPending}
                      className="w-full"
                    >
                      Выполнить поглощение
                    </Button>
                  </>
                )}
            </CardBody>
            </Card>

            {absorbError && (
              <Alert type={absorbError.type} onClose={() => clearError('absorb')}>
                {absorbError.message}
              </Alert>
            )}

            {results.absorb?.success && !errors.absorb && (
              <Alert type="success" onClose={() => setResults({ ...results, absorb: null })}>
                {results.absorb.success}
              </Alert>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  const getColorClasses = (color, isActive) => {
    const colors = {
      blue: isActive ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-blue-50 text-gray-700',
      yellow: isActive ? 'bg-yellow-50 border-yellow-500 text-yellow-700' : 'hover:bg-yellow-50 text-gray-700',
      purple: isActive ? 'bg-purple-50 border-purple-500 text-purple-700' : 'hover:bg-purple-50 text-gray-700',
      orange: isActive ? 'bg-orange-50 border-orange-500 text-orange-700' : 'hover:bg-orange-50 text-gray-700',
      red: isActive ? 'bg-red-50 border-red-500 text-red-700' : 'hover:bg-red-50 text-gray-700',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full lg:w-72 lg:flex-shrink-0">
        <Card className="lg:sticky lg:top-6">
          <CardHeader>
            <h2 className="text-lg font-semibold">Специальные операции</h2>
            <p className="text-sm text-gray-500 mt-1">Выберите операцию</p>
          </CardHeader>
          <CardBody className="p-2">
            <nav className="flex flex-col gap-2 sm:grid sm:grid-cols-2 sm:gap-2 lg:flex lg:flex-col">
              {OPERATIONS.map((op) => {
                const Icon = op.icon;
                const isActive = selectedOp === op.id;
                return (
                  <button
                    key={op.id}
                    onClick={() => setSelectedOp(op.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all cursor-pointer
                      ${isActive ? 'border-l-4' : 'border-transparent'}
                      ${getColorClasses(op.color, isActive)}`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium text-left">{op.name}</span>
                  </button>
                );
              })}
            </nav>
          </CardBody>
        </Card>
      </aside>

      <div className="flex-1 min-w-0 max-w-3xl">
        {renderOperationContent()}
      </div>
    </div>
  );
}
