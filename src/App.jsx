import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import OrganizationsList from './pages/OrganizationsList';
import OrganizationView from './pages/OrganizationView';
import OrganizationForm from './pages/OrganizationForm';
import Operations from './pages/Operations';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<OrganizationsList />} />
            <Route path="create" element={<OrganizationForm />} />
            <Route path="organizations/:id" element={<OrganizationView />} />
            <Route path="organizations/:id/edit" element={<OrganizationForm />} />
            <Route path="operations" element={<Operations />} />
          </Route>
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  );
}

export default App;
