import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, UserPlus, LogIn } from 'lucide-react';
import Card, { CardBody, CardHeader } from './Card';
import Input from './Input';
import Button from './Button';
import Alert from './Alert';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ mode = 'login' }) {
  const isLogin = mode === 'login';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const backgroundLocation = location.state?.backgroundLocation || location.state?.from || { pathname: '/' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isLogin) {
        await login({ username, password });
      } else {
        await register({ username, password });
      }
      const fromLocation = location.state?.from || backgroundLocation;
      const redirectPath = fromLocation?.pathname || '/';
      const redirectSearch = fromLocation?.search || '';
      const redirectHash = fromLocation?.hash || '';
      navigate(`${redirectPath}${redirectSearch}${redirectHash}`, { replace: true, state: fromLocation?.state });
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Ошибка авторизации');
    }
  };

  const closeModal = () => {
    if (window.history.state && window.history.length > 1) {
      navigate(-1);
      return;
    }
    const targetPath = `${backgroundLocation?.pathname || '/'}${backgroundLocation?.search || ''}${backgroundLocation?.hash || ''}`;
    navigate(targetPath, { replace: true, state: backgroundLocation?.state });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
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
                  {isLogin ? 'Введите учетные данные' : 'Создайте учетную запись'}
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
            <div className="flex items-center justify-between text-sm text-gray-600">
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() =>
                  navigate(isLogin ? '/register' : '/login', {
                    state: {
                      backgroundLocation,
                      from: location.state?.from || backgroundLocation,
                      message: location.state?.message,
                    },
                  })
                }
              >
                {isLogin ? 'Создать аккаунт' : 'У меня уже есть аккаунт'}
              </button>
              <button
                type="button"
                className="text-gray-500 hover:underline"
                onClick={closeModal}
              >
                Закрыть
              </button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
