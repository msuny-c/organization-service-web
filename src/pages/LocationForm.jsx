import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { locationsApi } from '../lib/api';
import Button from '../components/Button';
import Card, { CardBody, CardHeader } from '../components/Card';
import Input from '../components/Input';
import Alert from '../components/Alert';

export default function LocationForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({ name: '', x: '', y: '', z: '' });
  const [error, setError] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['location', id],
    queryFn: () => locationsApi.getById(id),
    enabled: isEdit,
    retry: false,
  });

  useEffect(() => {
    if (isEdit && data?.data) {
      setFormData({
        name: data.data.name || '',
        x: data.data.x ?? '',
        y: data.data.y ?? '',
        z: data.data.z ?? '',
      });
    }
  }, [isEdit, data]);

  const mutation = useMutation({
    mutationFn: (payload) => (isEdit ? locationsApi.update(id, payload) : locationsApi.create(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations-list'] });
      navigate('/locations');
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
    const name = (formData.name || '').trim();
    if (!name) {
      setError('Название обязательно');
      return;
    }
    const x = Number(formData.x);
    const y = Number(formData.y);
    const z = Number(formData.z);
    if (!Number.isInteger(x) || !Number.isInteger(y) || Number.isNaN(z)) {
      setError('X и Y должны быть целыми числами, Z — числом');
      return;
    }
    mutation.mutate({ name, x, y, z });
  };

  if (isEdit && isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link to="/locations" className="block w-full sm:inline-block sm:w-auto">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
        </Link>
        <h1 className="text-center text-3xl font-bold text-gray-900 sm:text-left">
          {isEdit ? 'Редактирование локации' : 'Создание локации'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Данные локации</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Название"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="X"
                name="x"
                type="number"
                step="1"
                value={formData.x}
                onChange={handleChange}
                required
              />
              <Input
                label="Y"
                name="y"
                type="number"
                step="1"
                value={formData.y}
                onChange={handleChange}
                required
              />
              <Input
                label="Z"
                name="z"
                type="number"
                step="0.01"
                value={formData.z}
                onChange={handleChange}
                required
              />
            </div>
          </CardBody>
        </Card>

        {error && <Alert type="error">{error}</Alert>}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
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
