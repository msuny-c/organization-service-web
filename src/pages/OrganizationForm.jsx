import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { organizationsApi, referencesApi } from '../lib/api';
import { ORGANIZATION_TYPES } from '../lib/constants';
import { useWebSocket } from '../hooks/useWebSocket';
import Button from '../components/Button';
import Card, { CardHeader, CardBody } from '../components/Card';
import Input, { Select } from '../components/Input';
import Alert from '../components/Alert';

export default function OrganizationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    fullName: '',
    employeesCount: '',
    rating: '',
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
  const [submitError, setSubmitError] = useState(null);
  const [hadOrgData, setHadOrgData] = useState(false);
  const [hasInitializedForm, setHasInitializedForm] = useState(false);

  const scrollToField = (field) => {
    if (!field || typeof document === 'undefined') return;
    const escaped = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(field) : field.replace(/"/g, '\\"');
    const target = document.querySelector(`[name="${escaped}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof target.focus === 'function') {
        target.focus();
      }
    }
  };

  const getErrorMessage = (error, fallback = 'Неизвестная ошибка') => {
    if (error?.response?.status === 404) {
      return 'Организация не найдена';
    }
    return error?.response?.data?.error || error?.message || fallback;
  };

  const {
    data: orgData,
    isLoading: isLoadingOrg,
    isError: isOrgError,
    error: orgError,
    refetch: refetchOrg,
    isFetching: isRefetchingOrg,
  } = useQuery({
    queryKey: ['organization', id],
    queryFn: () => organizationsApi.getById(id),
    enabled: isEdit,
    retry: false,
    staleTime: 0,
  });

  useWebSocket('/topic/organizations', () => {
    if (isEdit && id) {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.refetchQueries({ queryKey: ['organization', id] });
      queryClient.refetchQueries();
    }
  });

  useEffect(() => {
    setHadOrgData(false);
    setHasInitializedForm(false);
    setErrors({});
    setSubmitError(null);
    
    if (isEdit && id) {
      queryClient.invalidateQueries({ queryKey: ['organization', id] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      queryClient.invalidateQueries({ queryKey: ['coordinates'] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    }
  }, [id, isEdit, queryClient]);

  useEffect(() => {
    if (isEdit && orgData?.data && String(orgData.data.id) === String(id)) {
      setHadOrgData(true);
      if (hasInitializedForm) return;
      const org = orgData.data;
      const reusePostalAddressAsOfficial =
        org.reusePostalAddressAsOfficial ?? (
          org.postalAddress?.id && org.officialAddress?.id
            ? org.postalAddress.id === org.officialAddress.id
            : false
        );
      const nextFormData = {
        name: org.name || '',
        fullName: org.fullName || '',
        employeesCount: org.employeesCount ?? '',
        rating: org.rating ?? '',
        annualTurnover: org.annualTurnover ?? '',
        type: org.type || '',
        coordinatesId: org.coordinates?.id ? String(org.coordinates.id) : '',
        coordinates: org.coordinates ? {
          x: org.coordinates.x ?? '',
          y: org.coordinates.y ?? ''
        } : { x: '', y: '' },
        postalAddressId: org.postalAddress?.id ? String(org.postalAddress.id) : '',
        postalAddress: org.postalAddress ? {
          zipCode: org.postalAddress.zipCode || '',
          townId: org.postalAddress.town?.id ? String(org.postalAddress.town.id) : '',
          town: org.postalAddress.town ? {
            name: org.postalAddress.town.name || '',
            x: org.postalAddress.town.x ?? '',
            y: org.postalAddress.town.y ?? '',
            z: org.postalAddress.town.z ?? ''
          } : { name: '', x: '', y: '', z: '' }
        } : { zipCode: '', townId: '', town: { name: '', x: '', y: '', z: '' } },
        officialAddressId: org.officialAddress?.id ? String(org.officialAddress.id) : '',
        officialAddress: org.officialAddress ? {
          zipCode: org.officialAddress.zipCode || '',
          townId: org.officialAddress.town?.id ? String(org.officialAddress.town.id) : '',
          town: org.officialAddress.town ? {
            name: org.officialAddress.town.name || '',
            x: org.officialAddress.town.x ?? '',
            y: org.officialAddress.town.y ?? '',
            z: org.officialAddress.town.z ?? ''
          } : { name: '', x: '', y: '', z: '' }
        } : { zipCode: '', townId: '', town: { name: '', x: '', y: '', z: '' } },
        reusePostalAddressAsOfficial,
      };
      setFormData(nextFormData);
      setHasInitializedForm(true);
    }
  }, [hasInitializedForm, id, isEdit, orgData]);

  useEffect(() => {
    if (isEdit && isOrgError && orgError?.response?.status === 404 && hadOrgData) {
      navigate('/', {
        replace: true,
        state: {
          removedOrganizationNotice: 'Организация была удалена другим пользователем. Редактирование недоступно.',
        },
      });
    }
  }, [hadOrgData, isEdit, isOrgError, navigate, orgError]);

  const {
    data: coordinatesData,
    isError: isCoordinatesError,
    error: coordinatesError,
    isFetching: isFetchingCoordinates,
    refetch: refetchCoordinates,
  } = useQuery({
    queryKey: ['coordinates'],
    queryFn: referencesApi.getCoordinates,
    retry: false,
  });

  const {
    data: addressesData,
    isError: isAddressesError,
    error: addressesError,
    isFetching: isFetchingAddresses,
    refetch: refetchAddresses,
  } = useQuery({
    queryKey: ['addresses'],
    queryFn: referencesApi.getAddresses,
    retry: false,
  });

  const {
    data: locationsData,
    isError: isLocationsError,
    error: locationsError,
    isFetching: isFetchingLocations,
    refetch: refetchLocations,
  } = useQuery({
    queryKey: ['locations'],
    queryFn: referencesApi.getLocations,
    retry: false,
  });


  const mutation = useMutation({
    mutationFn: (data) => isEdit ? organizationsApi.update(id, data) : organizationsApi.create(data),
    onSuccess: () => {
      setSubmitError(null);
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      navigate('/');
    },
    onError: (error) => {
      setSubmitError(getErrorMessage(error, 'Не удалось сохранить организацию'));
    },
  });

  const validateField = (name, value, formDataContext) => {
    switch (name) {
      case 'name':
        return value.trim() === '' ? 'Название обязательно' : null;
      
      case 'fullName':
        return value && value.trim() === '' ? 'Полное название не может состоять только из пробелов' : null;
      
      case 'type':
        return value === '' ? 'Тип обязателен' : null;
      
      case 'employeesCount':
        if (value === '' || value === null || value === undefined) return 'Количество сотрудников обязательно';
        if (isNaN(value) || !Number.isInteger(Number(value))) return 'Должно быть целым числом';
        return Number(value) < 0 ? 'Не может быть отрицательным' : null;
      
      case 'rating':
        if (value === '' || value === null || value === undefined) return null;
        if (isNaN(value)) return 'Должно быть числом';
        return Number(value) <= 0 ? 'Рейтинг должен быть больше 0' : null;
      
      case 'annualTurnover':
        if (value === '' || value === null || value === undefined) return null;
        if (isNaN(value)) return 'Должно быть числом';
        return Number(value) <= 0 ? 'Должен быть больше 0' : null;
      
      case 'coordinates.x':
        if (!formDataContext.coordinatesId) {
          if (value === '' || value === null || value === undefined) return 'X обязателен';
          if (isNaN(value) || !Number.isInteger(Number(value))) return 'Должно быть целым числом';
        }
        return null;
      
      case 'coordinates.y':
        if (!formDataContext.coordinatesId) {
          if (value === '' || value === null || value === undefined) return 'Y обязателен';
          if (isNaN(value) || !Number.isInteger(Number(value))) return 'Должно быть целым числом';
        }
        return null;
      
      case 'postalAddress.town.x':
      case 'postalAddress.town.y':
        if (value === '' || value === null || value === undefined) return null;
        if (isNaN(value)) return 'Должно быть числом';
        return Number.isInteger(Number(value)) ? null : 'Должно быть целым числом';
      
      case 'officialAddress.town.x':
      case 'officialAddress.town.y': {
        const shouldValidate = !formDataContext.reusePostalAddressAsOfficial && 
                               (!formDataContext.officialAddressId || formDataContext.officialAddressId === 'create') &&
                               (!formDataContext.officialAddress.townId || formDataContext.officialAddress.townId === '');
        if (!shouldValidate) {
          return null;
        }
        if (value === '' || value === null || value === undefined) return 'Поле обязательно';
        if (isNaN(value)) return 'Должно быть числом';
        return Number.isInteger(Number(value)) ? null : 'Должно быть целым числом';
      }
      
      case 'postalAddress.town.z':
        if (value === '' || value === null || value === undefined) return null;
        return isNaN(value) ? 'Должно быть числом' : null;
      
      case 'officialAddress.town.z': {
        const shouldValidate = !formDataContext.reusePostalAddressAsOfficial && 
                               (!formDataContext.officialAddressId || formDataContext.officialAddressId === 'create') &&
                               (!formDataContext.officialAddress.townId || formDataContext.officialAddress.townId === '');
        if (!shouldValidate) {
          return null;
        }
        if (value === '' || value === null || value === undefined) return 'Поле обязательно';
        return isNaN(value) ? 'Должно быть числом' : null;
      }
      
      case 'postalAddress.town.name': {
        const requiresManualTown = (!formDataContext.postalAddressId || formDataContext.postalAddressId === '') && 
                                   (!formDataContext.postalAddress.townId || formDataContext.postalAddress.townId === '');
        if (!requiresManualTown) {
          return null;
        }
        if (value === '' || value === null || value === undefined) {
          return 'Название города обязательно';
        }
        return value.trim() === '' ? 'Название города обязательно' : null;
      }

      case 'officialAddress.town.name': {
        const requiresManualTown = (!formDataContext.reusePostalAddressAsOfficial && !formDataContext.officialAddressId) ||
                                   (formDataContext.officialAddressId === 'create' && 
                                    (!formDataContext.officialAddress.townId || formDataContext.officialAddress.townId === ''));
        if (!requiresManualTown) {
          return null;
        }
        if (value === '' || value === null || value === undefined) {
          return 'Название города обязательно';
        }
        return value.trim() === '' ? 'Название города обязательно' : null;
      }
      
      case 'postalAddress.zipCode':
        if (formDataContext.postalAddressId) return null;
        return value && value.length > 0 && value.length < 7 
          ? 'Минимум 7 символов' : null;
      
      case 'officialAddress.zipCode': {
        const shouldValidate = !formDataContext.reusePostalAddressAsOfficial && 
                               (!formDataContext.officialAddressId || formDataContext.officialAddressId === 'create');
        if (!shouldValidate) return null;
        return value && value.length > 0 && value.length < 7 
          ? 'Минимум 7 символов' : null;
      }
      
      default:
        return null;
    }
  };

  const createFieldError = (field, message) => {
    const error = new Error(message);
    error.field = field;
    return error;
  };

  const normalizeNumber = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  };

  const normalizeString = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const trimmed = String(value).trim();
    return trimmed === '' ? null : trimmed;
  };

  const buildLocationPayload = (location, prefix) => {
    if (!location) {
      throw createFieldError(`${prefix}.town.name`, 'Необходимо указать город');
    }
    
    const name = normalizeString(location.name);
    if (name === null) {
      throw createFieldError(`${prefix}.town.name`, 'Название не может быть пустым');
    }
    
    const x = normalizeNumber(location.x);
    if (x === null) {
      throw createFieldError(`${prefix}.town.x`, 'X обязателен');
    }
    if (!Number.isInteger(x)) {
      throw createFieldError(`${prefix}.town.x`, 'Должно быть целым числом');
    }
    
    const y = normalizeNumber(location.y);
    if (y === null) {
      throw createFieldError(`${prefix}.town.y`, 'Y обязателен');
    }
    if (!Number.isInteger(y)) {
      throw createFieldError(`${prefix}.town.y`, 'Должно быть целым числом');
    }
    
    const z = normalizeNumber(location.z);
    if (z === null) {
      throw createFieldError(`${prefix}.town.z`, 'Z обязателен');
    }
    
    return { name, x, y, z };
  };

  const buildAddressPayload = (address, prefix) => {
    if (!address) {
      throw createFieldError(`${prefix}.zipCode`, 'Необходимо указать адрес');
    }
    const zipCode = normalizeString(address.zipCode);
    const townId = normalizeNumber(address.townId);
    const payload = {};
    if (zipCode !== null) {
      payload.zipCode = zipCode;
    }
    if (townId !== null) {
      payload.townId = townId;
      return payload;
    }
    const townPayload = buildLocationPayload(address.town, prefix);
    payload.town = townPayload;
    return payload;
  };

  const getValueByPath = (data, path) => {
    return path.split('.').reduce((acc, key) => {
      if (acc === null || acc === undefined) {
        return undefined;
      }
      return acc[key];
    }, data);
  };

  const preparePayload = (data) => {
    const employeesCount = normalizeNumber(data.employeesCount);
    if (employeesCount === null) {
      throw createFieldError('employeesCount', 'Количество сотрудников обязательно');
    }
    if (!Number.isInteger(employeesCount)) {
      throw createFieldError('employeesCount', 'Количество сотрудников должно быть целым числом');
    }
    if (employeesCount < 0) {
      throw createFieldError('employeesCount', 'Количество сотрудников не может быть отрицательным');
    }

    const typeValue = data.type || null;
    if (!typeValue) {
      throw createFieldError('type', 'Тип организации обязателен');
    }

    const payload = {
      name: data.name.trim(),
      fullName: normalizeString(data.fullName),
      employeesCount,
      rating: normalizeNumber(data.rating),
      annualTurnover: normalizeNumber(data.annualTurnover),
      type: typeValue,
      coordinatesId: data.coordinatesId ? Number(data.coordinatesId) : null,
      coordinates: null,
      postalAddressId: data.postalAddressId ? Number(data.postalAddressId) : null,
      postalAddress: null,
      officialAddressId: data.reusePostalAddressAsOfficial ? null : (data.officialAddressId && data.officialAddressId !== '' ? data.officialAddressId : null),
      officialAddress: null,
      reusePostalAddressAsOfficial: data.reusePostalAddressAsOfficial,
    };

    const currentCoordsX = normalizeNumber(data.coordinates?.x);
    const currentCoordsY = normalizeNumber(data.coordinates?.y);

    if (!payload.coordinatesId) {
      const x = currentCoordsX;
      if (x === null) {
        throw createFieldError('coordinates.x', 'X обязателен');
      }
      if (!Number.isInteger(x)) {
        throw createFieldError('coordinates.x', 'Должно быть целым числом');
      }
      const y = currentCoordsY;
      if (y === null) {
        throw createFieldError('coordinates.y', 'Y обязателен');
      }
      if (!Number.isInteger(y)) {
        throw createFieldError('coordinates.y', 'Должно быть целым числом');
      }
      payload.coordinates = { x, y };
    }

    if (!payload.postalAddressId) {
      payload.postalAddress = buildAddressPayload(data.postalAddress, 'postalAddress');
    }

    if (payload.reusePostalAddressAsOfficial) {
      payload.officialAddressId = payload.postalAddressId;
      payload.officialAddress = null;
    } else if (payload.officialAddressId === 'create') {
      const officialAddressData = data.officialAddress || {};
      const hasOfficialData =
        normalizeString(officialAddressData.zipCode) !== null ||
        normalizeNumber(officialAddressData.townId) !== null ||
        normalizeString(officialAddressData.town?.name) !== null ||
        normalizeNumber(officialAddressData.town?.x) !== null ||
        normalizeNumber(officialAddressData.town?.y) !== null ||
        normalizeNumber(officialAddressData.town?.z) !== null;

      if (hasOfficialData) {
        payload.officialAddress = buildAddressPayload(officialAddressData, 'officialAddress');
        payload.officialAddressId = null;
      } else {
        payload.officialAddress = null;
        payload.officialAddressId = null;
      }
    } else if (payload.officialAddressId) {
      payload.officialAddress = null;
    } else {
      payload.officialAddress = null;
      payload.officialAddressId = null;
    }

    return payload;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const fieldsToValidate = [
      'name',
      'fullName',
      'type',
      'employeesCount',
      'rating',
      'annualTurnover',
      'coordinates.x',
      'coordinates.y',
    ];

    if (!formData.postalAddressId || formData.postalAddressId === '') {
      fieldsToValidate.push('postalAddress.zipCode');
      
      if (!formData.postalAddress.townId || formData.postalAddress.townId === '') {
        fieldsToValidate.push(
          'postalAddress.townId',
          'postalAddress.town.name',
          'postalAddress.town.x',
          'postalAddress.town.y',
          'postalAddress.town.z'
        );
      }
    }

    if (!formData.reusePostalAddressAsOfficial && formData.officialAddressId === 'create') {
      fieldsToValidate.push('officialAddress.zipCode');
      
      if (!formData.officialAddress.townId || formData.officialAddress.townId === '') {
        fieldsToValidate.push(
          'officialAddress.townId',
          'officialAddress.town.name',
          'officialAddress.town.x',
          'officialAddress.town.y',
          'officialAddress.town.z'
        );
      }
    }

    const validationResults = {};
    fieldsToValidate.forEach((field) => {
      const value = getValueByPath(formData, field);
      const message = validateField(field, value, formData);
      if (message) {
        validationResults[field] = message;
      }
    });

    if (Object.keys(validationResults).length > 0) {
      setErrors((prev) => {
        const updated = { ...prev };
        fieldsToValidate.forEach((field) => {
          if (validationResults[field]) {
            updated[field] = validationResults[field];
          } else {
            delete updated[field];
          }
        });
        return updated;
      });
      const firstErrorField = fieldsToValidate.find((field) => validationResults[field]);
      setTimeout(() => scrollToField(firstErrorField), 0);
      return;
    }

    setErrors((prev) => {
      const updated = { ...prev };
      fieldsToValidate.forEach((field) => {
        delete updated[field];
      });
      return updated;
    });

    setSubmitError(null);

    try {
      const payload = preparePayload(formData);
      mutation.mutate(payload);
    } catch (err) {
      if (err?.field) {
        setErrors((prev) => ({ ...prev, [err.field]: err.message }));
      } else {
        setSubmitError(err.message || 'Неизвестная ошибка');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let val;
    if (type === 'checkbox') {
      val = checked;
    } else if (type === 'number') {
      if (value === '') {
        val = '';
      } else if (isNaN(value) || value.trim() === '') {
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
    setSubmitError(null);

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

  if (isEdit && isOrgError && orgError?.response?.status === 404 && hadOrgData) {
    return null;
  }

  if (isEdit && isOrgError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Link to="/" className="block w-full sm:inline-block sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Редактирование организации</h1>
        </div>

        <Alert type="error">
          Не удалось загрузить данные организации: {getErrorMessage(orgError, 'Попробуйте повторить попытку позже.')}
        </Alert>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => refetchOrg()} disabled={isRefetchingOrg} className="w-full sm:w-auto">
            {isRefetchingOrg ? 'Повторная попытка...' : 'Повторить запрос'}
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link to="/" className="block w-full sm:inline-block sm:w-auto">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
        </Link>
        <h1 className="text-center text-3xl font-bold text-gray-900 sm:text-left">
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
              />
              <Input
                label="Годовой оборот (в рублях)"
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
              error={errors.type}
              required
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
            {isCoordinatesError && (
              <Alert type="error">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Не удалось загрузить список координат: {getErrorMessage(coordinatesError, 'Попробуйте обновить страницу.')}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchCoordinates()}
                    disabled={isFetchingCoordinates}
                  >
                    {isFetchingCoordinates ? 'Повторная попытка...' : 'Повторить запрос'}
                  </Button>
                </div>
              </Alert>
            )}
            <Select
              label="Выбрать существующие"
              name="coordinatesId"
              value={formData.coordinatesId}
              onChange={handleChange}
            >
              <option value="">Создать новые...</option>
              {Array.isArray(coordinatesData?.data?.content) ? coordinatesData.data.content.map(coord => (
                <option key={coord.id} value={String(coord.id)}>
                  X: {coord.x}, Y: {coord.y}
                </option>
              )) : null}
            </Select>
            {!formData.coordinatesId && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="X"
                  name="coordinates.x"
                  type="number"
                  step="1"
                  value={formData.coordinates.x}
                  onChange={handleChange}
                  error={errors['coordinates.x']}
                  required
                />
                <Input
                  label="Y"
                  name="coordinates.y"
                  type="number"
                  step="1"
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
            {isAddressesError && (
              <Alert type="error">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Не удалось загрузить список адресов: {getErrorMessage(addressesError, 'Попробуйте повторить попытку позже.')}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchAddresses()}
                    disabled={isFetchingAddresses}
                  >
                    {isFetchingAddresses ? 'Повторная попытка...' : 'Повторить запрос'}
                  </Button>
                </div>
              </Alert>
            )}
            {isLocationsError && (
              <Alert type="error">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Не удалось загрузить список городов: {getErrorMessage(locationsError, 'Попробуйте обновить страницу.')}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchLocations()}
                    disabled={isFetchingLocations}
                  >
                    {isFetchingLocations ? 'Повторная попытка...' : 'Повторить запрос'}
                  </Button>
                </div>
              </Alert>
            )}
            <Select
              label="Выбрать существующий"
              name="postalAddressId"
              value={formData.postalAddressId}
              onChange={handleChange}
            >
              <option value="">Создать новый...</option>
              {Array.isArray(addressesData?.data?.content) ? addressesData.data.content.map(addr => (
                <option key={addr.id} value={String(addr.id)}>
                  {addr.zipCode} - {addr.town?.name}
                </option>
              )) : null}
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
                />
                <Select
                  label="Выбрать существующий"
                  name="postalAddress.townId"
                  value={formData.postalAddress.townId}
                  onChange={handleChange}
                >
                  <option value="">Создать новый...</option>
                  {Array.isArray(locationsData?.data?.content) ? locationsData.data.content.map(loc => (
                    <option key={loc.id} value={String(loc.id)}>{loc.name}</option>
                  )) : null}
                </Select>
                {!formData.postalAddress.townId && (
                  <>
                    <Input
                      label="Название города"
                      name="postalAddress.town.name"
                      value={formData.postalAddress.town.name}
                      onChange={handleChange}
                      error={errors['postalAddress.town.name']}
                      required
                    />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <Input
                        label="X"
                        name="postalAddress.town.x"
                        type="number"
                        step="1"
                        value={formData.postalAddress.town.x}
                        onChange={handleChange}
                        error={errors['postalAddress.town.x']}
                        required
                      />
                      <Input
                        label="Y"
                        name="postalAddress.town.y"
                        type="number"
                        step="1"
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
            {isAddressesError && !formData.reusePostalAddressAsOfficial && (
              <Alert type="error">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Не удалось загрузить список адресов: {getErrorMessage(addressesError, 'Попробуйте повторить попытку позже.')}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchAddresses()}
                    disabled={isFetchingAddresses}
                  >
                    {isFetchingAddresses ? 'Повторная попытка...' : 'Повторить запрос'}
                  </Button>
                </div>
              </Alert>
            )}
            {isLocationsError && !formData.reusePostalAddressAsOfficial && (
              <Alert type="error">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Не удалось загрузить список городов: {getErrorMessage(locationsError, 'Попробуйте обновить страницу.')}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchLocations()}
                    disabled={isFetchingLocations}
                  >
                    {isFetchingLocations ? 'Повторная попытка...' : 'Повторить запрос'}
                  </Button>
                </div>
              </Alert>
            )}
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
                  label="Официальный адрес"
                  name="officialAddressId"
                  value={formData.officialAddressId}
                  onChange={handleChange}
                >
                  <option value="">Не заполнено</option>
                  <option value="create">Создать новый...</option>
                  {Array.isArray(addressesData?.data?.content) && addressesData.data.content.map(addr => (
                  <option key={addr.id} value={String(addr.id)}>
                    {addr.zipCode} - {addr.town?.name}
                  </option>
                ))}
                </Select>
                {formData.officialAddressId === 'create' && (
                  <>
                    <Input
                      label="Почтовый индекс (≥ 7 символов)"
                      name="officialAddress.zipCode"
                      minLength="7"
                      value={formData.officialAddress.zipCode}
                      onChange={handleChange}
                      error={errors['officialAddress.zipCode']}
                    />
                    <Select
                      label="Город"
                      name="officialAddress.townId"
                      value={formData.officialAddress.townId}
                      onChange={handleChange}
                    >
                      <option value="">Создать новый...</option>
                      {Array.isArray(locationsData?.data?.content) ? locationsData.data.content.map(loc => (
                        <option key={loc.id} value={String(loc.id)}>{loc.name}</option>
                      )) : null}
                    </Select>
                    {!formData.officialAddress.townId && (
                      <>
                        <Input
                          label="Название города"
                          name="officialAddress.town.name"
                          value={formData.officialAddress.town.name}
                          onChange={handleChange}
                          error={errors['officialAddress.town.name']}
                          required
                        />
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <Input
                            label="X"
                            name="officialAddress.town.x"
                            type="number"
                            step="1"
                            value={formData.officialAddress.town.x}
                            onChange={handleChange}
                            error={errors['officialAddress.town.x']}
                            required
                          />
                          <Input
                            label="Y"
                            name="officialAddress.town.y"
                            type="number"
                            step="1"
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

        {submitError && (
          <p className="text-sm text-red-600 text-center sm:text-right">{submitError}</p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link to="/" className="block w-full sm:inline-block sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              Отмена
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full sm:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {isEdit ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </form>
    </div>
  );
}
