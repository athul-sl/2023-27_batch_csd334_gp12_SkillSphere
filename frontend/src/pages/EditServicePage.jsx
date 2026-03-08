import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { servicesAPI, skillsAPI } from '../lib/api';
import ServiceForm from '../components/ServiceForm';

export default function EditServicePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [skills, setSkills] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [formDefaults, setFormDefaults] = useState(null);

    useEffect(() => {
        Promise.all([
            servicesAPI.getService(id),
            skillsAPI.getCategories()
        ])
            .then(([serviceRes, categoriesRes]) => {
                const service = serviceRes.data;
                setCategories(categoriesRes.data.items);

                // Find and set the category for this service's skill
                if (service.skill?.id) {
                    const category = categoriesRes.data.items.find(cat =>
                        cat.id === service.skill?.category_id
                    );
                    if (category) {
                        setSelectedCategory(category.id.toString());
                    }
                }

                setFormDefaults({
                    title: service.title,
                    description: service.description,
                    short_description: service.short_description || '',
                    pricing_type: service.pricing_type,
                    price: service.price,
                    delivery_time_days: service.delivery_time_days,
                    revision_count: service.revision_count,
                    skill_id: service.skill_id || '',
                });
            })
            .catch(() => {
                toast.error('Failed to load service');
                navigate('/dashboard');
            })
            .finally(() => setPageLoading(false));
    }, [id]);

    // Load skills when category is set
    useEffect(() => {
        if (selectedCategory) {
            skillsAPI.getSkills({ category_id: selectedCategory })
                .then((res) => setSkills(res.data.items))
                .catch(() => toast.error('Failed to load skills'));
        }
    }, [selectedCategory]);

    const onSubmit = (data) => {
        setLoading(true);
        const cleanedData = {
            title: data.title,
            description: data.description,
            short_description: data.short_description?.trim() || null,
            pricing_type: data.pricing_type || 'fixed',
            price: data.price !== '' && data.price !== null && data.price !== undefined ? parseFloat(data.price) : 0,
            delivery_time_days: parseInt(data.delivery_time_days),
            revision_count: parseInt(data.revision_count),
        };

        servicesAPI.updateService(id, cleanedData)
            .then(() => {
                toast.success('Service updated successfully!');
                navigate(`/services/${id}`);
            })
            .catch((error) => {
                toast.error(error.response?.data?.detail || 'Failed to update service');
            })
            .finally(() => setLoading(false));
    };

    if (pageLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Edit Service</h1>
                <p className="text-gray-600 mt-1">Update your service details</p>
            </div>
            <ServiceForm
                onSubmit={onSubmit}
                loading={loading}
                categories={categories}
                skills={skills}
                selectedCategory={selectedCategory}
                onCategoryChange={null}
                defaultValues={formDefaults}
                submitLabel="Save Changes"
                onCancel={() => navigate(-1)}
            />
        </div>
    );
}
