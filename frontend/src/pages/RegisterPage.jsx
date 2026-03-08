import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Phone, GraduationCap, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../store/authStore';

// Course duration in years for each branch
const COURSE_YEARS = {
    CSE: 4,
    ECE: 4,
    EEE: 4,
    'AI&ML': 4,
    MCA: 2,
};

// Generate passout year options (current year to +8)
const currentYear = new Date().getFullYear();
const PASSOUT_YEARS = Array.from({ length: 9 }, (_, i) => currentYear + i);

export default function RegisterPage() {
    const navigate = useNavigate();
    const { register: registerUser } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();

    const password = watch('password');
    const selectedBranch = watch('department');
    const selectedPassoutYear = watch('year_of_study');

    // Max semesters: 4 for MCA, 8 for all others
    const maxSemesters = selectedBranch === 'MCA' ? 4 : 8;

    // Reset semester if it exceeds the max for the selected branch
    const currentSemester = watch('semester');
    useEffect(() => {
        if (currentSemester && parseInt(currentSemester) > maxSemesters) {
            setValue('semester', '');
        }
    }, [selectedBranch, maxSemesters, currentSemester, setValue]);

    // Auto-compute course duration
    const computedCourseDuration = (() => {
        if (!selectedBranch || !selectedPassoutYear) return '';
        const years = COURSE_YEARS[selectedBranch];
        if (!years) return '';
        const passout = parseInt(selectedPassoutYear);
        const startYear = passout - years;
        return `${startYear}-${String(passout).slice(-2)}`;
    })();

    const onSubmit = (data) => {
        setIsLoading(true);

        const cleanedData = {
            ...data,
            student_id: data.student_id?.trim() || null,
            department: data.department?.trim() || null,
            phone: data.phone?.trim() || null,
            year_of_study: data.year_of_study ? parseInt(data.year_of_study, 10) : null,
            semester: data.semester ? parseInt(data.semester, 10) : null,
            batch: data.batch?.trim() || null,
            course_duration: computedCourseDuration || null,
        };

        delete cleanedData.confirm_password;

        registerUser(cleanedData)
            .then(() => {
                toast.success('Registration successful! Please login.');
                navigate('/login');
            })
            .catch((error) => {
                toast.error(error.response?.data?.detail || 'Registration failed');
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white px-4 py-12">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center space-x-2 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-2xl">S</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">SkillSphere</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
                    <p className="text-gray-600">Join the SkillSphere community at @ceconline.edu</p>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name *
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        {...register('full_name', {
                                            required: 'Full name is required',
                                            minLength: { value: 2, message: 'Name must be at least 2 characters' }
                                        })}
                                        className="input-field pl-10"
                                        placeholder="John Doe"
                                    />
                                </div>
                                {errors.full_name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    College Email *
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="email"
                                        {...register('email', {
                                            required: 'Email is required',
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@ceconline\.edu$/i,
                                                message: 'Must be a valid @ceconline.edu email'
                                            }
                                        })}
                                        className="input-field pl-10"
                                        placeholder="your.email@ceconline.edu"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password *
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        {...register('password', {
                                            required: 'Password is required',
                                            minLength: { value: 8, message: 'Password must be at least 8 characters' },
                                            pattern: {
                                                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                                message: 'Must contain uppercase, lowercase, and number'
                                            }
                                        })}
                                        className="input-field pl-10 pr-10"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm Password *
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        {...register('confirm_password', {
                                            required: 'Please confirm your password',
                                            validate: value => value === password || 'Passwords do not match'
                                        })}
                                        className="input-field pl-10 pr-10"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {errors.confirm_password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Student ID */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Student ID
                                </label>
                                <input
                                    type="text"
                                    {...register('student_id')}
                                    className="input-field"
                                    placeholder="2024001"
                                />
                            </div>

                            {/* Branch (stored as department) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Branch
                                </label>
                                <div className="relative">
                                    <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <select {...register('department')} className="input-field pl-10">
                                        <option value="">Select Branch</option>
                                        <option value="CSE">CSE</option>
                                        <option value="ECE">ECE</option>
                                        <option value="EEE">EEE</option>
                                        <option value="AI&ML">AI&ML</option>
                                        <option value="MCA">MCA</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Semester (dynamic based on branch) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Semester
                                </label>
                                <select {...register('semester')} className="input-field">
                                    <option value="">Select Semester</option>
                                    {Array.from({ length: maxSemesters }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Batch */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Batch
                                </label>
                                <select {...register('batch')} className="input-field">
                                    <option value="">Select Batch</option>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="D">D</option>
                                    <option value="E">E</option>
                                    <option value="F">F</option>
                                    <option value="G">G</option>
                                </select>
                            </div>

                            {/* Year of Passout */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Year of Passout
                                </label>
                                <select {...register('year_of_study')} className="input-field">
                                    <option value="">Select Year</option>
                                    {PASSOUT_YEARS.map((year) => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Course Duration (auto-computed) */}
                        {computedCourseDuration && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Course Duration
                                </label>
                                <input
                                    type="text"
                                    value={computedCourseDuration}
                                    className="input-field bg-gray-50 text-gray-700 font-semibold"
                                    disabled
                                />
                            </div>
                        )}

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="tel"
                                    {...register('phone')}
                                    className="input-field pl-10"
                                    placeholder="+91 9876543210"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full"
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
