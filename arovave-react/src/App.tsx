import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, LanguageProvider, EnquiryProvider } from './context';
import { Layout, ScrollToTop } from './components/layout';
import { Home, Catalog, ProductDetail, Profile, Admin, Enquiries, TrustPage } from './pages';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <EnquiryProvider>
            <ScrollToTop />
            <Layout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/enquiries" element={<Enquiries />} />
                <Route path="/trust/:section" element={<TrustPage />} />

                {/* Protected Routes */}
                <Route path="/profile" element={<Profile />} />

                {/* Admin Routes - Direct access for development */}
                <Route path="/admin/dashboard" element={<Admin />} />
                {/* Redirect old /admin to new path */}
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </Layout>
          </EnquiryProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
