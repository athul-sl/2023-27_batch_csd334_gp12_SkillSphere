import { useForm } from 'react-hook-form';

/**
 * Shared form fields for creating and editing services.
 * Used by both CreateServicePage and EditServicePage.
 */
export default function ServiceForm({
    onSubmit,
    loading,
    categories,
    skills,
    selectedCategory,
    onCategoryChange,
    defaultValues,
    submitLabel = 'Create Service',
    onCancel,
}) {
    const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
            {/* Title */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Title *
                </label>
                <input
                    type="text"
                    {...register('title', {
                        required: 'Title is required',
                        minLength: { value: 5, message: 'Title must be at least 5 characters' }
                    })}
                    className="input-field"
                    placeholder="I will design a professional poster for your event"
                />
                {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
            </div>

            {/* Short Description */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description
                </label>
                <input
                    type="text"
                    {...register('short_description', {
                        maxLength: { value: 300, message: 'Max 300 characters' }
                    })}
                    className="input-field"
                    placeholder="Brief tagline for your service"
                />
                {errors.short_description && (
                    <p className="mt-1 text-sm text-red-600">{errors.short_description.message}</p>
                )}
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Description *
                </label>
                <textarea
                    {...register('description', {
                        required: 'Description is required',
                        minLength: { value: 20, message: 'Description must be at least 20 characters' }
                    })}
                    className="input-field h-32"
                    placeholder="Provide detailed information about your service..."
                />
                {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
            </div>

            {/* Category & Skill */}
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category {onCategoryChange ? '*' : ''}
                    </label>
                    <select
                        value={selectedCategory}
                        onChange={onCategoryChange ? (e) => onCategoryChange(e.target.value) : undefined}
                        className="input-field"
                        disabled={!onCategoryChange}
                        required={!!onCategoryChange}
                    >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                        {onCategoryChange && (
                            <option value="custom">✨ Custom (Enter your own)</option>
                        )}
                    </select>
                    {!onCategoryChange && (
                        <p className="mt-1 text-sm text-gray-500">
                            Category cannot be changed after creation
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Skill
                    </label>
                    <select
                        {...register('skill_id')}
                        className="input-field"
                        disabled={!selectedCategory || selectedCategory === 'custom' || !onCategoryChange}
                    >
                        <option value="">
                            {onCategoryChange ? 'Select Skill (or enter custom below)' : 'No skill selected'}
                        </option>
                        {skills.map((skill) => (
                            <option key={skill.id} value={skill.id}>
                                {skill.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Custom Skill (only in create mode) */}
            {onCategoryChange && (
                <div className={selectedCategory === 'custom' ? 'p-4 bg-purple-50 border border-purple-200 rounded-lg' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {selectedCategory === 'custom' ? 'Custom Skill/Category Name *' : 'Or Enter Custom Skill Name'}
                    </label>
                    <input
                        type="text"
                        {...register('custom_skill_name', {
                            required: selectedCategory === 'custom' ? 'Custom skill name is required' : false
                        })}
                        className="input-field"
                        placeholder="e.g., 3D Modeling, Game Development, Circuit Design"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                        {selectedCategory === 'custom'
                            ? 'Enter the name for your custom skill or category'
                            : "If your skill isn't listed above, enter it here"}
                    </p>
                    {errors.custom_skill_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.custom_skill_name.message}</p>
                    )}
                </div>
            )}

            {/* Pricing */}
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pricing Type *
                    </label>
                    <select {...register('pricing_type')} className="input-field">
                        <option value="fixed">Fixed Price</option>
                        <option value="hourly">Hourly Rate</option>
                        <option value="negotiable">Negotiable</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (₹)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        {...register('price', {
                            min: { value: 0, message: 'Price must be positive' }
                        })}
                        className="input-field"
                        placeholder="500"
                    />
                    {errors.price && (
                        <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                    )}
                </div>
            </div>

            {/* Delivery & Revisions */}
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Time (days) *
                    </label>
                    <input
                        type="number"
                        {...register('delivery_time_days', {
                            required: 'Delivery time is required',
                            min: { value: 1, message: 'At least 1 day' },
                            max: { value: 30, message: 'Max 30 days' }
                        })}
                        className="input-field"
                        placeholder="3"
                    />
                    {errors.delivery_time_days && (
                        <p className="mt-1 text-sm text-red-600">{errors.delivery_time_days.message}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Revisions Included *
                    </label>
                    <input
                        type="number"
                        {...register('revision_count', {
                            required: 'Revision count is required',
                            min: { value: 0, message: 'Cannot be negative' },
                            max: { value: 10, message: 'Max 10 revisions' }
                        })}
                        className="input-field"
                        placeholder="2"
                    />
                    {errors.revision_count && (
                        <p className="mt-1 text-sm text-red-600">{errors.revision_count.message}</p>
                    )}
                </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="btn-secondary flex-1"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1"
                >
                    {loading ? 'Saving...' : submitLabel}
                </button>
            </div>
        </form>
    );
}
