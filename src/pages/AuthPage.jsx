import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, UserPlus, LogIn } from 'lucide-react';
import Card, { CardBody, CardHeader } from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { useAuth } from '../context/AuthContext';

export default function AuthPage({ mode = 'login' }) {
  const isLogin = mode === 'login';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isLogin) {
        await login({ username, password });
      } else {
        await register({ username, password });
      }
      const redirect = location.state?.from?.pathname || '/';
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Ошибка авторизации');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                {isLogin ? <LogIn className="h-6 w-6 text-blue-600" /> : <UserPlus className="h-6 w-6 text-blue-600" />}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isLogin ? 'Вход в систему' : 'Регистрация'}
                </h1>
                <p className="text-sm text-gray-500">
                  {isLogin
                    ? 'Введите учетные данные для доступа'
                    : 'Создайте учетную запись для работы'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {error && (
              <Alert type="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Имя пользователя"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="student"
              />
              <Input
                label="Пароль"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
              <Button type="submit" className="w-full">
                <Lock className="h-4 w-4 mr-2" />
                {isLogin ? 'Войти' : 'Зарегистрироваться'}
              </Button>
            </form>
            <div className="text-sm text-gray-600 text-center">
              {isLogin ? (
                <>
                  Нет аккаунта?{' '}
                  <button
                    type="button"
                    className="text-blue-600 hover:underline"
                    onClick={() => navigate('/register')}
                  >
                    Регистрация
                  </button>
                </>
              ) : (
                <>
                  Уже есть аккаунт?{' '}
                  <button
                    type="button"
                    className="text-blue-600 hover:underline"
                    onClick={() => navigate('/login')}
                  >
                    Войти
                  </button>
                </>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
