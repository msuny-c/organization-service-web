import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import OrganizationsList from './pages/OrganizationsList';
import OrganizationView from './pages/OrganizationView';
import OrganizationForm from './pages/OrganizationForm';
import Operations from './pages/Operations';
import CoordinatesList from './pages/CoordinatesList';
import AddressesList from './pages/AddressesList';
import LocationsList from './pages/LocationsList';
import CoordinateForm from './pages/CoordinateForm';
import AddressForm from './pages/AddressForm';
import LocationForm from './pages/LocationForm';
import ImportPage from './pages/ImportPage';

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
            <Route path="coordinates" element={<CoordinatesList />} />
            <Route path="coordinates/create" element={<CoordinateForm />} />
            <Route path="coordinates/:id/edit" element={<CoordinateForm />} />
            <Route path="addresses" element={<AddressesList />} />
            <Route path="addresses/create" element={<AddressForm />} />
            <Route path="addresses/:id/edit" element={<AddressForm />} />
            <Route path="locations" element={<LocationsList />} />
            <Route path="locations/create" element={<LocationForm />} />
            <Route path="locations/:id/edit" element={<LocationForm />} />
            <Route path="imports" element={<ImportPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  );
}

export default App;
