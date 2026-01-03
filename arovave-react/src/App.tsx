import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, LanguageProvider, EnquiryProvider } from './context';
import { Layout, ScrollToTop } from './components/layout';
import { Home, Catalog, ProductDetail, Profile, Admin, Enquiries, TrustPage, TrustManufacturer, TrustPricing, TrustExperience, AuthPage, About, PrivacyTerms, Support } from './pages';
import { TestProducts } from './pages/TestProducts';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <EnquiryProvider>
            <ScrollToTop />
            <Routes>
              {/* Full-screen Auth Page - Outside Layout */}
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/signup" element={<AuthPage />} />

              {/* Routes with Layout (Header/Footer) */}
              <Route element={<Layout><Home /></Layout>} path="/" />
              <Route element={<Layout><Catalog /></Layout>} path="/catalog" />
              <Route element={<Layout><ProductDetail /></Layout>} path="/product/:id" />
              <Route element={<Layout><Enquiries /></Layout>} path="/enquiries" />
              <Route element={<Layout><TrustPage /></Layout>} path="/trust/:section" />
              <Route element={<Layout><TrustManufacturer /></Layout>} path="/trust/manufacturer" />
              <Route element={<Layout><TrustPricing /></Layout>} path="/trust/pricing" />
              <Route element={<Layout><TrustExperience /></Layout>} path="/trust/experience" />
              <Route element={<Layout><About /></Layout>} path="/about" />
              <Route element={<Layout><PrivacyTerms /></Layout>} path="/privacy" />
              <Route element={<Layout><Support /></Layout>} path="/support" />
              <Route element={<TestProducts />} path="/test" />
              <Route element={<Layout><Profile /></Layout>} path="/profile" />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Layout><Admin /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
          </EnquiryProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

