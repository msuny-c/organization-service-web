import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { addressesApi, locationsApi } from '../lib/api';
import Button from '../components/Button';
import Card, { CardBody, CardHeader } from '../components/Card';
import Input, { Select } from '../components/Input';
import Alert from '../components/Alert';

export default function AddressForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({ zipCode: '', townId: '' });
  const [error, setError] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['address', id],
    queryFn: () => addressesApi.getById(id),
    enabled: isEdit,
    retry: false,
  });

  const locationsQuery = useQuery({
    queryKey: ['locations-for-address-form'],
    queryFn: () => locationsApi.getAll({ page: 0, size: 1000 }),
    retry: false,
  });

  useEffect(() => {
    if (isEdit && data?.data) {
      setFormData({
        zipCode: data.data.zipCode || '',
        townId: data.data.townId || data.data.town?.id || '',
      });
    }
  }, [isEdit, data]);

  const mutation = useMutation({
    mutationFn: (payload) => (isEdit ? addressesApi.update(id, payload) : addressesApi.create(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses-list'] });
      navigate('/addresses');
    },
    onError: (e) => {
      setError(e?.response?.data?.error || e?.message || 'Ошибка сохранения');
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.zipCode && formData.zipCode.length > 0 && formData.zipCode.length < 7) {
      setError('Почтовый индекс должен содержать минимум 7 символов');
      return;
    }
    const townId = formData.townId ? Number(formData.townId) : null;
    if (!townId) {
      setError('Город обязателен');
      return;
    }
    mutation.mutate({
      zipCode: formData.zipCode || null,
      townId,
    });
  };

  if (isEdit && isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const locations = Array.isArray(locationsQuery.data?.data?.content) ? locationsQuery.data.data.content : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link to="/addresses" className="block w-full sm:inline-block sm:w-auto">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
        </Link>
        <h1 className="text-center text-3xl font-bold text-gray-900 sm:text-left">
          {isEdit ? 'Редактирование адреса' : 'Создание адреса'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Данные адреса</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Почтовый индекс (≥ 7 символов)"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
            />
            <Select
              label="Город"
              name="townId"
              value={formData.townId}
              onChange={handleChange}
              required
            >
              <option value="">Выберите город...</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>ID: {l.id} - {l.name}</option>
              ))}
            </Select>
          </CardBody>
        </Card>

        {error && <Alert type="error">{error}</Alert>}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="submit"
            disabled={mutation.isPending || locationsQuery.isLoading}
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
