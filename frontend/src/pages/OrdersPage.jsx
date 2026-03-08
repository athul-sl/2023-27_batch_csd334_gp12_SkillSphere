import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function OrdersPage() {
    const { user } = useAuthStore();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadOrders();
    }, [filter]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const response = await ordersAPI.listOrders({
                role: filter,
                page: 1,
                page_size: 50
            });
            setOrders(response.data.items);
        } catch (error) {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">My Jobs</h1>
                <p className="text-gray-600 mt-1">Manage your orders and deliveries</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 font-medium transition-colors ${filter === 'all'
                        ? 'border-b-2 border-primary-600 text-primary-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    All Jobs
                </button>
                <button
                    onClick={() => setFilter('client')}
                    className={`px-4 py-2 font-medium transition-colors ${filter === 'client'
                        ? 'border-b-2 border-primary-600 text-primary-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    As Client
                </button>
                <button
                    onClick={() => setFilter('provider')}
                    className={`px-4 py-2 font-medium transition-colors ${filter === 'provider'
                        ? 'border-b-2 border-primary-600 text-primary-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    As Provider
                </button>
            </div>

            {/* Jobs List */}
            {orders.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-600 text-lg">No orders found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <OrderCard key={order.id} order={order} currentUserId={user.id} />
                    ))}
                </div>
            )}
        </div>
    );
}

function OrderCard({ order, currentUserId }) {
    const isClient = order.client_id === currentUserId;

    return (
        <Link
            to={`/orders/${order.id}`}
            className="card hover:shadow-lg transition-shadow"
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{order.service?.title || order.service_title || 'Deleted Service'}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Order #{order.order_number}
                    </p>
                    <p className="text-sm text-gray-600">
                        {isClient ? (
                            <>Provider: <Link to={`/users/${order.provider_id}`} className="font-medium text-primary-600 hover:underline" onClick={(e) => e.stopPropagation()}>{order.provider?.full_name}</Link></>
                        ) : (
                            <>Client: <Link to={`/users/${order.client_id}`} className="font-medium text-primary-600 hover:underline" onClick={(e) => e.stopPropagation()}>{order.client?.full_name}</Link></>
                        )}
                    </p>
                </div>
                <div className="text-right">
                    <span className={`badge ${getOrderStatusColor(order.status)}`}>
                        {order.status}
                    </span>
                    <p className="text-lg font-bold text-primary-600 mt-2">₹{order.agreed_price}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 text-sm">
                <div>
                    <p className="text-gray-600">Created</p>
                    <p className="font-medium text-gray-900">
                        {new Date(order.created_at).toLocaleDateString()}
                    </p>
                </div>
                {order.expected_delivery && (
                    <div>
                        <p className="text-gray-600">Expected Delivery</p>
                        <p className="font-medium text-gray-900">
                            {new Date(order.expected_delivery).toLocaleDateString()}
                        </p>
                    </div>
                )}
            </div>
        </Link>
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
