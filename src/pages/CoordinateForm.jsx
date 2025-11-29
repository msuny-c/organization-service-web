import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { coordinatesApi } from '../lib/api';
import Button from '../components/Button';
import Card, { CardBody, CardHeader } from '../components/Card';
import Input from '../components/Input';
import Alert from '../components/Alert';

export default function CoordinateForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({ x: '', y: '' });
  const [error, setError] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['coordinate', id],
    queryFn: () => coordinatesApi.getById(id),
    enabled: isEdit,
    retry: false,
  });

  useEffect(() => {
    if (isEdit && data?.data) {
      setFormData({
        x: data.data.x ?? '',
        y: data.data.y ?? '',
      });
    }
  }, [isEdit, data]);

  const mutation = useMutation({
    mutationFn: (payload) => (isEdit ? coordinatesApi.update(id, payload) : coordinatesApi.create(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coordinates-list'] });
      navigate('/coordinates');
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
    const x = Number(formData.x);
    const y = Number(formData.y);
    if (!Number.isInteger(x) || !Number.isInteger(y)) {
      setError('X и Y должны быть целыми числами');
      return;
    }
    mutation.mutate({ x, y });
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
        <Link to="/coordinates" className="block w-full sm:inline-block sm:w-auto">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
        </Link>
        <h1 className="text-center text-3xl font-bold text-gray-900 sm:text-left">
          {isEdit ? 'Редактирование координат' : 'Создание координат'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Значения</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
