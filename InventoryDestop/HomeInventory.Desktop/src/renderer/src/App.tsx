import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { useAuth } from './components/shared/AuthProvider'
import { Dashboard } from './pages/Dashboard'
import { Products } from './pages/Products'
import { PurchaseOrder } from './pages/PurchaseOrder'
import { SalesOrder } from './pages/SalesOrder'
import { Reports } from './pages/Reports'
import { Categories } from './pages/Categories'
import { Brands } from './pages/Brands'
import { Suppliers } from './pages/Suppliers'
import { Settings } from './pages/Settings'
import { Login } from './pages/Login'
import { Setup } from './pages/Setup'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, checkingSetup, setupComplete } = useAuth()
  if (checkingSetup) return null
  if (!setupComplete) return <Navigate to="/setup" replace />
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App(): React.JSX.Element {
  const { checkingSetup, setupComplete, setupStatus } = useAuth()

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="size-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        <p className="text-gray-500 text-sm">{setupStatus || 'Dang tai...'}</p>
      </div>
    )
  }

  return (
    <HashRouter>
      <Routes>
        {!setupComplete && <Route path="/setup" element={<Setup />} />}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="purchase-orders" element={<PurchaseOrder />} />
          <Route path="sales-orders" element={<SalesOrder />} />
          <Route path="categories" element={<Categories />} />
          <Route path="brands" element={<Brands />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={setupComplete ? <Navigate to="/login" replace /> : <Navigate to="/setup" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default App
