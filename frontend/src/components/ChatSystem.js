import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { 
    AnimatedChatMessage, 
    AnimatedChatInput,
    AnimatedConversationList,
    AnimatedChatHeader,
    TypingIndicator,
    EmptyChatState
} from './animations/ChatAnimations';
import { 
    PageTransition,
    LoadingSpinner
} from './animations/AnimatedComponents';
import { 
    MessageCircle, 
    Users, 
    Send, 
    X, 
    Maximize2, 
    Minimize2,
    RefreshCw,
    Phone,
    Video
} from 'lucide-react';

const ChatSystem = ({ 
    currentUser, 
    API, 
    isMinimized = false, 
    onToggleMinimize = () => {} 
}) => {
    // State Management
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOnline, setIsOnline] = useState(false);
    
    // Refs
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const wsRef = useRef(null);
    
    // Scroll to bottom of messages
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Initialize WebSocket connection
    useEffect(() => {
        if (!currentUser) return;

        const connectWebSocket = () => {
            const wsUrl = `wss://${window.location.host}/ws/chat/${currentUser.id}`;
            
            try {
                wsRef.current = new WebSocket(wsUrl);
                
                wsRef.current.onopen = () => {
                    console.log('Chat WebSocket connected');
                    setIsOnline(true);
                };
                
                wsRef.current.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        
                        if (data.type === 'new_message') {
                            handleNewMessage(data.message);
                        } else if (data.type === 'typing') {
                            setIsTyping(data.isTyping);
                        }
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                    }
                };
                
                wsRef.current.onclose = () => {
                    console.log('Chat WebSocket disconnected');
                    setIsOnline(false);
                    // Attempt to reconnect after 3 seconds
                    setTimeout(connectWebSocket, 3000);
                };
                
                wsRef.current.onerror = (error) => {
                    console.error('Chat WebSocket error:', error);
                    setIsOnline(false);
                };
            } catch (error) {
                console.error('Error creating WebSocket connection:', error);
                setIsOnline(false);
                // Retry connection after 5 seconds
                setTimeout(connectWebSocket, 5000);
            }
        };

        connectWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [currentUser]);

    // Handle new incoming message
    const handleNewMessage = useCallback((message) => {
        if (selectedConversation && message.conversation_id === selectedConversation.id) {
            setMessages(prev => [...prev, message]);
            
            // Mark message as read if it's not from the current user
            if (message.sender_id !== currentUser.id) {
                markMessageAsRead(message.id);
            }
        }
        
        // Update conversations list
        fetchConversations();
    }, [selectedConversation, currentUser]);

    // Fetch conversations
    const fetchConversations = useCallback(async () => {
        if (!currentUser) return;
        
        try {
            const response = await axios.get(`${API}/chat/conversations`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            
            setConversations(response.data);
            
            // Calculate total unread count
            const totalUnread = response.data.reduce((sum, conv) => sum + conv.unread_count, 0);
            setUnreadCount(totalUnread);
            
        } catch (error) {
            console.error('Error fetching conversations:', error);
            toast.error('Failed to load conversations');
        }
    }, [currentUser, API]);

    // Fetch messages for selected conversation
    const fetchMessages = useCallback(async (conversationId) => {
        if (!conversationId) return;
        
        setIsLoading(true);
        try {
            const response = await axios.get(`${API}/chat/messages/${conversationId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            
            setMessages(response.data);
            setTimeout(scrollToBottom, 100);
            
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast.error('Failed to load messages');
        } finally {
            setIsLoading(false);
        }
    }, [API, scrollToBottom]);

    // Send message
    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || isSending) return;
        
        setIsSending(true);
        try {
            const response = await axios.post(`${API}/chat/send`, {
                receiver_id: selectedConversation.participants.find(p => p !== currentUser.id),
                message_type: 'text',
                content: newMessage.trim()
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            
            setMessages(prev => [...prev, response.data]);
            setNewMessage('');
            fetchConversations(); // Update conversation list
            setTimeout(scrollToBottom, 100);
            
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    // Handle file upload
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file || !selectedConversation) return;

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        setIsSending(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const receiverId = selectedConversation.participants.find(p => p !== currentUser.id);
            
            const response = await axios.post(
                `${API}/chat/upload?receiver_id=${receiverId}`,
                formData,
                {
                    headers: { 
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            setMessages(prev => [...prev, response.data]);
            fetchConversations(); // Update conversation list
            setTimeout(scrollToBottom, 100);
            toast.success('File sent successfully!');
            
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error('Failed to send file');
        } finally {
            setIsSending(false);
        }

        // Clear the input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Mark message as read
    const markMessageAsRead = async (messageId) => {
        try {
            await axios.put(`${API}/chat/messages/${messageId}/read`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    };

    // Select conversation
    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        fetchMessages(conversation.id);
    };

    // Initial data load
    useEffect(() => {
        if (currentUser) {
            fetchConversations();
        }
    }, [currentUser, fetchConversations]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    if (!currentUser) {
        return null;
    }

    // Minimized Chat Widget
    if (isMinimized) {
        return (
            <motion.div
                className="fixed bottom-4 right-4 z-50"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
            >
                <Button
                    onClick={onToggleMinimize}
                    className="relative p-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
                >
                    <MessageCircle className="w-6 h-6 text-white" />
                    {unreadCount > 0 && (
                        <motion.div
                            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            key={unreadCount}
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.div>
                    )}
                </Button>
            </motion.div>
        );
    }

    return (
        <PageTransition>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[85vh]"
                    >
                        {/* Conversations List */}
                        <Card className="lg:col-span-1 shadow-xl border-0">
                            <CardHeader className="border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center space-x-2">
                                            <Users className="w-5 h-5" />
                                            <span>Conversations</span>
                                        </CardTitle>
                                        {unreadCount > 0 && (
                                            <Badge className="mt-1 bg-white/20 text-white">
                                                {unreadCount} unread
                                            </Badge>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={fetchConversations}
                                        className="text-white hover:bg-white/20"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[calc(85vh-120px)]">
                                    {conversations.length > 0 ? (
                                        <AnimatedConversationList
                                            conversations={conversations}
                                            onSelectConversation={handleSelectConversation}
                                            selectedConversationId={selectedConversation?.id}
                                        />
                                    ) : (
                                        <div className="p-8 text-center text-gray-500">
                                            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                            <p>No conversations yet</p>
                                            <p className="text-sm">Start chatting to see conversations here</p>
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        {/* Chat Area */}
                        <Card className="lg:col-span-2 shadow-xl border-0 flex flex-col">
                            {selectedConversation ? (
                                <>
                                    {/* Chat Header */}
                                    <AnimatedChatHeader
                                        conversation={selectedConversation}
                                        isOnline={isOnline}
                                        onBack={() => setSelectedConversation(null)}
                                    />

                                    {/* Messages Area */}
                                    <CardContent className="flex-1 p-0 flex flex-col">
                                        <ScrollArea className="flex-1 p-4">
                                            {isLoading ? (
                                                <div className="flex items-center justify-center h-64">
                                                    <LoadingSpinner size="lg" />
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <AnimatePresence>
                                                        {messages.map((message, index) => {
                                                            const isOwnMessage = message.sender_id === currentUser.id;
                                                            const isLatest = index === messages.length - 1;
                                                            
                                                            return (
                                                                <AnimatedChatMessage
                                                                    key={message.id}
                                                                    message={message}
                                                                    isOwnMessage={isOwnMessage}
                                                                    isLatest={isLatest}
                                                                />
                                                            );
                                                        })}
                                                    </AnimatePresence>
                                                    
                                                    <TypingIndicator 
                                                        isVisible={isTyping} 
                                                        username={selectedConversation?.other_participant_name}
                                                    />
                                                    
                                                    <div ref={messagesEndRef} />
                                                </div>
                                            )}
                                        </ScrollArea>

                                        {/* Chat Input */}
                                        <AnimatedChatInput
                                            message={newMessage}
                                            setMessage={setNewMessage}
                                            onSend={sendMessage}
                                            onFileUpload={() => fileInputRef.current?.click()}
                                            isLoading={isSending}
                                            disabled={isLoading}
                                        />
                                    </CardContent>
                                </>
                            ) : (
                                <CardContent className="flex-1 p-0">
                                    <EmptyChatState />
                                </CardContent>
                            )}
                        </Card>
                    </div>

                    {/* Hidden File Input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        accept="image/*,.pdf,.doc,.docx,.txt"
                    />

                    {/* Floating Action Button for Mobile */}
                    <div className="lg:hidden fixed bottom-4 right-4">
                        <Button
                            onClick={onToggleMinimize}
                            className="p-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
                        >
                            <X className="w-6 h-6 text-white" />
                        </Button>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

// Chat Dialog Component for embedding in other pages
export const ChatDialog = ({ currentUser, API, trigger }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-[95vw] h-[80vh] p-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>Messages</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                    <ChatSystem 
                        currentUser={currentUser} 
                        API={API} 
                        isMinimized={false}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ChatSystem;