import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import CreateServicePage from './pages/CreateServicePage';
import EditServicePage from './pages/EditServicePage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProfilePage from './pages/ProfilePage';
import UserProfilePage from './pages/UserProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import ChatPage from './pages/ChatPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';

function App() {
    const { checkAuth, isLoading } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Toaster position="top-right" />
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Protected routes */}
                    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/services" element={<ServicesPage />} />
                        <Route path="/services/:id" element={<ServiceDetailPage />} />
                        <Route path="/services/:id/edit" element={<EditServicePage />} />
                        <Route path="/services/create" element={<CreateServicePage />} />
                        <Route path="/orders" element={<OrdersPage />} />
                        <Route path="/orders/:id" element={<OrderDetailPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/users/:id" element={<UserProfilePage />} />
                        <Route path="/messages" element={<ChatPage />} />
                    </Route>

                    {/* Admin routes */}
                    <Route
                        path="/admin/*"
                        element={
                            <AdminRoute>
                                <Layout />
                            </AdminRoute>
                        }
                    >
                        <Route index element={<AdminDashboard />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;
