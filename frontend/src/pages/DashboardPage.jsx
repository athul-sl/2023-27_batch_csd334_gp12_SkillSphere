import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, DollarSign, Star, Package } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { servicesAPI, ordersAPI } from '../lib/api';
import toast from 'react-hot-toast';

export default function DashboardPage() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState(null);
    const [recentServices, setRecentServices] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [servicesRes, ordersRes] = await Promise.all([
                servicesAPI.getMyServices({ page: 1, page_size: 3 }),
                ordersAPI.listOrders({ role: 'all', page: 1, page_size: 5 })
            ]);

            setRecentServices(servicesRes.data.items);
            setRecentOrders(ordersRes.data.items);

            // Calculate stats
            setStats({
                totalServices: servicesRes.data.total,
                totalOrders: ordersRes.data.total,
                earnings: user.total_earnings || 0,
                rating: user.average_rating || 0,
            });
        } catch (error) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.full_name}!</h1>
                    <p className="text-gray-600 mt-1">Here's what's happening with your account</p>
                </div>
                <Link to="/services/create" className="btn-primary">
                    <Plus size={20} className="inline mr-2" />
                    Create Service
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-6">
                <StatCard
                    icon={<Package className="text-primary-600" size={24} />}
                    title="My Services"
                    value={stats.totalServices}
                    color="bg-primary-50"
                />
                <StatCard
                    icon={<TrendingUp className="text-green-600" size={24} />}
                    title="Total Orders"
                    value={stats.totalOrders}
                    color="bg-green-50"
                />
                <StatCard
                    icon={<DollarSign className="text-yellow-600" size={24} />}
                    title="Total Earnings"
                    value={`₹${stats.earnings.toFixed(2)}`}
                    color="bg-yellow-50"
                />
                <StatCard
                    icon={<Star className="text-orange-600" size={24} />}
                    title="Average Rating"
                    value={stats.rating.toFixed(1)}
                    color="bg-orange-50"
                />
            </div>

            {/* Recent Services */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">My Services</h2>
                    <Link to="/services" className="text-primary-600 hover:text-primary-700 font-medium">
                        View All →
                    </Link>
                </div>
                {recentServices.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No services yet. Create your first service to get started!</p>
                ) : (
                    <div className="space-y-3">
                        {recentServices.map((service) => (
                            <Link
                                key={service.id}
                                to={`/services/${service.id}`}
                                className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{service.title}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{service.short_description}</p>
                                    </div>
                                    <span className={`badge ${service.status === 'approved' ? 'badge-success' :
                                        service.status === 'pending' ? 'badge-warning' :
                                            'badge-danger'
                                        }`}>
                                        {service.status === 'approved' ? 'Posted' : service.status}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                                    <span>₹{service.price}</span>
                                    <span>{service.order_count} orders</span>
                                    <span>⭐ {service.average_rating.toFixed(1)}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Orders */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                    <Link to="/orders" className="text-primary-600 hover:text-primary-700 font-medium">
                        View All →
                    </Link>
                </div>
                {recentOrders.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No orders yet.</p>
                ) : (
                    <div className="space-y-3">
                        {recentOrders.map((order) => (
                            <Link
                                key={order.id}
                                to={`/orders/${order.id}`}
                                className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{order.service?.title || order.service_title || 'Deleted Service'}</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {order.client_id === user.id ? 'Order placed' : 'Order received'} - ₹{order.agreed_price}
                                        </p>
                                    </div>
                                    <span className={`badge ${getOrderStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, title, value, color }) {
    return (
        <div className="card">
            <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
                {icon}
            </div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    );
}

function getOrderStatusColor(status) {
    const colors = {
        pending: 'badge-warning',
        accepted: 'badge-info',
        in_progress: 'badge-info',
        delivered: 'badge-warning',
        completed: 'badge-success',
        cancelled: 'badge-danger',
        rejected: 'badge-danger'
    };
    return colors[status] || 'badge-info';
}
