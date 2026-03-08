// 📋 ORDER DETAIL PAGE
// Shows all the details about an order and lets you take actions

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, CreditCard, Smartphone, Landmark, Banknote, X, CheckCircle } from 'lucide-react';
import { ordersAPI, reviewsAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Payment modal state
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [processingPayment, setProcessingPayment] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    // Review form state
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewTitle, setReviewTitle] = useState('');
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        loadOrder();
    }, [id]);

    // 📦 Load order details
    const loadOrder = () => {
        setLoading(true);
        ordersAPI.getOrder(id)
            .then((response) => {
                setOrder(response.data);
            })
            .catch(() => {
                toast.error('Failed to load order');
                navigate('/orders');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // 🔄 Update order status
    const updateStatus = (status, reason = null) => {
        setUpdating(true);
        ordersAPI.updateOrderStatus(id, {
            status,
            rejection_reason: reason,
            cancellation_reason: reason
        })
            .then(() => {
                toast.success('Order status updated!');
                loadOrder();  // Reload to get fresh data
            })
            .catch((error) => {
                toast.error(error.response?.data?.detail || 'Failed to update status');
            })
            .finally(() => {
                setUpdating(false);
            });
    };

    // 💳 Handle payment flow
    const handlePayment = async () => {
        if (!selectedPaymentMethod) {
            toast.error('Please select a payment method');
            return;
        }

        setProcessingPayment(true);

        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            // Update payment status via API
            await ordersAPI.updatePayment(id, {
                payment_status: 'paid',
                payment_method: selectedPaymentMethod
            });

            setPaymentSuccess(true);

            // Wait a moment to show success state, then complete the order
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Complete the order
            await ordersAPI.updateOrderStatus(id, { status: 'completed' });

            toast.success('Payment successful! Order completed.');
            setShowPaymentModal(false);
            setPaymentSuccess(false);
            setSelectedPaymentMethod('');
            loadOrder();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Payment failed. Please try again.');
        } finally {
            setProcessingPayment(false);
        }
    };

    // ⭐ Submit a review
    const submitReview = () => {
        if (!reviewComment.trim() || reviewComment.length < 10) {
            toast.error('Please write a review (at least 10 characters)');
            return;
        }

        setSubmittingReview(true);
        reviewsAPI.createReview({
            order_id: parseInt(id),
            rating: reviewRating,
            title: reviewTitle.trim() || null,
            comment: reviewComment.trim()
        })
            .then(() => {
                toast.success('Review submitted! Thank you!');
                setShowReviewForm(false);
                setReviewRating(5);
                setReviewTitle('');
                setReviewComment('');
            })
            .catch((error) => {
                toast.error(error.response?.data?.detail || 'Failed to submit review');
            })
            .finally(() => {
                setSubmittingReview(false);
            });
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const isClient = order.client_id === user.id;
    const isProvider = order.provider_id === user.id;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Order #{order.order_number}</h1>
                <span className={`badge ${getOrderStatusColor(order.status)}`}>
                    {formatStatus(order.status)}
                </span>
            </div>

            {/* Order Summary */}
            <div className="card">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        {order.service_id ? (
                            <Link
                                to={`/services/${order.service_id}`}
                                className="text-xl font-semibold text-gray-900 hover:text-primary-600"
                            >
                                {order.service?.title || order.service_title || 'Deleted Service'}
                            </Link>
                        ) : (
                            <span className="text-xl font-semibold text-gray-500">
                                {order.service_title || 'Deleted Service'}
                            </span>
                        )}
                        <p className="text-gray-600 mt-1">
                            {isClient ? (
                                <>Provider: <Link to={`/users/${order.provider_id}`} className="text-primary-600 hover:underline">{order.provider?.full_name}</Link></>
                            ) : (
                                <>Client: <Link to={`/users/${order.client_id}`} className="text-primary-600 hover:underline">{order.client?.full_name}</Link></>
                            )}
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <p className="text-sm text-gray-600">Price</p>
                        <p className="text-2xl font-bold text-primary-600">₹{order.agreed_price}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Expected Delivery</p>
                        <p className="font-semibold text-gray-900">
                            {new Date(order.expected_delivery).toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Revisions</p>
                        <p className="font-semibold text-gray-900">
                            {order.revision_count} / {order.max_revisions}
                        </p>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{order.requirements}</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="card">
                <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="flex gap-3 flex-wrap">

                    {/* PROVIDER ACTIONS */}

                    {/* Provider: Accept or Reject new order */}
                    {isProvider && order.status === 'pending' && (
                        <>
                            <button
                                onClick={() => updateStatus('accepted')}
                                disabled={updating}
                                className="btn-primary"
                            >
                                {updating ? 'Updating...' : 'Accept Order'}
                            </button>
                            <button
                                onClick={() => {
                                    const reason = prompt('Rejection reason:');
                                    if (reason) updateStatus('rejected', reason);
                                }}
                                disabled={updating}
                                className="btn-secondary"
                            >
                                Reject Order
                            </button>
                        </>
                    )}

                    {/* Provider: Start working on accepted order */}
                    {isProvider && order.status === 'accepted' && (
                        <button
                            onClick={() => updateStatus('in_progress')}
                            disabled={updating}
                            className="btn-primary"
                        >
                            {updating ? 'Updating...' : 'Start Work'}
                        </button>
                    )}

                    {/* Provider: Mark as delivered */}
                    {isProvider && (order.status === 'in_progress' || order.status === 'revision') && (
                        <button
                            onClick={() => updateStatus('delivered')}
                            disabled={updating}
                            className="btn-primary"
                        >
                            {updating ? 'Updating...' : 'Mark as Delivered'}
                        </button>
                    )}

                    {/* CLIENT ACTIONS */}

                    {/* Client: Accept delivery or request revision */}
                    {isClient && order.status === 'delivered' && (
                        <>
                            <button
                                onClick={() => {
                                    setShowPaymentModal(true);
                                    setSelectedPaymentMethod('');
                                    setPaymentSuccess(false);
                                }}
                                disabled={updating}
                                className="btn-primary"
                            >
                                Accept & Pay
                            </button>
                            <button
                                onClick={() => {
                                    if (order.revision_count < order.max_revisions) {
                                        updateStatus('revision');
                                    } else {
                                        toast.error('No revisions left');
                                    }
                                }}
                                disabled={updating}
                                className="btn-secondary"
                            >
                                Request Revision ({order.max_revisions - order.revision_count} left)
                            </button>
                        </>
                    )}

                    {/* Cancel button (both can cancel before work starts) */}
                    {(order.status === 'pending' || order.status === 'accepted') && (
                        <button
                            onClick={() => {
                                const reason = prompt('Cancellation reason:');
                                if (reason) updateStatus('cancelled', reason);
                            }}
                            disabled={updating}
                            className="btn-secondary text-red-600 border-red-300 hover:bg-red-50 ml-auto"
                        >
                            Cancel Order
                        </button>
                    )}

                    {/* No actions available message */}
                    {order.status === 'completed' && !showReviewForm && (
                        <p className="text-green-600 font-medium">✓ This order has been completed!</p>
                    )}

                    {(order.status === 'cancelled' || order.status === 'rejected') && (
                        <p className="text-red-600 font-medium">This order was {order.status}.</p>
                    )}
                </div>
            </div>

            {/* Review Section - Only for completed orders */}
            {order.status === 'completed' && isClient && (
                <div className="card">
                    <h3 className="font-semibold text-gray-900 mb-4">Leave a Review</h3>

                    {!showReviewForm ? (
                        <button
                            onClick={() => setShowReviewForm(true)}
                            className="btn-primary"
                        >
                            Write a Review
                        </button>
                    ) : (
                        <div className="space-y-4">
                            {/* Star Rating */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rating *
                                </label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setReviewRating(star)}
                                            className="focus:outline-none"
                                        >
                                            <Star
                                                size={32}
                                                className={star <= reviewRating ? 'text-yellow-500 fill-current' : 'text-gray-300'}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Review Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title (optional)
                                </label>
                                <input
                                    type="text"
                                    value={reviewTitle}
                                    onChange={(e) => setReviewTitle(e.target.value)}
                                    className="input-field"
                                    placeholder="Summarize your experience"
                                />
                            </div>

                            {/* Review Comment */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Review *
                                </label>
                                <textarea
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    className="input-field h-32"
                                    placeholder="Share your experience with this service..."
                                />
                            </div>

                            {/* Submit buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowReviewForm(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitReview}
                                    disabled={submittingReview}
                                    className="btn-primary"
                                >
                                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Order Timeline/History could go here */}

            {/* 💳 Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => !processingPayment && setShowPaymentModal(false)}>
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Complete Payment</h3>
                            {!processingPayment && (
                                <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={22} />
                                </button>
                            )}
                        </div>

                        {paymentSuccess ? (
                            /* Success State */
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={36} className="text-green-600" />
                                </div>
                                <h4 className="text-lg font-bold text-gray-900 mb-1">Payment Successful!</h4>
                                <p className="text-gray-500">Completing your order...</p>
                            </div>
                        ) : processingPayment ? (
                            /* Processing State */
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                                <h4 className="text-lg font-bold text-gray-900 mb-1">Processing Payment...</h4>
                                <p className="text-gray-500">Please wait while we process your payment</p>
                            </div>
                        ) : (
                            /* Payment Method Selection */
                            <>
                                {/* Order Amount */}
                                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
                                    <p className="text-sm text-gray-500 mb-1">Amount to Pay</p>
                                    <p className="text-3xl font-bold text-primary-600">₹{order.agreed_price}</p>
                                    <p className="text-xs text-gray-400 mt-1">for {order.service?.title || order.service_title}</p>
                                </div>

                                {/* Payment Methods */}
                                <div className="space-y-3 mb-6">
                                    <p className="text-sm font-medium text-gray-700">Select Payment Method</p>

                                    {[
                                        { id: 'credit_card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay', icon: CreditCard, color: 'text-blue-600 bg-blue-50' },
                                        { id: 'upi', label: 'UPI', desc: 'Google Pay, PhonePe, Paytm', icon: Smartphone, color: 'text-purple-600 bg-purple-50' },
                                        { id: 'net_banking', label: 'Net Banking', desc: 'All major banks supported', icon: Landmark, color: 'text-green-600 bg-green-50' },
                                        { id: 'cash', label: 'Cash on Delivery', desc: 'Pay when you meet', icon: Banknote, color: 'text-yellow-600 bg-yellow-50' },
                                    ].map((method) => (
                                        <button
                                            key={method.id}
                                            onClick={() => setSelectedPaymentMethod(method.id)}
                                            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${selectedPaymentMethod === method.id
                                                    ? 'border-primary-500 bg-primary-50 shadow-sm'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${method.color}`}>
                                                <method.icon size={22} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{method.label}</p>
                                                <p className="text-xs text-gray-500">{method.desc}</p>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === method.id
                                                    ? 'border-primary-500'
                                                    : 'border-gray-300'
                                                }`}>
                                                {selectedPaymentMethod === method.id && (
                                                    <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Pay Button */}
                                <button
                                    onClick={handlePayment}
                                    disabled={!selectedPaymentMethod}
                                    className="btn-primary w-full py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Pay ₹{order.agreed_price}
                                </button>

                                <p className="text-xs text-gray-400 text-center mt-3">
                                    🔒 This is a simulated payment for demonstration purposes
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper to get badge color
function getOrderStatusColor(status) {
    const colors = {
        pending: 'badge-warning',
        accepted: 'badge-info',
        in_progress: 'badge-info',
        delivered: 'badge-warning',
        revision: 'badge-warning',
        completed: 'badge-success',
        cancelled: 'badge-danger',
        rejected: 'badge-danger'
    };
    return colors[status] || 'badge-info';
}

// Helper to format status nicely
function formatStatus(status) {
    const labels = {
        pending: 'Pending Approval',
        accepted: 'Accepted',
        in_progress: 'In Progress',
        delivered: 'Delivered',
        revision: 'Revision Requested',
        completed: 'Completed',
        cancelled: 'Cancelled',
        rejected: 'Rejected'
    };
    return labels[status] || status;
}
