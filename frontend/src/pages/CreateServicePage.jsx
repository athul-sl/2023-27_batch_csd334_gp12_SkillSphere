import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { servicesAPI, skillsAPI } from '../lib/api';
import ServiceForm from '../components/ServiceForm';

export default function CreateServicePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [skills, setSkills] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        skillsAPI.getCategories()
            .then((res) => setCategories(res.data.items))
            .catch(() => toast.error('Failed to load categories'));
    }, []);

    useEffect(() => {
        if (selectedCategory && selectedCategory !== 'custom') {
            skillsAPI.getSkills({ category_id: selectedCategory })
                .then((res) => setSkills(res.data.items))
                .catch(() => toast.error('Failed to load skills'));
        }
    }, [selectedCategory]);

    const onSubmit = async (data) => {
        setLoading(true);
        const parsedSkillId = data.skill_id ? parseInt(data.skill_id) : null;
        const cleanedData = {
            title: data.title,
            description: data.description,
            short_description: data.short_description?.trim() || null,
            pricing_type: data.pricing_type || 'fixed',
            price: data.price ? parseFloat(data.price) : 0,
            delivery_time_days: parseInt(data.delivery_time_days),
            revision_count: parseInt(data.revision_count),
            skill_id: (parsedSkillId && !isNaN(parsedSkillId) && parsedSkillId > 0) ? parsedSkillId : null,
            custom_skill_name: data.custom_skill_name?.trim() || null,
        };

        try {
            await servicesAPI.createService(cleanedData);
            toast.success('Service created successfully! Your service is now live.');
            navigate('/dashboard');
        } catch (error) {
            const message = error.response?.data?.detail;
            toast.error(typeof message === 'string' ? message : 'Failed to create service');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Create New Service</h1>
                <p className="text-gray-600 mt-1">List your skills and start earning</p>
            </div>
            <ServiceForm
                onSubmit={onSubmit}
                loading={loading}
                categories={categories}
                skills={skills}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                submitLabel="Create Service"
                onCancel={() => navigate(-1)}
            />
        </div>
    );
}
