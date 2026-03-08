import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Briefcase, ShoppingBag, User, LogOut, Shield, MessageCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useState, useEffect } from 'react';
import { chatAPI } from '../lib/api';

export default function Layout() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState(0);

    // Poll unread count
    useEffect(() => {
        const fetchUnread = () => {
            chatAPI.getUnreadCount().then(res => setUnreadCount(res.data.unread_count)).catch(() => { });
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', icon: Home, label: 'Dashboard' },
        { path: '/services', icon: Briefcase, label: 'Services' },
        { path: '/orders', icon: ShoppingBag, label: 'Jobs' },
        { path: '/messages', icon: MessageCircle, label: 'Messages' },
        { path: '/profile', icon: User, label: 'Profile' },
    ];

    if (user?.role === 'admin') {
        navItems.push({ path: '/admin', icon: Shield, label: 'Admin' });
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">S</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">SkillSphere</span>
                        </Link>

                        <div className="flex items-center space-x-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname.startsWith(item.path);
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors relative ${isActive
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Icon size={20} />
                                        <span className="hidden md:inline font-medium">{item.label}</span>
                                        {item.path === '/messages' && unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}

                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <LogOut size={20} />
                                <span className="hidden md:inline font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <p className="text-center text-gray-600 text-sm">
                        &copy; 2026 SkillSphere - Campus Skill Marketplace for @ceconline.edu
                    </p>
                </div>
            </footer>
        </div>
    );
}
