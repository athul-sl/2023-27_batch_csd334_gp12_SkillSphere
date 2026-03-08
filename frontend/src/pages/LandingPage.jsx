
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Users, Shield, Star, Sparkles, Zap, TrendingUp } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function LandingPage() {
    const { isAuthenticated } = useAuthStore();

    return (
        <div className="min-h-screen">
            {/* Animated Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute top-60 -left-20 w-60 h-60 bg-blue-300/20 rounded-full blur-3xl float-animation"></div>
                    <div className="absolute bottom-20 right-1/3 w-40 h-40 bg-purple-300/20 rounded-full blur-2xl float-animation" style={{ animationDelay: '2s' }}></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                    <div className="text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white mb-8 animate-fade-in">
                            <Sparkles size={16} className="animate-spin" style={{ animationDuration: '3s' }} />
                            <span className="font-semibold">Campus Exclusive Platform</span>
                        </div>

                        {/* Main Heading with Gradient */}
                        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 animate-slide-up">
                            Your Campus
                            <br />
                            <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                                Skill Marketplace
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
                            Connect with talented students at <span className="font-bold text-yellow-300">@ceconline.edu</span>.
                            <br />
                            Offer your skills or hire peers for design, writing, tutoring, coding, and more.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                            {isAuthenticated ? (
                                <Link to="/dashboard" className="group relative px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 overflow-hidden">
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        Go to Dashboard
                                        <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 to-pink-200 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </Link>
                            ) : (
                                <>
                                    <Link to="/register" className="group relative px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 overflow-hidden">
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            Get Started Free
                                            <Zap size={20} className="group-hover:rotate-12 transition-transform" />
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 to-pink-200 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </Link>
                                    <Link to="/login" className="px-8 py-4 border-2 border-white text-white rounded-2xl font-bold text-lg backdrop-blur-sm bg-white/10 hover:bg-white hover:text-blue-600 hover:scale-105 transition-all duration-300">
                                        Sign In
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
                            {[
                                { number: '500+', label: 'Students' },
                                { number: '100+', label: 'Services' },
                                { number: '4.9', label: 'Rating' }
                            ].map((stat, i) => (
                                <div key={i} className="text-center animate-fade-in" style={{ animationDelay: `${0.6 + i * 0.1} s` }}>
                                    <div className="text-3xl md:text-4xl font-black text-white mb-1">{stat.number}</div>
                                    <div className="text-white/80 font-medium">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                        Why Choose <span className="gradient-text">SkillSphere</span>?
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        The smartest way to buy and sell skills within your campus community
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Briefcase className="text-blue-600" size={40} />}
                        title="Diverse Skills"
                        description="From poster design to coding, tutoring to video editing. All within your campus."
                        gradient="from-blue-500 to-indigo-600"
                    />
                    <FeatureCard
                        icon={<Shield className="text-green-600" size={40} />}
                        title="Trusted & Safe"
                        description="All users are verified @ceconline.edu students. Secure and campus-restricted."
                        gradient="from-green-500 to-emerald-600"
                    />
                    <FeatureCard
                        icon={<Star className="text-yellow-600" size={40} />}
                        title="Rating System"
                        description="Review and rate service providers. Build your reputation and find the best talent."
                        gradient="from-yellow-500 to-orange-600"
                    />
                    <FeatureCard
                        icon={<Users className="text-purple-600" size={40} />}
                        title="Active Community"
                        description="Join hundreds of students already earning and learning on the platform."
                        gradient="from-purple-500 to-pink-600"
                    />
                    <FeatureCard
                        icon={<Zap className="text-red-600" size={40} />}
                        title="Quick Hiring"
                        description="Browse, hire, and track orders with a simple, intuitive interface."
                        gradient="from-red-500 to-pink-600"
                    />
                    <FeatureCard
                        icon={<TrendingUp className="text-indigo-600" size={40} />}
                        title="Earn & Grow"
                        description="Monetize your skills while helping fellow students succeed."
                        gradient="from-indigo-500 to-purple-600"
                    />
                </div>
            </div>

            {/* CTA Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 py-20">
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                </div>

                <div className="relative max-w-4xl mx-auto text-center px-4">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                        Ready to Get Started?
                    </h2>
                    <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed">
                        Join the SkillSphere community and start offering or hiring services today!
                    </p>
                    {!isAuthenticated && (
                        <Link to="/register" className="inline-block px-10 py-5 bg-white text-purple-600 rounded-2xl font-black text-lg shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300">
                            Create Your Account →
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, description, gradient }) {
    return (
        <div className="group card hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className={`inline - flex p - 4 rounded - 2xl bg - gradient - to - r ${gradient} mb - 4 group - hover: scale - 110 transition - transform duration - 300 shadow - lg`}>
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-600 leading-relaxed">{description}</p>
        </div>
    );
}

