import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { PurchaseOrder } from './pages/PurchaseOrder';
import { SalesOrder } from './pages/SalesOrder';
import { Reports } from './pages/Reports';
import { Categories } from './pages/Categories';
import { Brands } from './pages/Brands';
import { Suppliers } from './pages/Suppliers';

function App(): React.JSX.Element {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="purchase-orders" element={<PurchaseOrder />} />
          <Route path="sales-orders" element={<SalesOrder />} />
          <Route path="categories" element={<Categories />} />
          <Route path="brands" element={<Brands />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
