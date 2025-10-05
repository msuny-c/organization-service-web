import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { organizationsApi, referencesApi } from '../lib/api';
import { ORGANIZATION_TYPES } from '../lib/constants';
import Button from '../components/Button';
import Card, { CardHeader, CardBody } from '../components/Card';
import Input, { Select } from '../components/Input';

export default function OrganizationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    fullName: '',
    employeesCount: 0,
    rating: 1,
    annualTurnover: '',
    type: '',
    coordinatesId: '',
    coordinates: { x: '', y: '' },
    postalAddressId: '',
    postalAddress: { zipCode: '', townId: '', town: { name: '', x: '', y: '', z: '' } },
    officialAddressId: '',
    officialAddress: { zipCode: '', townId: '', town: { name: '', x: '', y: '', z: '' } },
    reusePostalAddressAsOfficial: false,
  });

  const [errors, setErrors] = useState({});

  const { data: orgData, isLoading: isLoadingOrg } = useQuery({
    queryKey: ['organization', id],
    queryFn: () => organizationsApi.getById(id),
    enabled: isEdit,
  });

  useEffect(() => {
    if (isEdit && orgData?.data) {
      const org = orgData.data;
      setFormData({
        name: org.name || '',
        fullName: org.fullName || '',
        employeesCount: org.employeesCount || 0,
        rating: org.rating || 1,
        annualTurnover: org.annualTurnover || '',
        type: org.type || '',
        coordinatesId: org.coordinates?.id || '',
        coordinates: org.coordinates ? {
          x: org.coordinates.x ?? '',
          y: org.coordinates.y ?? ''
        } : { x: '', y: '' },
        postalAddressId: org.postalAddress?.id || '',
        postalAddress: org.postalAddress ? {
          zipCode: org.postalAddress.zipCode || '',
          townId: org.postalAddress.town?.id || '',
          town: org.postalAddress.town ? {
            name: org.postalAddress.town.name || '',
            x: org.postalAddress.town.x ?? '',
            y: org.postalAddress.town.y ?? '',
            z: org.postalAddress.town.z ?? ''
          } : { name: '', x: '', y: '', z: '' }
        } : { zipCode: '', townId: '', town: { name: '', x: '', y: '', z: '' } },
        officialAddressId: org.officialAddress?.id || '',
        officialAddress: org.officialAddress ? {
          zipCode: org.officialAddress.zipCode || '',
          townId: org.officialAddress.town?.id || '',
          town: org.officialAddress.town ? {
            name: org.officialAddress.town.name || '',
            x: org.officialAddress.town.x ?? '',
            y: org.officialAddress.town.y ?? '',
            z: org.officialAddress.town.z ?? ''
          } : { name: '', x: '', y: '', z: '' }
        } : { zipCode: '', townId: '', town: { name: '', x: '', y: '', z: '' } },
        reusePostalAddressAsOfficial: false,
      });
    }
  }, [isEdit, orgData]);

  const { data: coordinatesData } = useQuery({
    queryKey: ['coordinates'],
    queryFn: referencesApi.getCoordinates,
  });

  const { data: addressesData } = useQuery({
    queryKey: ['addresses'],
    queryFn: referencesApi.getAddresses,
  });

  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: referencesApi.getLocations,
  });


  const mutation = useMutation({
    mutationFn: (data) => isEdit ? organizationsApi.update(id, data) : organizationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      navigate('/');
    },
    onError: (error) => {
      alert('Ошибка: ' + (error.response?.data?.error || error.message));
    },
  });

  const validateField = (name, value, formDataContext) => {
    switch (name) {
      case 'name':
        return value.trim() === '' ? 'Название обязательно' : null;
      
      case 'employeesCount':
        if (value === '' || value === null || value === undefined) return null;
        if (isNaN(value) || !Number.isInteger(Number(value))) return 'Должно быть целым числом';
        return value < 0 ? 'Не может быть отрицательным' : null;
      
      case 'rating':
        if (value === '' || value === null || value === undefined) return 'Рейтинг обязателен';
        if (isNaN(value)) return 'Должно быть числом';
        return value < 1 ? 'Рейтинг должен быть не менее 1' : null;
      
      case 'annualTurnover':
        if (value === '' || value === null || value === undefined) return null;
        if (isNaN(value)) return 'Должно быть числом';
        return value < 1 ? 'Должен быть не менее 1' : null;
      
      case 'coordinates.x':
        if (!formDataContext.coordinatesId && value !== '' && value !== null && value !== undefined) {
          if (isNaN(value)) return 'Должно быть числом';
          return value > 882 ? 'X должен быть ≤ 882' : null;
        }
        return null;
      
      case 'coordinates.y':
        if (!formDataContext.coordinatesId && value !== '' && value !== null && value !== undefined) {
          if (isNaN(value)) return 'Должно быть числом';
          return value <= -540 ? 'Y должен быть > -540' : null;
        }
        return null;
      
      case 'postalAddress.town.x':
      case 'postalAddress.town.y':
      case 'postalAddress.town.z':
      case 'officialAddress.town.x':
      case 'officialAddress.town.y':
      case 'officialAddress.town.z':
        if (value !== '' && value !== null && value !== undefined) {
          if (isNaN(value)) return 'Должно быть числом';
        }
        return null;
      
      case 'postalAddress.zipCode':
        return !formDataContext.postalAddressId && value.length > 0 && value.length < 7 
          ? 'Минимум 7 символов' : null;
      
      case 'officialAddress.zipCode':
        return !formDataContext.reusePostalAddressAsOfficial && !formDataContext.officialAddressId && 
               value.length > 0 && value.length < 7 
          ? 'Минимум 7 символов' : null;
      
      default:
        return null;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let val;
    if (type === 'checkbox') {
      val = checked;
    } else if (type === 'number') {
      // Для числовых полей: если значение пустое или невалидное, оставляем как строку для валидации
      if (value === '') {
        val = '';
      } else if (isNaN(value) || value.trim() === '') {
        // Если введены буквы, не обновляем значение
        return;
      } else {
        val = Number(value);
      }
    } else {
      val = value;
    }
    
    let newFormData = { ...formData };
    
    if (name.includes('.')) {
      const [parent, child, grandchild] = name.split('.');
      if (grandchild) {
        newFormData = {
          ...newFormData,
          [parent]: {
            ...newFormData[parent],
            [child]: {
              ...newFormData[parent][child],
              [grandchild]: val
            }
          }
        };
      } else {
        newFormData = {
          ...newFormData,
          [parent]: {
            ...newFormData[parent],
            [child]: val
          }
        };
      }
    } else {
      newFormData = { ...newFormData, [name]: val };
    }
    
    setFormData(newFormData);
    
    // Валидация при изменении
    const error = validateField(name, val, newFormData);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  if (isEdit && isLoadingOrg) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Загрузка данных организации...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Редактирование организации' : 'Создание организации'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Основная информация</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Название"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
              />
              <Input
                label="Полное название"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Количество сотрудников"
                name="employeesCount"
                type="number"
                min="0"
                value={formData.employeesCount}
                onChange={handleChange}
                error={errors.employeesCount}
                required
              />
              <Input
                label="Рейтинг"
                name="rating"
                type="number"
                min="1"
                value={formData.rating}
                onChange={handleChange}
                error={errors.rating}
                required
              />
              <Input
                label="Годовой оборот"
                name="annualTurnover"
                type="number"
                min="1"
                value={formData.annualTurnover}
                onChange={handleChange}
                error={errors.annualTurnover}
              />
            </div>
            <Select
              label="Тип организации"
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="">Не указан</option>
              {Object.entries(ORGANIZATION_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Select>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Координаты</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Select
              label="Выбрать существующие"
              name="coordinatesId"
              value={formData.coordinatesId}
              onChange={handleChange}
            >
              <option value="">Создать новые...</option>
              {coordinatesData?.data?.map(coord => (
                <option key={coord.id} value={coord.id}>
                  X: {coord.x}, Y: {coord.y}
                </option>
              ))}
            </Select>
            {!formData.coordinatesId && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="X (≤ 882)"
                  name="coordinates.x"
                  type="number"
                  step="0.01"
                  max="882"
                  value={formData.coordinates.x}
                  onChange={handleChange}
                  error={errors['coordinates.x']}
                  required
                />
                <Input
                  label="Y (> -540)"
                  name="coordinates.y"
                  type="number"
                  min="-539"
                  value={formData.coordinates.y}
                  onChange={handleChange}
                  error={errors['coordinates.y']}
                  required
                />
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Почтовый адрес</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Select
              label="Выбрать существующий"
              name="postalAddressId"
              value={formData.postalAddressId}
              onChange={handleChange}
            >
              <option value="">Создать новый...</option>
              {addressesData?.data?.map(addr => (
                <option key={addr.id} value={addr.id}>
                  {addr.zipCode} - {addr.town?.name}
                </option>
              ))}
            </Select>
            {!formData.postalAddressId && (
              <>
                <Input
                  label="Почтовый индекс (≥ 7 символов)"
                  name="postalAddress.zipCode"
                  minLength="7"
                  value={formData.postalAddress.zipCode}
                  onChange={handleChange}
                  error={errors['postalAddress.zipCode']}
                  required
                />
                <Select
                  label="Город"
                  name="postalAddress.townId"
                  value={formData.postalAddress.townId}
                  onChange={handleChange}
                >
                  <option value="">Создать новый...</option>
                  {locationsData?.data?.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </Select>
                {!formData.postalAddress.townId && (
                  <>
                    <Input
                      label="Название города"
                      name="postalAddress.town.name"
                      value={formData.postalAddress.town.name}
                      onChange={handleChange}
                      required
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <Input
                        label="X"
                        name="postalAddress.town.x"
                        type="number"
                        value={formData.postalAddress.town.x}
                        onChange={handleChange}
                        error={errors['postalAddress.town.x']}
                        required
                      />
                      <Input
                        label="Y"
                        name="postalAddress.town.y"
                        type="number"
                        value={formData.postalAddress.town.y}
                        onChange={handleChange}
                        error={errors['postalAddress.town.y']}
                        required
                      />
                      <Input
                        label="Z"
                        name="postalAddress.town.z"
                        type="number"
                        step="0.01"
                        value={formData.postalAddress.town.z}
                        onChange={handleChange}
                        error={errors['postalAddress.town.z']}
                        required
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Официальный адрес</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="reusePostalAddressAsOfficial"
                checked={formData.reusePostalAddressAsOfficial}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700">Использовать тот же, что и почтовый</span>
            </label>

            {!formData.reusePostalAddressAsOfficial && (
              <>
                <Select
                  label="Выбрать существующий"
                  name="officialAddressId"
                  value={formData.officialAddressId}
                  onChange={handleChange}
                >
                  <option value="">Создать новый...</option>
                  {addressesData?.data?.map(addr => (
                    <option key={addr.id} value={addr.id}>
                      {addr.zipCode} - {addr.town?.name}
                    </option>
                  ))}
                </Select>
                {!formData.officialAddressId && (
                  <>
                    <Input
                      label="Почтовый индекс (≥ 7 символов)"
                      name="officialAddress.zipCode"
                      minLength="7"
                      value={formData.officialAddress.zipCode}
                      onChange={handleChange}
                      error={errors['officialAddress.zipCode']}
                      required
                    />
                    <Select
                      label="Город"
                      name="officialAddress.townId"
                      value={formData.officialAddress.townId}
                      onChange={handleChange}
                    >
                      <option value="">Создать новый...</option>
                      {locationsData?.data?.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </Select>
                    {!formData.officialAddress.townId && (
                      <>
                        <Input
                          label="Название города"
                          name="officialAddress.town.name"
                          value={formData.officialAddress.town.name}
                          onChange={handleChange}
                          required
                        />
                        <div className="grid grid-cols-3 gap-4">
                          <Input
                            label="X"
                            name="officialAddress.town.x"
                            type="number"
                            value={formData.officialAddress.town.x}
                            onChange={handleChange}
                            error={errors['officialAddress.town.x']}
                            required
                          />
                          <Input
                            label="Y"
                            name="officialAddress.town.y"
                            type="number"
                            value={formData.officialAddress.town.y}
                            onChange={handleChange}
                            error={errors['officialAddress.town.y']}
                            required
                          />
                          <Input
                            label="Z"
                            name="officialAddress.town.z"
                            type="number"
                            step="0.01"
                            value={formData.officialAddress.town.z}
                            onChange={handleChange}
                            error={errors['officialAddress.town.z']}
                            required
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </CardBody>
        </Card>

        <div className="flex justify-end gap-4">
          <Link to="/">
            <Button variant="outline">Отмена</Button>
          </Link>
          <Button type="submit" disabled={mutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {isEdit ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </form>
    </div>
  );
}

