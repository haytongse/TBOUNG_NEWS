import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { LanguageProvider } from './contexts/LanguageContext'
import ProtectedRoute from './components/ProtectedRoute'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import PostDetail from './pages/PostDetail'
import Admin from './pages/Admin'
import Contact from './pages/Contact'
import Login from './pages/Login'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
        <SettingsProvider>
          <Routes>
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/admin" element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="*" element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <div className="flex-1">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/post/:id" element={<PostDetail />} />
                    <Route path="/contact" element={<Contact />} />
                  </Routes>
                </div>
                <Footer />
                <ScrollToTop />
              </div>
            } />
          </Routes>
        </SettingsProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
