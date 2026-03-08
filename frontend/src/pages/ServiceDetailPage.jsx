import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Clock, RefreshCw, User, ShoppingCart, Trash2, Edit, MessageCircle } from 'lucide-react';
import { servicesAPI, reviewsAPI, ordersAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

export default function ServiceDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [service, setService] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showHireModal, setShowHireModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Check if user is admin
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        loadServiceDetails();
    }, [id]);

    const loadServiceDetails = async () => {
        try {
            const [serviceRes, reviewsRes] = await Promise.all([
                servicesAPI.getService(id),
                reviewsAPI.getServiceReviews(id, { page: 1, page_size: 10 })
            ]);
            setService(serviceRes.data);
            setReviews(reviewsRes.data.items);
        } catch (error) {
            toast.error('Failed to load service');
            navigate('/services');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
    }

    const isOwnService = service.provider_id === user.id;

    // 🗑️ DELETE SERVICE
    // Only the owner or admin can delete a service
    const handleDelete = () => {
        if (!window.confirm('Are you sure you want to delete this service? This cannot be undone!')) {
            return;
        }

        setDeleting(true);
        servicesAPI.deleteService(id)
            .then(() => {
                toast.success('Service deleted successfully!');
                navigate('/services');
            })
            .catch((error) => {
                toast.error(error.response?.data?.detail || 'Failed to delete service');
            })
            .finally(() => {
                setDeleting(false);
            });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Back Button */}
            <Link to="/services" className="text-primary-600 hover:text-primary-700 font-medium">
                ← Back to Services
            </Link>

            {/* Service Header */}
            <div className="card">
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">{service.title}</h1>
                        <p className="text-gray-600 mb-6">{service.description}</p>

                        <div className="flex items-center gap-4 mb-6">
                            {service.provider?.profile_image ? (
                                <img
                                    src={`${API_BASE}${service.provider.profile_image}`}
                                    alt={service.provider?.full_name}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg">
                                    {service.provider?.full_name?.charAt(0) || '?'}
                                </div>
                            )}
                            <div>
                                <Link
                                    to={`/users/${service.provider_id}`}
                                    className="font-semibold text-gray-900 hover:text-primary-600"
                                >
                                    {service.provider?.full_name}
                                </Link>
                                <div className="flex items-center gap-1 text-yellow-500 text-sm">
                                    <Star size={16} fill="currentColor" />
                                    <span className="text-gray-900 font-medium">
                                        {service.provider?.average_rating.toFixed(1)}
                                    </span>
                                    <span className="text-gray-500">({service.provider?.total_reviews} reviews)</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Clock size={20} />
                                <div>
                                    <p className="text-sm">Delivery</p>
                                    <p className="font-semibold text-gray-900">{service.delivery_time_days} days</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <RefreshCw size={20} />
                                <div>
                                    <p className="text-sm">Revisions</p>
                                    <p className="font-semibold text-gray-900">{service.revision_count}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <ShoppingCart size={20} />
                                <div>
                                    <p className="text-sm">Hires</p>
                                    <p className="font-semibold text-gray-900">{service.order_count}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hire Card */}
                    <div className="card bg-gray-50">
                        <div className="text-center mb-4">
                            <p className="text-3xl font-bold text-primary-600">₹{service.price}</p>
                            <p className="text-sm text-gray-600">{service.pricing_type}</p>
                        </div>

                        {/* Owner buttons: Edit + Delete */}
                        {isOwnService && (
                            <div className="space-y-2">
                                <Link to={`/services/${service.id}/edit`} className="btn-primary w-full flex items-center justify-center gap-2">
                                    <Edit size={18} /> Edit Service
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="btn-secondary w-full flex items-center justify-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
                                >
                                    <Trash2 size={18} /> {deleting ? 'Deleting...' : 'Delete Service'}
                                </button>
                            </div>
                        )}

                        {/* Admin buttons: Edit + Delete on any service */}
                        {isAdmin && !isOwnService && (
                            <div className="space-y-2">

                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="btn-secondary w-full flex items-center justify-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
                                >
                                    <Trash2 size={18} /> {deleting ? 'Deleting...' : 'Delete Service (Admin)'}
                                </button>
                                <button
                                    onClick={() => setShowHireModal(true)}
                                    className="btn-secondary w-full"
                                >
                                    Hire Now <ShoppingCart className="inline ml-2" size={18} />
                                </button>
                            </div>
                        )}

                        {/* Regular user: just Hire button */}
                        {!isOwnService && !isAdmin && (
                            <button
                                onClick={() => setShowHireModal(true)}
                                className="btn-primary w-full"
                            >
                                Hire Now <ShoppingCart className="inline ml-2" size={18} />
                            </button>
                        )}

                        {/* Message Provider button */}
                        {!isOwnService && (
                            <button
                                onClick={() => navigate(`/messages?user=${service.provider_id}&service=${service.id}`)}
                                className="btn-secondary w-full flex items-center justify-center gap-2 mt-2"
                            >
                                <MessageCircle size={18} /> Message Provider
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Reviews ({reviews.length})
                </h2>
                {reviews.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No reviews yet.</p>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0">
                                <div className="flex items-start gap-3">
                                    <User className="text-gray-400" size={40} />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-gray-900">
                                                {review.reviewer?.full_name}
                                            </span>
                                            <div className="flex items-center gap-1 text-yellow-500">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={16}
                                                        fill={i < review.rating ? 'currentColor' : 'none'}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        {review.title && (
                                            <h4 className="font-semibold text-gray-900 mb-1">{review.title}</h4>
                                        )}
                                        <p className="text-gray-600 mb-2">{review.comment}</p>
                                        <span className="text-xs text-gray-500">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Hire Modal */}
            {showHireModal && (
                <HireModal
                    service={service}
                    onClose={() => setShowHireModal(false)}
                    onSuccess={() => {
                        setShowHireModal(false);
                        navigate('/orders');
                    }}
                />
            )}
        </div>
    );
}

function HireModal({ service, onClose, onSuccess }) {
    const [requirements, setRequirements] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!requirements.trim() || requirements.length < 10) {
            toast.error('Please provide detailed requirements (at least 10 characters)');
            return;
        }

        setLoading(true);
        try {
            await ordersAPI.createOrder({
                service_id: service.id,
                requirements,
                agreed_price: service.price
            });
            toast.success('Hire placed successfully!');
            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to create order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Place Hire</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Describe Your Requirements *
                        </label>
                        <textarea
                            value={requirements}
                            onChange={(e) => setRequirements(e.target.value)}
                            className="input-field h-32"
                            placeholder="Provide detailed requirements for your order..."
                            required
                        />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">Service Price</span>
                            <span className="font-semibold text-gray-900">₹{service.price}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Delivery Time</span>
                            <span className="font-semibold text-gray-900">{service.delivery_time_days} days</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary flex-1"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex-1"
                        >
                            {loading ? 'Placing Hire...' : 'Confirm Hire'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
