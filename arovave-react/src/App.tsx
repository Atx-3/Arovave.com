import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, LanguageProvider, EnquiryProvider } from './context';
import { Layout, ScrollToTop } from './components/layout';
import { Home, Catalog, ProductDetail, Profile, Admin, Enquiries, TrustPage } from './pages';

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <EnquiryProvider>
            <ScrollToTop />
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/enquiries" element={<Enquiries />} />
                <Route path="/trust/:section" element={<TrustPage />} />
              </Routes>
            </Layout>
          </EnquiryProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
