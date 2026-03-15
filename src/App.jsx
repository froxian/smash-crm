import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'

function Guard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--muted)', fontSize: 13 }}>Loading...</div>
  if (!user) return <Navigate to="/login" />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--muted)', fontSize: 13 }}>Loading...</div>

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<Guard><Layout><Customers /></Layout></Guard>} />
      <Route path="/customer/:id" element={<Guard><Layout><CustomerDetail /></Layout></Guard>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>
}
