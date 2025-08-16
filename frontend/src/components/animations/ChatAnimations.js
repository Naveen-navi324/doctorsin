import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
    Send, 
    Paperclip, 
    Image, 
    Download, 
    Check, 
    CheckCheck,
    MessageCircle,
    Users,
    Clock,
    File
} from 'lucide-react';

// Chat Message Animation Component
export const AnimatedChatMessage = ({ message, isOwnMessage, isLatest }) => {
    const messageVariants = {
        hidden: { 
            opacity: 0, 
            y: 20,
            x: isOwnMessage ? 20 : -20,
            scale: 0.9
        },
        visible: { 
            opacity: 1, 
            y: 0,
            x: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 500,
                damping: 30,
                duration: 0.3
            }
        },
        exit: {
            opacity: 0,
            scale: 0.9,
            transition: { duration: 0.2 }
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'sent':
                return <Check className="w-3 h-3 text-gray-400" />;
            case 'delivered':
                return <CheckCheck className="w-3 h-3 text-gray-400" />;
            case 'read':
                return <CheckCheck className="w-3 h-3 text-blue-500" />;
            default:
                return null;
        }
    };

    return (
        <motion.div
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}
        >
            <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                <motion.div
                    className={`relative rounded-2xl px-4 py-3 shadow-sm ${
                        isOwnMessage 
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                            : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                    whileHover={{ 
                        scale: 1.02,
                        transition: { duration: 0.2 }
                    }}
                >
                    {/* Message Content */}
                    {message.message_type === 'text' && (
                        <p className="text-sm leading-relaxed">
                            {message.content}
                        </p>
                    )}

                    {/* File Message */}
                    {message.message_type === 'file' && (
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${
                                isOwnMessage ? 'bg-blue-400/20' : 'bg-gray-100'
                            }`}>
                                <File className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {message.file_name}
                                </p>
                                <p className={`text-xs ${
                                    isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                    {message.file_size && `${(message.file_size / 1024).toFixed(1)} KB`}
                                </p>
                            </div>
                            <Button
                                size="sm"
                                variant={isOwnMessage ? "ghost" : "outline"}
                                className="p-1 h-auto"
                            >
                                <Download className="w-3 h-3" />
                            </Button>
                        </div>
                    )}

                    {/* Image Message */}
                    {message.message_type === 'image' && (
                        <div className="space-y-2">
                            <div className="relative rounded-lg overflow-hidden bg-gray-100">
                                <img 
                                    src={`${process.env.REACT_APP_BACKEND_URL}${message.file_url}`}
                                    alt={message.file_name}
                                    className="max-w-full h-auto max-h-48 object-contain"
                                />
                            </div>
                            {message.file_name && (
                                <p className={`text-xs ${
                                    isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                    {message.file_name}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Message Time and Status */}
                    <div className={`flex items-center justify-between mt-2 text-xs ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                        <span>
                            {new Date(message.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            })}
                        </span>
                        {isOwnMessage && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                {getStatusIcon(message.status)}
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Avatar */}
            {!isOwnMessage && (
                <Avatar className={`w-8 h-8 order-0 mr-2 ${isLatest ? 'visible' : 'invisible'}`}>
                    <AvatarFallback className="text-xs bg-gradient-to-r from-purple-400 to-pink-400 text-white">
                        {message.sender_name?.[0] || 'U'}
                    </AvatarFallback>
                </Avatar>
            )}
        </motion.div>
    );
};

// Chat Input Animation Component
export const AnimatedChatInput = ({ 
    message, 
    setMessage, 
    onSend, 
    onFileUpload, 
    isLoading, 
    disabled 
}) => {
    const inputVariants = {
        focused: {
            scale: 1.02,
            boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
            transition: { duration: 0.2 }
        },
        unfocused: {
            scale: 1,
            boxShadow: "0 0 0 0px rgba(59, 130, 246, 0)",
            transition: { duration: 0.2 }
        }
    };

    const buttonVariants = {
        idle: { scale: 1, rotate: 0 },
        hover: { scale: 1.1, rotate: 5 },
        tap: { scale: 0.9, rotate: -5 }
    };

    return (
        <motion.div 
            className="border-t bg-white p-4"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
            <div className="flex items-end space-x-3">
                {/* File Upload Button */}
                <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="p-2 h-auto"
                        onClick={onFileUpload}
                        disabled={disabled}
                    >
                        <Paperclip className="w-4 h-4" />
                    </Button>
                </motion.div>

                {/* Message Input */}
                <motion.div 
                    className="flex-1 relative"
                    variants={inputVariants}
                    whileFocus="focused"
                    animate="unfocused"
                >
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                        rows={1}
                        style={{
                            minHeight: '44px',
                            maxHeight: '120px',
                            height: 'auto'
                        }}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                onSend();
                            }
                        }}
                        disabled={disabled}
                    />
                </motion.div>

                {/* Send Button */}
                <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                    <Button
                        onClick={onSend}
                        disabled={!message.trim() || isLoading || disabled}
                        className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
                    >
                        <motion.div
                            animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
                            transition={isLoading ? { 
                                repeat: Infinity, 
                                duration: 1,
                                ease: "linear"
                            } : {}}
                        >
                            <Send className="w-4 h-4" />
                        </motion.div>
                    </Button>
                </motion.div>
            </div>
        </motion.div>
    );
};

// Conversation List Animation Component
export const AnimatedConversationList = ({ conversations, onSelectConversation, selectedConversationId }) => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { 
            opacity: 1, 
            x: 0,
            transition: {
                type: "spring",
                stiffness: 500,
                damping: 25
            }
        }
    };

    return (
        <motion.div
            className="space-y-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <AnimatePresence>
                {conversations.map((conversation) => (
                    <motion.div
                        key={conversation.id}
                        variants={itemVariants}
                        layout
                        className={`p-4 cursor-pointer rounded-lg transition-colors ${
                            selectedConversationId === conversation.id
                                ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                : 'hover:bg-gray-50'
                        }`}
                        onClick={() => onSelectConversation(conversation)}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-gradient-to-r from-purple-400 to-pink-400 text-white">
                                    {conversation.other_participant_name?.[0] || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium text-gray-900 truncate">
                                        {conversation.other_participant_name || 'Unknown User'}
                                    </h3>
                                    <div className="flex items-center space-x-2">
                                        {conversation.last_message_at && (
                                            <span className="text-xs text-gray-500">
                                                {new Date(conversation.last_message_at).toLocaleDateString()}
                                            </span>
                                        )}
                                        {conversation.unread_count > 0 && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                                            >
                                                {conversation.unread_count}
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                                
                                {conversation.other_participant_role && (
                                    <Badge 
                                        variant="secondary" 
                                        className="text-xs mb-1 bg-gradient-to-r from-gray-100 to-gray-200"
                                    >
                                        {conversation.other_participant_role}
                                    </Badge>
                                )}
                                
                                {conversation.last_message && (
                                    <p className="text-sm text-gray-600 truncate">
                                        {conversation.last_message.message_type === 'text' 
                                            ? conversation.last_message.content
                                            : `📎 ${conversation.last_message.file_name || 'File'}`
                                        }
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </motion.div>
    );
};

// Chat Header Animation Component
export const AnimatedChatHeader = ({ conversation, isOnline, onBack }) => {
    return (
        <motion.div
            className="border-b bg-white p-4"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
            <div className="flex items-center space-x-3">
                {onBack && (
                    <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
                        ← Back
                    </Button>
                )}
                
                <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-r from-purple-400 to-pink-400 text-white">
                        {conversation?.other_participant_name?.[0] || 'U'}
                    </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                    <h2 className="font-semibold text-gray-900">
                        {conversation?.other_participant_name || 'Unknown User'}
                    </h2>
                    <div className="flex items-center space-x-2 text-sm">
                        {conversation?.other_participant_role && (
                            <Badge variant="secondary" className="text-xs">
                                {conversation.other_participant_role}
                            </Badge>
                        )}
                        <motion.div
                            className={`w-2 h-2 rounded-full ${
                                isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                            animate={isOnline ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 2 }}
                        />
                        <span className="text-gray-500">
                            {isOnline ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Typing Indicator Animation
export const TypingIndicator = ({ isVisible, username }) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-500"
                >
                    <div className="flex space-x-1">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-2 h-2 bg-gray-400 rounded-full"
                                animate={{ y: [0, -5, 0] }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 0.6,
                                    delay: i * 0.1
                                }}
                            />
                        ))}
                    </div>
                    <span>{username || 'Someone'} is typing...</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Empty Chat State Animation
export const EmptyChatState = () => {
    return (
        <motion.div
            className="flex flex-col items-center justify-center h-full text-center p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6"
                animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                }}
                transition={{ 
                    repeat: Infinity,
                    duration: 4,
                    ease: "easeInOut"
                }}
            >
                <MessageCircle className="w-12 h-12 text-blue-500" />
            </motion.div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Start a Conversation
            </h3>
            <p className="text-gray-600 max-w-md">
                Select a conversation from the list to start chatting with doctors or patients.
            </p>
        </motion.div>
    );
};