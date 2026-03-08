import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI } from '../lib/api';
import toast from 'react-hot-toast';
import { Users, Package, ShoppingBag, DollarSign, Trash2, Shield, ShieldOff, Search, ChevronLeft, ChevronRight, Edit, ExternalLink } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const res = await adminAPI.getStats();
            setStats(res.data);
        } catch (error) {
            toast.error('Failed to load stats');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
    }

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'users', label: 'Users' },
        { id: 'services', label: 'Services' },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>

            {/* Tab Navigation */}
            <div className="flex gap-1 border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-2.5 font-medium text-sm rounded-t-lg transition-colors ${activeTab === tab.id
                            ? 'bg-white border border-b-white border-gray-200 text-primary-600 -mb-px'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && <OverviewTab stats={stats} />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'services' && <ServicesTab />}
        </div>
    );
}

// ============ OVERVIEW TAB ============

function OverviewTab({ stats }) {
    return (
        <div className="grid md:grid-cols-4 gap-6">
            <StatCard icon={<Users className="text-blue-600" size={24} />} title="Total Users" value={stats.total_users} color="bg-blue-50" />
            <StatCard icon={<Package className="text-green-600" size={24} />} title="Total Services" value={stats.total_services} color="bg-green-50" />
            <StatCard icon={<ShoppingBag className="text-purple-600" size={24} />} title="Total Orders" value={stats.total_orders} color="bg-purple-50" />
            <StatCard icon={<DollarSign className="text-yellow-600" size={24} />} title="Total Revenue" value={`₹${stats.total_revenue.toFixed(2)}`} color="bg-yellow-50" />
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

// ============ USERS TAB ============

function UsersTab() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 15;

    useEffect(() => {
        loadUsers();
    }, [page, search]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const params = { page, page_size: pageSize };
            if (search.trim()) params.search = search.trim();
            const res = await adminAPI.listUsers(params);
            setUsers(res.data.items);
            setTotalPages(res.data.pages);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleRole = async (user) => {
        const newRole = user.role === 'admin' ? 'student' : 'admin';
        const action = newRole === 'admin' ? 'grant admin privileges to' : 'remove admin privileges from';
        if (!confirm(`Are you sure you want to ${action} ${user.full_name}?`)) return;

        try {
            await adminAPI.updateUserRole(user.id, newRole);
            toast.success(`${user.full_name} is now ${newRole === 'admin' ? 'an admin' : 'a regular student'}`);
            loadUsers();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to update role');
        }
    };

    const handleDelete = async (user) => {
        if (!confirm(`⚠️ Are you sure you want to permanently delete ${user.full_name}?\n\nThis will also delete all their services and reviews. Order history will be preserved. This action cannot be undone.`)) return;

        try {
            await adminAPI.deleteUser(user.id);
            toast.success(`${user.full_name} has been deleted`);
            loadUsers();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to delete user');
        }
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    return (
        <div className="card">
            {/* Search */}
            <div className="flex items-center gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={handleSearchChange}
                        className="input pl-10 w-full"
                    />
                </div>
            </div>

            {/* Users Table */}
            {loading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
            ) : users.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No users found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="pb-3 text-sm font-semibold text-gray-600">User</th>
                                <th className="pb-3 text-sm font-semibold text-gray-600">Email</th>
                                <th className="pb-3 text-sm font-semibold text-gray-600">Role</th>
                                <th className="pb-3 text-sm font-semibold text-gray-600">Status</th>
                                <th className="pb-3 text-sm font-semibold text-gray-600">Joined</th>
                                <th className="pb-3 text-sm font-semibold text-gray-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="py-3">
                                        <Link to={`/users/${user.id}`} className="flex items-center gap-3 group">
                                            {user.profile_image ? (
                                                <img
                                                    src={`${API_BASE}${user.profile_image}`}
                                                    alt={user.full_name}
                                                    className="w-9 h-9 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold">
                                                    {user.full_name?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                            <span className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                                                {user.full_name}
                                            </span>
                                        </Link>
                                    </td>
                                    <td className="py-3 text-sm text-gray-600">{user.email}</td>
                                    <td className="py-3">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${user.role === 'admin'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${user.status === 'active'
                                            ? 'bg-green-100 text-green-700'
                                            : user.status === 'suspended'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="py-3 text-sm text-gray-500">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleToggleRole(user)}
                                                title={user.role === 'admin' ? 'Remove admin' : 'Make admin'}
                                                className={`p-2 rounded-lg transition-colors ${user.role === 'admin'
                                                    ? 'text-purple-600 hover:bg-purple-50'
                                                    : 'text-gray-400 hover:bg-gray-100 hover:text-purple-600'
                                                    }`}
                                            >
                                                {user.role === 'admin' ? <ShieldOff size={18} /> : <Shield size={18} />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user)}
                                                title="Delete user"
                                                className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============ SERVICES TAB ============

function ServicesTab() {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 15;

    useEffect(() => {
        loadServices();
    }, [page, search]);

    const loadServices = async () => {
        setLoading(true);
        try {
            const params = { page, page_size: pageSize };
            if (search.trim()) params.search = search.trim();
            const res = await adminAPI.listServices(params);
            setServices(res.data.items);
            setTotalPages(res.data.pages);
        } catch (error) {
            toast.error('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (service) => {
        if (!confirm(`⚠️ Are you sure you want to delete "${service.title}"?\n\nThis will also delete all associated orders and reviews. This action cannot be undone.`)) return;

        try {
            await adminAPI.deleteService(service.id);
            toast.success(`"${service.title}" has been deleted`);
            loadServices();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to delete service');
        }
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    return (
        <div className="card">
            {/* Search */}
            <div className="flex items-center gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by service title..."
                        value={search}
                        onChange={handleSearchChange}
                        className="input pl-10 w-full"
                    />
                </div>
            </div>

            {/* Services Table */}
            {loading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
            ) : services.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No services found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="pb-3 text-sm font-semibold text-gray-600">Service</th>
                                <th className="pb-3 text-sm font-semibold text-gray-600">Provider</th>
                                <th className="pb-3 text-sm font-semibold text-gray-600">Price</th>
                                <th className="pb-3 text-sm font-semibold text-gray-600">Status</th>
                                <th className="pb-3 text-sm font-semibold text-gray-600">Orders</th>
                                <th className="pb-3 text-sm font-semibold text-gray-600">Created</th>
                                <th className="pb-3 text-sm font-semibold text-gray-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map((service) => (
                                <tr key={service.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="py-3">
                                        <Link to={`/services/${service.id}`} className="group">
                                            <span className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                                                {service.title}
                                            </span>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {service.skill?.name || service.custom_skill_name || '—'}
                                            </p>
                                        </Link>
                                    </td>
                                    <td className="py-3">
                                        <Link to={`/users/${service.provider_id || service.provider?.id}`} className="text-sm text-primary-600 hover:underline">
                                            {service.provider?.full_name || '—'}
                                        </Link>
                                    </td>
                                    <td className="py-3 text-sm text-gray-700 font-medium">
                                        ₹{service.price || '—'}
                                    </td>
                                    <td className="py-3">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${service.status === 'approved'
                                            ? 'bg-green-100 text-green-700'
                                            : service.status === 'pending'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : service.status === 'rejected'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {service.status}
                                        </span>
                                    </td>
                                    <td className="py-3 text-sm text-gray-600">
                                        {service.order_count || 0}
                                    </td>
                                    <td className="py-3 text-sm text-gray-500">
                                        {new Date(service.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => navigate(`/services/${service.id}/edit`)}
                                                title="Edit service"
                                                className="p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <Link
                                                to={`/services/${service.id}`}
                                                title="View service"
                                                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                                            >
                                                <ExternalLink size={18} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(service)}
                                                title="Delete service"
                                                className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
