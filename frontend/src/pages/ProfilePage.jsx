import { userAPI, portfolioAPI, uploadAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import { useForm } from 'react-hook-form';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, ExternalLink, Briefcase, Camera, X, Upload, Image } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

const COURSE_YEARS = { CSE: 4, ECE: 4, EEE: 4, 'AI&ML': 4, MCA: 2 };
const currentYear = new Date().getFullYear();
const PASSOUT_YEARS = Array.from({ length: 9 }, (_, i) => currentYear + i);

export default function ProfilePage() {
    const { user, updateUser } = useAuthStore();
    const [editing, setEditing] = useState(false);
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        defaultValues: user
    });

    // Portfolio state
    const [portfolio, setPortfolio] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newProject, setNewProject] = useState({ title: '', description: '', project_url: '', tags: '', image_url: '' });
    const [loadingPortfolio, setLoadingPortfolio] = useState(true);
    const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

    // Profile photo state
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const photoInputRef = useRef(null);
    const screenshotInputRef = useRef(null);

    const selectedBranch = watch('department');
    const selectedPassoutYear = watch('year_of_study');
    const maxSemesters = selectedBranch === 'MCA' ? 4 : 8;

    const currentSemester = watch('semester');
    useEffect(() => {
        if (currentSemester && parseInt(currentSemester) > maxSemesters) {
            setValue('semester', '');
        }
    }, [selectedBranch, maxSemesters, currentSemester, setValue]);

    const computedCourseDuration = (() => {
        if (!selectedBranch || !selectedPassoutYear) return user?.course_duration || '';
        const years = COURSE_YEARS[selectedBranch];
        if (!years) return '';
        const passout = parseInt(selectedPassoutYear);
        const startYear = passout - years;
        return `${startYear}-${String(passout).slice(-2)}`;
    })();

    // Load portfolio
    useEffect(() => {
        if (user?.id) {
            portfolioAPI.getUserPortfolio(user.id)
                .then(res => setPortfolio(res.data.items || []))
                .catch(() => { })
                .finally(() => setLoadingPortfolio(false));
        }
    }, [user?.id]);

    const onSubmit = async (data) => {
        try {
            const submitData = {
                ...data,
                course_duration: computedCourseDuration || null,
                year_of_study: data.year_of_study ? parseInt(data.year_of_study, 10) : null,
                semester: data.semester ? parseInt(data.semester, 10) : null,
            };
            const response = await userAPI.updateProfile(submitData);
            updateUser(response.data);
            toast.success('Profile updated successfully');
            setEditing(false);
        } catch (error) {
            toast.error('Failed to update profile');
        }
    };

    // ---- Profile Photo ----
    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingPhoto(true);
        try {
            const uploadRes = await uploadAPI.uploadFile(file);
            const imageUrl = uploadRes.data.url;
            const profileRes = await userAPI.updateProfile({ profile_image: imageUrl });
            updateUser(profileRes.data);
            toast.success('Profile photo updated!');
            setShowPhotoModal(false);
        } catch (error) {
            toast.error('Failed to upload photo');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handlePhotoRemove = async () => {
        setUploadingPhoto(true);
        try {
            const profileRes = await userAPI.updateProfile({ profile_image: null });
            updateUser(profileRes.data);
            toast.success('Profile photo removed');
            setShowPhotoModal(false);
        } catch (error) {
            toast.error('Failed to remove photo');
        } finally {
            setUploadingPhoto(false);
        }
    };

    // ---- Portfolio Screenshot Upload ----
    const handleScreenshotUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingScreenshot(true);
        try {
            const uploadRes = await uploadAPI.uploadFile(file);
            setNewProject(prev => ({ ...prev, image_url: uploadRes.data.url }));
            toast.success('Screenshot uploaded!');
        } catch (error) {
            toast.error('Failed to upload screenshot');
        } finally {
            setUploadingScreenshot(false);
        }
    };

    const handleAddProject = async (e) => {
        e.preventDefault();
        if (!newProject.title.trim()) {
            toast.error('Project title is required');
            return;
        }
        try {
            const res = await portfolioAPI.addProject(newProject);
            setPortfolio([res.data, ...portfolio]);
            setNewProject({ title: '', description: '', project_url: '', tags: '', image_url: '' });
            setShowAddForm(false);
            toast.success('Project added to portfolio!');
        } catch (error) {
            toast.error('Failed to add project');
        }
    };

    const handleDeleteProject = async (projectId) => {
        try {
            await portfolioAPI.deleteProject(projectId);
            setPortfolio(portfolio.filter(p => p.id !== projectId));
            toast.success('Project removed from portfolio');
        } catch (error) {
            toast.error('Failed to delete project');
        }
    };

    const profileImageSrc = user.profile_image ? `${API_BASE}${user.profile_image}` : null;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - Profile card */}
                <div className="lg:col-span-1">
                    <div className="card text-center">
                        {/* Avatar with click-to-edit */}
                        <div
                            className="relative mx-auto w-24 h-24 rounded-full cursor-pointer group mb-4"
                            onClick={() => setShowPhotoModal(true)}
                        >
                            {profileImageSrc ? (
                                <img
                                    src={profileImageSrc}
                                    alt={user.full_name}
                                    className="w-24 h-24 rounded-full object-cover ring-4 ring-primary-100"
                                />
                            ) : (
                                <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center ring-4 ring-primary-100">
                                    <span className="text-4xl font-bold text-white">
                                        {user.full_name.charAt(0)}
                                    </span>
                                </div>
                            )}
                            {/* Camera overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={22} className="text-white" />
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-gray-900">{user.full_name}</h2>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {user.bio && <p className="text-sm text-gray-500 mt-1">{user.bio}</p>}
                        {!user.bio && <p className="text-sm text-gray-400 mt-1 italic">No bio yet</p>}

                        <div className="flex justify-center gap-6 mt-4 py-3 border-t border-gray-100">
                            <div className="text-center">
                                <p className="text-lg font-bold text-green-600">{user.average_rating.toFixed(1)}</p>
                                <p className="text-xs text-gray-500">Rating</p>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-gray-900">{user.total_reviews}</p>
                                <p className="text-xs text-gray-500">Reviews</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setEditing(!editing)}
                            className="mt-3 w-full btn-secondary text-sm"
                        >
                            {editing ? 'Cancel' : 'Edit Profile'}
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="card mt-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total Earnings</span>
                            <span className="font-bold text-green-600">₹{user.total_earnings.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total Spent</span>
                            <span className="font-bold text-blue-600">₹{user.total_spent.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Rating</span>
                            <span className="font-bold text-yellow-600">⭐ {user.average_rating.toFixed(1)}</span>
                        </div>
                    </div>
                </div>

                {/* Right column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Portfolio Section */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span className="text-yellow-500">🎨</span>
                                Portfolio ({portfolio.length})
                            </h3>
                            <button
                                onClick={() => setShowAddForm(!showAddForm)}
                                className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                            >
                                <Plus size={16} />
                                Add Project
                            </button>
                        </div>

                        {/* Add Project Form */}
                        {showAddForm && (
                            <form onSubmit={handleAddProject} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50 space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Title *</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. E-Commerce Website"
                                        value={newProject.title}
                                        onChange={e => setNewProject({ ...newProject, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        className="input-field h-20"
                                        placeholder="Describe your project..."
                                        value={newProject.description}
                                        onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Project URL</label>
                                    <input
                                        type="url"
                                        className="input-field"
                                        placeholder="https://github.com/..."
                                        value={newProject.project_url}
                                        onChange={e => setNewProject({ ...newProject, project_url: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="React, Node.js, MongoDB"
                                        value={newProject.tags}
                                        onChange={e => setNewProject({ ...newProject, tags: e.target.value })}
                                    />
                                </div>
                                {/* Screenshot upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Screenshot</label>
                                    <input
                                        ref={screenshotInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleScreenshotUpload}
                                    />
                                    {newProject.image_url ? (
                                        <div className="relative inline-block">
                                            <img
                                                src={`${API_BASE}${newProject.image_url}`}
                                                alt="Screenshot"
                                                className="h-24 rounded-lg border border-gray-200 object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setNewProject({ ...newProject, image_url: '' })}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => screenshotInputRef.current?.click()}
                                            disabled={uploadingScreenshot}
                                            className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                                        >
                                            {uploadingScreenshot ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                                            ) : (
                                                <Image size={16} />
                                            )}
                                            {uploadingScreenshot ? 'Uploading...' : 'Upload Screenshot'}
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" className="btn-primary text-sm">Save Project</button>
                                    <button type="button" onClick={() => { setShowAddForm(false); setNewProject({ title: '', description: '', project_url: '', tags: '', image_url: '' }); }} className="btn-secondary text-sm">Cancel</button>
                                </div>
                            </form>
                        )}

                        {/* Portfolio Items */}
                        {loadingPortfolio ? (
                            <div className="flex justify-center py-6">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            </div>
                        ) : portfolio.length === 0 ? (
                            <p className="text-gray-500 text-center py-6">Showcase your work — add portfolio items!</p>
                        ) : (
                            <div className="space-y-3">
                                {portfolio.map(project => (
                                    <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                        <div className="flex gap-4">
                                            {/* Screenshot thumbnail */}
                                            {project.image_url && (
                                                <img
                                                    src={`${API_BASE}${project.image_url}`}
                                                    alt={project.title}
                                                    className="w-24 h-20 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-2">
                                                        <Briefcase size={16} className="text-primary-600" />
                                                        <h4 className="font-semibold text-gray-900">{project.title}</h4>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteProject(project.id)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                                                        title="Delete project"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                {project.description && (
                                                    <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                                                )}
                                                {project.tags && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {project.tags.split(',').map((tag, i) => (
                                                            <span key={i} className="inline-block bg-primary-50 text-primary-700 text-xs px-2 py-0.5 rounded-full">
                                                                {tag.trim()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {project.project_url && (
                                                    <a href={project.project_url} target="_blank" rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline mt-2">
                                                        <ExternalLink size={12} /> View Project
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Edit Profile Form */}
                    <div className="card">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Profile Details</h3>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                    <input type="text" {...register('full_name')} className="input-field" disabled={!editing} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
                                    <input type="text" {...register('student_id')} className="input-field" disabled={!editing} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                                    {editing ? (
                                        <select {...register('department')} className="input-field">
                                            <option value="">Select Branch</option>
                                            <option value="CSE">CSE</option>
                                            <option value="ECE">ECE</option>
                                            <option value="EEE">EEE</option>
                                            <option value="AI&ML">AI&ML</option>
                                            <option value="MCA">MCA</option>
                                        </select>
                                    ) : (
                                        <input type="text" value={user.department || ''} className="input-field" disabled />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                                    {editing ? (
                                        <select {...register('semester')} className="input-field">
                                            <option value="">Select Semester</option>
                                            {Array.from({ length: maxSemesters }, (_, i) => (
                                                <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input type="text" value={user.semester ? `Semester ${user.semester}` : ''} className="input-field" disabled />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Batch</label>
                                    {editing ? (
                                        <select {...register('batch')} className="input-field">
                                            <option value="">Select Batch</option>
                                            {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    ) : (
                                        <input type="text" value={user.batch ? `Batch ${user.batch}` : ''} className="input-field" disabled />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Year of Passout</label>
                                    {editing ? (
                                        <select {...register('year_of_study')} className="input-field">
                                            <option value="">Select Year</option>
                                            {PASSOUT_YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                                        </select>
                                    ) : (
                                        <input type="text" value={user.year_of_study || ''} className="input-field" disabled />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Course Duration</label>
                                    <input type="text" value={editing ? computedCourseDuration : (user.course_duration || '')} className="input-field bg-gray-50" disabled />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                    <input type="tel" {...register('phone')} className="input-field" disabled={!editing} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                                <textarea {...register('bio')} className="input-field h-24" disabled={!editing} placeholder="Tell us about yourself and your skills..." />
                            </div>
                            {editing && (
                                <button type="submit" className="btn-primary">Save Changes</button>
                            )}
                        </form>
                    </div>
                </div>
            </div>

            {/* Profile Photo Modal */}
            {showPhotoModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowPhotoModal(false)}>
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Profile Photo</h3>
                            <button onClick={() => setShowPhotoModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Current photo preview */}
                        <div className="flex justify-center mb-6">
                            {profileImageSrc ? (
                                <img src={profileImageSrc} alt={user.full_name} className="w-32 h-32 rounded-full object-cover ring-4 ring-primary-100" />
                            ) : (
                                <div className="w-32 h-32 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center ring-4 ring-primary-100">
                                    <span className="text-5xl font-bold text-white">{user.full_name.charAt(0)}</span>
                                </div>
                            )}
                        </div>

                        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

                        <div className="space-y-2">
                            <button
                                onClick={() => photoInputRef.current?.click()}
                                disabled={uploadingPhoto}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                            >
                                {uploadingPhoto ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    <Upload size={18} />
                                )}
                                {uploadingPhoto ? 'Uploading...' : 'Upload New Photo'}
                            </button>
                            {user.profile_image && (
                                <button
                                    onClick={handlePhotoRemove}
                                    disabled={uploadingPhoto}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                >
                                    <Trash2 size={18} />
                                    Remove Photo
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
