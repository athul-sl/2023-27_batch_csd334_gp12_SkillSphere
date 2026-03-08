import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Star, ChevronDown, ArrowUpDown } from 'lucide-react';
import { servicesAPI, skillsAPI } from '../lib/api';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

const SORT_OPTIONS = [
    { label: 'Newest First', sort_by: 'created_at', sort_order: 'desc' },
    { label: 'Oldest First', sort_by: 'created_at', sort_order: 'asc' },
    { label: 'Price: Low to High', sort_by: 'price', sort_order: 'asc' },
    { label: 'Price: High to Low', sort_by: 'price', sort_order: 'desc' },
    { label: 'Rating: High to Low', sort_by: 'average_rating', sort_order: 'desc' },
    { label: 'Rating: Low to High', sort_by: 'average_rating', sort_order: 'asc' },
];

export default function ServicesPage() {
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const filterRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) {
                setShowFilterDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadServices();
    }, [page, selectedCategory, search, sortBy, sortOrder]);

    const loadCategories = async () => {
        try {
            const response = await skillsAPI.getCategories();
            setCategories(response.data.items);
        } catch (error) {
            toast.error('Failed to load categories');
        }
    };

    const loadServices = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                page_size: 12,
                search: search || undefined,
                sort_by: sortBy,
                sort_order: sortOrder,
            };

            if (selectedCategory) {
                params.category_id = selectedCategory;
            }

            const response = await servicesAPI.listServices(params);
            setServices(response.data.items);
            setTotalPages(response.data.pages);
        } catch (error) {
            toast.error('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        loadServices();
    };

    const handleSortSelect = (option) => {
        setSortBy(option.sort_by);
        setSortOrder(option.sort_order);
        setPage(1);
        setShowFilterDropdown(false);
    };

    // Find current sort label
    const currentSortLabel = SORT_OPTIONS.find(
        (o) => o.sort_by === sortBy && o.sort_order === sortOrder
    )?.label || 'Sort';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Browse Services</h1>
                    <p className="text-gray-600 mt-1">Find the perfect service for your needs</p>
                </div>
                <Link to="/services/create" className="btn-primary">
                    List Your Service
                </Link>
            </div>

            {/* Search and Filters */}
            <div className="card">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search services..."
                            className="input-field pl-10"
                        />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setPage(1);
                        }}
                        className="input-field w-64"
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>

                    {/* Filter / Sort Button */}
                    <div className="relative" ref={filterRef}>
                        <button
                            type="button"
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            className={`btn-primary flex items-center gap-2 ${sortBy !== 'created_at' || sortOrder !== 'desc'
                                ? 'ring-2 ring-primary-300'
                                : ''
                                }`}
                        >
                            <Filter size={20} />
                            <ChevronDown size={16} />
                        </button>

                        {/* Sort Dropdown */}
                        {showFilterDropdown && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                        <ArrowUpDown size={14} /> Sort By
                                    </p>
                                </div>
                                {SORT_OPTIONS.map((option) => (
                                    <button
                                        key={option.label}
                                        onClick={() => handleSortSelect(option)}
                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors ${sortBy === option.sort_by && sortOrder === option.sort_order
                                            ? 'bg-primary-50 text-primary-700 font-semibold'
                                            : 'text-gray-700'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </form>

                {/* Active Sort Indicator */}
                {(sortBy !== 'created_at' || sortOrder !== 'desc') && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <span className="text-sm text-gray-500">Sorted by:</span>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
                            <ArrowUpDown size={14} />
                            {currentSortLabel}
                            <button
                                onClick={() => { setSortBy('created_at'); setSortOrder('desc'); setPage(1); }}
                                className="ml-1 hover:text-primary-900"
                            >
                                ✕
                            </button>
                        </span>
                    </div>
                )}
            </div>

            {/* Categories Pills */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => {
                        setSelectedCategory('');
                        setPage(1);
                    }}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${!selectedCategory
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    All
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => {
                            setSelectedCategory(cat.id);
                            setPage(1);
                        }}
                        className={`px-4 py-2 rounded-full font-medium transition-colors ${selectedCategory === cat.id
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        style={
                            selectedCategory === cat.id
                                ? { backgroundColor: cat.color }
                                : {}
                        }
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Services Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            ) : services.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-600 text-lg">No services found matching your criteria.</p>
                </div>
            ) : (
                <>
                    <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {services.map((service) => (
                            <ServiceCard key={service.id} service={service} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="btn-secondary"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-gray-700">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages}
                                className="btn-secondary"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function ServiceCard({ service }) {
    return (
        <Link
            to={`/services/${service.id}`}
            className="card hover:scale-105 transition-transform duration-200"
        >
            {service.thumbnail && (
                <img
                    src={service.thumbnail}
                    alt={service.title}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                />
            )}
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{service.title}</h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {service.short_description || service.description}
            </p>

            <div className="flex items-center gap-2 mb-3">
                {service.provider?.profile_image ? (
                    <img
                        src={`${API_BASE}${service.provider.profile_image}`}
                        alt={service.provider?.full_name}
                        className="w-6 h-6 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-xs">
                        {service.provider?.full_name?.charAt(0) || '?'}
                    </div>
                )}
                <span className="text-sm text-gray-600">{service.provider?.full_name}</span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div>
                    <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={16} fill="currentColor" />
                        <span className="text-sm font-medium text-gray-900">
                            {service.average_rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-500">({service.total_reviews})</span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold text-primary-600">₹{service.price}</p>
                    <p className="text-xs text-gray-500">{service.delivery_time_days}d delivery</p>
                </div>
            </div>
        </Link>
    );
}
