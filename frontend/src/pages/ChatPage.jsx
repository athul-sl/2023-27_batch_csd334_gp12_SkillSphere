// 💬 CHAT PAGE
// Full messaging inbox with conversation list + chat window

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MessageCircle, Search, Loader2 } from 'lucide-react';
import { chatAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import ChatWindow from '../components/ChatWindow';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

export default function ChatPage() {
    const { user } = useAuthStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const [conversations, setConversations] = useState([]);
    const [activeConvId, setActiveConvId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Handle deep-linking: ?user=X&service=Y
    useEffect(() => {
        const targetUserId = searchParams.get('user');
        const serviceId = searchParams.get('service');

        if (targetUserId) {
            handleDeepLink(parseInt(targetUserId), serviceId ? parseInt(serviceId) : null);
            // Clear params after handling
            setSearchParams({});
        } else {
            loadConversations();
        }
    }, []);

    const handleDeepLink = async (targetUserId, serviceId) => {
        try {
            const res = await chatAPI.createConversation({
                user_id: targetUserId,
                service_id: serviceId || undefined
            });
            setActiveConvId(res.data.id);
            await loadConversations();
        } catch (err) {
            toast.error('Failed to start conversation');
            loadConversations();
        }
    };

    const loadConversations = useCallback(async () => {
        try {
            const res = await chatAPI.listConversations();
            setConversations(res.data.items);
        } catch (err) {
            toast.error('Failed to load conversations');
        } finally {
            setLoading(false);
        }
    }, []);

    // Poll conversations list every 10s for new conversations & unread updates
    useEffect(() => {
        const interval = setInterval(() => {
            loadConversations();
        }, 10000);
        return () => clearInterval(interval);
    }, [loadConversations]);

    const formatTimeShort = (dateStr) => {
        if (!dateStr) return '';
        const utcStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
        const date = new Date(utcStr);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const filteredConversations = conversations.filter(conv =>
        !searchQuery || conv.other_user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeConv = conversations.find(c => c.id === activeConvId);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-primary-600" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" style={{ height: 'calc(100vh - 160px)' }}>
                <div className="flex h-full">
                    {/* Left: Conversation List */}
                    <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50/50">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 bg-white">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <MessageCircle size={22} className="text-primary-600" />
                                Messages
                            </h2>
                            {/* Search */}
                            <div className="relative mt-3">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search conversations..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-lg border-0 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Conversation List */}
                        <div className="flex-1 overflow-y-auto">
                            {filteredConversations.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <MessageCircle size={40} className="mx-auto text-gray-300 mb-3" />
                                    <p className="text-gray-500 text-sm">
                                        {searchQuery ? 'No matching conversations' : 'No conversations yet'}
                                    </p>
                                    <p className="text-gray-400 text-xs mt-1">
                                        Visit a user's profile or service to start chatting
                                    </p>
                                </div>
                            ) : (
                                filteredConversations.map((conv) => (
                                    <button
                                        key={conv.id}
                                        onClick={() => setActiveConvId(conv.id)}
                                        className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-primary-50/50 transition-colors text-left border-b border-gray-100 ${activeConvId === conv.id ? 'bg-primary-50 border-l-3 border-l-primary-600' : ''
                                            }`}
                                    >
                                        {/* Avatar */}
                                        {conv.other_user?.profile_image ? (
                                            <img
                                                src={`${API_BASE}${conv.other_user.profile_image}`}
                                                alt={conv.other_user?.full_name}
                                                className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                {conv.other_user?.full_name?.charAt(0) || '?'}
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className={`font-semibold text-sm truncate ${conv.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {conv.other_user?.full_name || 'Unknown'}
                                                </span>
                                                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                                    {formatTimeShort(conv.last_message?.created_at || conv.updated_at)}
                                                </span>
                                            </div>

                                            {/* Service context tag */}
                                            {conv.service && (
                                                <p className="text-xs text-primary-600 truncate mt-0.5">
                                                    Re: {conv.service.title}
                                                </p>
                                            )}

                                            {/* Last message preview */}
                                            <div className="flex items-center justify-between mt-0.5">
                                                <p className={`text-xs truncate ${conv.unread_count > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                                                    {conv.last_message
                                                        ? (conv.last_message.sender_id === user.id ? 'You: ' : '') + conv.last_message.content
                                                        : 'No messages yet'
                                                    }
                                                </p>
                                                {conv.unread_count > 0 && (
                                                    <span className="bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
                                                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right: Chat Window */}
                    <div className="flex-1 flex flex-col">
                        {activeConv && (
                            <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-3">
                                <Link to={`/users/${activeConv.other_user?.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                    {activeConv.other_user?.profile_image ? (
                                        <img
                                            src={`${API_BASE}${activeConv.other_user.profile_image}`}
                                            alt={activeConv.other_user?.full_name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm">
                                            {activeConv.other_user?.full_name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{activeConv.other_user?.full_name}</h3>
                                        {activeConv.service && (
                                            <p className="text-xs text-primary-600">
                                                Re: {activeConv.service.title}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            </div>
                        )}
                        <ChatWindow
                            conversationId={activeConvId}
                            onMessageSent={loadConversations}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
