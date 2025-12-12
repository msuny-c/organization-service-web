import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Building2, BarChart3, MapPin, Mail, FileText } from 'lucide-react';
import { organizationsApi } from '../lib/api';
import { getTypeName } from '../lib/constants';
import Button from '../components/Button';
import Card, { CardHeader, CardBody } from '../components/Card';
import Alert from '../components/Alert';
import { useAuth } from '../context/AuthContext';

const SECTIONS = [
  { id: 'main', name: 'Основная информация', icon: Building2, color: 'blue' },
  { id: 'metrics', name: 'Показатели', icon: BarChart3, color: 'green' },
  { id: 'coordinates', name: 'Координаты', icon: MapPin, color: 'purple' },
  { id: 'postal', name: 'Почтовый адрес', icon: Mail, color: 'orange' },
  { id: 'official', name: 'Официальный адрес', icon: FileText, color: 'red' },
];

export default function OrganizationView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedSection, setSelectedSection] = useState('main');
  const [hadOrgData, setHadOrgData] = useState(false);
  const { isAuthenticated } = useAuth();

  const getErrorMessage = (error, fallback = 'Неизвестная ошибка') => {
    if (error?.response?.status === 404) {
      return 'Организация не найдена';
    }
    return error?.response?.data?.error || error?.message || fallback;
  };

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['organization', id],
    queryFn: () => organizationsApi.getById(id),
    retry: false,
    refetchInterval: (query) => (query.state.status === 'success' ? 1000 : false),
    refetchIntervalInBackground: true,
  });

  const org = data?.data;

  useEffect(() => {
    setHadOrgData(false);
  }, [id]);

  useEffect(() => {
    if (org && String(org.id) === String(id)) {
      setHadOrgData(true);
    }
  }, [id, org]);

  useEffect(() => {
    if (isError && error?.response?.status === 404 && hadOrgData) {
      navigate('/', {
        replace: true,
        state: {
          removedOrganizationNotice: 'Организация была удалена. Мы вернули вас на главную.',
        },
      });
    }
  }, [error, hadOrgData, isError, navigate]);

  const handleDelete = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location, backgroundLocation: location, message: 'Авторизуйтесь, чтобы удалять организации' } });
      return;
    }
    if (window.confirm('Вы уверены, что хотите удалить эту организацию?')) {
      try {
        await organizationsApi.delete(id);
        navigate('/');
      } catch (error) {
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          navigate('/login', { state: { from: location, backgroundLocation: location, message: 'Сначала войдите в систему' } });
          return;
        }
        alert('Ошибка при удалении: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError && error?.response?.status === 404 && hadOrgData) {
    return null;
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Link to="/" className="block w-full sm:inline-block sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Карточка организации</h1>
        </div>

        <Alert type="error">
          Не удалось загрузить данные организации: {getErrorMessage(error, 'Попробуйте повторить попытку позже.')}
        </Alert>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => refetch()} disabled={isFetching} className="w-full sm:w-auto">
            {isFetching ? 'Повторная попытка...' : 'Повторить запрос'}
          </Button>
          <Link to="/" className="block w-full sm:inline-block sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              К списку
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!org) {
    return <div>Организация не найдена</div>;
  }

  const renderSection = () => {
    switch (selectedSection) {
      case 'main':
        return (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Основная информация</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <InfoRow label="ID" value={org.id} />
              <InfoRow label="Название" value={org.name} />
              <InfoRow label="Полное название" value={org.fullName || '—'} />
              <InfoRow label="Дата создания" value={new Date(org.creationDate).toLocaleDateString('ru-RU')} />
              <InfoRow label="Тип" value={getTypeName(org.type)} />
            </CardBody>
          </Card>
        );

      case 'metrics':
        return (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Показатели</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <InfoRow 
                label="Количество сотрудников" 
                value={<span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{org.employeesCount}</span>} 
              />
              <InfoRow 
                label="Рейтинг" 
                value={
                  org.rating != null
                    ? <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">{org.rating}</span>
                    : <span className="text-gray-500">—</span>
                }
              />
              <InfoRow label="Годовой оборот" value={org.annualTurnover ? `${org.annualTurnover} ₽` : '—'} />
            </CardBody>
          </Card>
        );

      case 'coordinates':
        return org.coordinates ? (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Координаты</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <InfoRow label="X" value={org.coordinates.x} />
              <InfoRow label="Y" value={org.coordinates.y} />
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody>
              <p className="text-gray-500 text-center py-4">Координаты не указаны</p>
            </CardBody>
          </Card>
        );

      case 'postal':
        return org.postalAddress ? (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Почтовый адрес</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <InfoRow label="Индекс" value={org.postalAddress.zipCode} />
              {org.postalAddress.town && (
                <>
                  <InfoRow label="Город" value={org.postalAddress.town.name} />
                  <InfoRow label="Координаты города" value={`X: ${org.postalAddress.town.x}, Y: ${org.postalAddress.town.y}, Z: ${org.postalAddress.town.z}`} />
                </>
              )}
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody>
              <p className="text-gray-500 text-center py-4">Почтовый адрес не указан</p>
            </CardBody>
          </Card>
        );

      case 'official':
        return org.officialAddress ? (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Официальный адрес</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <InfoRow label="Индекс" value={org.officialAddress.zipCode} />
              {org.officialAddress.town && (
                <>
                  <InfoRow label="Город" value={org.officialAddress.town.name} />
                  <InfoRow label="Координаты города" value={`X: ${org.officialAddress.town.x}, Y: ${org.officialAddress.town.y}, Z: ${org.officialAddress.town.z}`} />
                </>
              )}
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody>
              <p className="text-gray-500 text-center py-4">Официальный адрес не указан</p>
            </CardBody>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Link to="/" className="block w-full sm:inline-block sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
          </Link>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold text-gray-900">{org.name}</h1>
            {org.fullName && <p className="mt-1 text-sm text-gray-500">{org.fullName}</p>}
          </div>
        </div>

        {isAuthenticated && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
            <Link to={`/organizations/${id}/edit`} className="block w-full sm:inline-block sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">
                <Pencil className="h-4 w-4 mr-2" />
                Редактировать
              </Button>
            </Link>
            <Button
              variant="danger"
              onClick={handleDelete}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="w-full lg:w-64 lg:flex-shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 sm:gap-2 lg:flex lg:flex-col">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = selectedSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors cursor-pointer
                    ${isActive 
                      ? `bg-${section.color}-50 text-${section.color}-700 font-medium` 
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? `text-${section.color}-600` : 'text-gray-400'}`} />
                    <span className="text-sm">{section.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="flex-1 max-w-3xl">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 py-2 border-b border-gray-100 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-medium text-gray-500">{label}:</span>
      <span className="text-sm text-gray-900 text-left sm:text-right break-words">{value}</span>
    </div>
  );
}
