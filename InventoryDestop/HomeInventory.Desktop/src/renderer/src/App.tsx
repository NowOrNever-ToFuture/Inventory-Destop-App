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

  if (checkingSetup)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
        Đang tải...
      </div>
    )
  if (!setupComplete) return <Navigate to="/setup" replace />
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App(): React.JSX.Element {
  const { checkingSetup, setupComplete } = useAuth()

  if (checkingSetup)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
        Đang tải...
      </div>
    )

  return (
    <HashRouter>
      <Routes>
        {/* Setup route - outside AppLayout */}
        {!setupComplete && <Route path="/setup" element={<Setup />} />}

        {/* Login route - outside AppLayout */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes - inside AppLayout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
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

        {/* Fallback redirect */}
        <Route
          path="*"
          element={
            setupComplete ? <Navigate to="/login" replace /> : <Navigate to="/setup" replace />
          }
        />
      </Routes>
    </HashRouter>
  )
}

export default App
