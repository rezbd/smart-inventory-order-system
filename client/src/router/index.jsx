import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout       from '../components/layout/AppLayout';
import ProtectedRoute  from '../components/layout/ProtectedRoute';
import LoginPage       from '../features/auth/LoginPage';
import SignupPage      from '../features/auth/SignupPage';
import DashboardPage   from '../features/dashboard/DashboardPage';
import ProductsPage    from '../features/products/ProductsPage';
import CategoriesPage  from '../features/categories/CategoriesPage';
import OrdersPage      from '../features/orders/OrdersPage';
import OrderDetailPage from '../features/orders/OrderDetailPage';
import RestockQueuePage from '../features/inventory/RestockQueuePage';

export const router = createBrowserRouter([
  { path: '/login',  element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true,              element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard',        element: <DashboardPage /> },
      { path: 'products',         element: <ProductsPage /> },
      { path: 'categories',       element: <CategoriesPage /> },
      { path: 'orders',           element: <OrdersPage /> },
      { path: 'orders/:id',       element: <OrderDetailPage /> },
      { path: 'inventory/restock',element: <RestockQueuePage /> },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);