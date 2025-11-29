import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Building2, Menu, Settings, X } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Список' },
  { to: '/coordinates', label: 'Координаты' },
  { to: '/addresses', label: 'Адреса' },
  { to: '/locations', label: 'Локации' },
  { to: '/operations', label: 'Операции', icon: Settings },
];

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="flex items-center gap-2 px-2 text-gray-900 font-semibold"
              onClick={closeMobileMenu}
            >
              <Building2 className="h-6 w-6" />
              <span className="text-base sm:text-lg">Управление организациями</span>
            </Link>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex sm:space-x-8">
                {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="inline-flex items-center gap-1 px-1 pt-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {label}
                  </Link>
                ))}
              </div>

              <button
                type="button"
                className="sm:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={toggleMobileMenu}
                aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200">
            <div className="space-y-1 px-4 py-3">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {Icon && <Icon className="h-4 w-4 text-gray-500" />}
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2025 Система управления организациями
          </p>
        </div>
      </footer>
    </div>
  );
}
