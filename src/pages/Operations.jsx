import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MapPin, BarChart3, Calculator, UserX, ArrowDownUp, TrendingUp } from 'lucide-react';
import { operationsApi } from '../lib/api';
import { ORGANIZATION_TYPES } from '../lib/constants';
import Button from '../components/Button';
import Card, { CardHeader, CardBody } from '../components/Card';
import Input, { Select } from '../components/Input';
import Alert from '../components/Alert';

const OPERATIONS = [
  { 
    id: 'minimal', 
    name: 'Минимальные координаты', 
    icon: MapPin, 
    color: 'blue',
    description: 'Найти организацию с минимальными координатами'
  },
  { 
    id: 'rating', 
    name: 'Группировка по рейтингу', 
    icon: TrendingUp, 
    color: 'yellow',
    description: 'Статистика по рейтингам организаций'
  },
  { 
    id: 'count', 
    name: 'Подсчет по типу', 
    icon: Calculator, 
    color: 'purple',
    description: 'Количество организаций определенного типа'
  },
  { 
    id: 'dismiss', 
    name: 'Увольнение сотрудников', 
    icon: UserX, 
    color: 'orange',
    description: 'Уволить всех сотрудников организации'
  },
  { 
    id: 'absorb', 
    name: 'Поглощение организации', 
    icon: ArrowDownUp, 
    color: 'red',
    description: 'Поглотить одну организацию другой'
  },
];

export default function Operations() {
  const [selectedOp, setSelectedOp] = useState('minimal');
  const [results, setResults] = useState({});
  const [errors, setErrors] = useState({});

  const clearError = (key) => {
    setErrors(prev => ({ ...prev, [key]: null }));
  };

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
      document.getElementById('dismissId').value = '';
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
      document.getElementById('absorbingId').value = '';
      document.getElementById('absorbedId').value = '';
    },
    onError: (error) => {
      setErrors({ ...errors, absorb: error.response?.data?.error || error.message });
    },
  });

  const renderOperationContent = () => {
    const operation = OPERATIONS.find(op => op.id === selectedOp);
    if (!operation) return null;

    const Icon = operation.icon;

    switch (selectedOp) {
      case 'minimal':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
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

            {errors.minimal && (
              <Alert type="error" onClose={() => clearError('minimal')}>
                {errors.minimal}
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
                </CardBody>
              </Card>
            )}
          </div>
        );

      case 'rating':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
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

            {errors.rating && (
              <Alert type="error" onClose={() => clearError('rating')}>
                {errors.rating}
              </Alert>
            )}

            {results.rating && !errors.rating && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardBody>
                  <h3 className="text-lg font-semibold text-yellow-900 mb-4">Статистика по рейтингам</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {Object.entries(results.rating).map(([rating, count]) => (
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

      case 'count':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{operation.name}</h2>
                    <p className="text-sm text-gray-500">{operation.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <Select id="typeSelect">
                  <option value="">Выберите тип...</option>
                  {Object.entries(ORGANIZATION_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </Select>
                <Button 
                  onClick={() => {
                    const type = document.getElementById('typeSelect').value;
                    if (type) countMutation.mutate(type);
                  }} 
                  disabled={countMutation.isPending}
                  className="w-full"
                >
                  Подсчитать
                </Button>
              </CardBody>
            </Card>

            {errors.count && (
              <Alert type="error" onClose={() => clearError('count')}>
                {errors.count}
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

      case 'dismiss':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{operation.name}</h2>
                    <p className="text-sm text-gray-500">{operation.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input 
                  id="dismissId" 
                  type="number"
                  label="ID организации"
                  placeholder="Введите ID"
                  min="1"
                />
                <Button 
                  variant="warning"
                  onClick={() => {
                    const id = document.getElementById('dismissId').value;
                    if (id) dismissMutation.mutate(id);
                  }} 
                  disabled={dismissMutation.isPending}
                  className="w-full"
                >
                  Уволить всех сотрудников
                </Button>
              </CardBody>
            </Card>

            {errors.dismiss && (
              <Alert type="error" onClose={() => clearError('dismiss')}>
                {errors.dismiss}
              </Alert>
            )}

            {results.dismiss?.success && !errors.dismiss && (
              <Alert type="success" onClose={() => setResults({ ...results, dismiss: null })}>
                {results.dismiss.success}
              </Alert>
            )}
          </div>
        );

      case 'absorb':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{operation.name}</h2>
                    <p className="text-sm text-gray-500">{operation.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    id="absorbingId" 
                    type="number"
                    label="Поглощающая организация"
                    placeholder="ID"
                    min="1"
                  />
                  <Input 
                    id="absorbedId" 
                    type="number"
                    label="Поглощаемая организация"
                    placeholder="ID"
                    min="1"
                  />
                </div>
                <Button 
                  variant="danger"
                  onClick={() => {
                    const absorbingId = document.getElementById('absorbingId').value;
                    const absorbedId = document.getElementById('absorbedId').value;
                    if (absorbingId && absorbedId) {
                      if (absorbingId === absorbedId) {
                        setErrors({ ...errors, absorb: 'Организация не может поглотить саму себя' });
                        return;
                      }
                      absorbMutation.mutate({ absorbingId, absorbedId });
                    }
                  }} 
                  disabled={absorbMutation.isPending}
                  className="w-full"
                >
                  Выполнить поглощение
                </Button>
              </CardBody>
            </Card>

            {errors.absorb && (
              <Alert type="error" onClose={() => clearError('absorb')}>
                {errors.absorb}
              </Alert>
            )}

            {results.absorb?.success && !errors.absorb && (
              <Alert type="success" onClose={() => setResults({ ...results, absorb: null })}>
                {results.absorb.success}
              </Alert>
            )}
          </div>
        );

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
    <div className="flex gap-6">
      <aside className="w-72 flex-shrink-0">
        <Card className="sticky top-6">
          <CardHeader>
            <h2 className="text-lg font-semibold">Специальные операции</h2>
            <p className="text-sm text-gray-500 mt-1">Выберите операцию</p>
          </CardHeader>
          <CardBody className="p-2">
            <nav className="space-y-1">
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
