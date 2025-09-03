"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Reply, 
  X, 
  Send, 
  Loader2,
  Quote,
  User,
  Clock
} from 'lucide-react';

interface ReplyToMessage {
  id: number;
  message: string;
  sender_name: string;
  created_at: string;
  file_metadata?: any;
}

interface MessageReplyProps {
  replyToMessage: ReplyToMessage | null;
  onReply: (message: string, replyToId: number) => Promise<void>;
  onCancelReply: () => void;
  disabled?: boolean;
}

export default function MessageReply({ 
  replyToMessage, 
  onReply, 
  onCancelReply, 
  disabled = false 
}: MessageReplyProps) {
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendReply = async () => {
    if (!replyText.trim() || !replyToMessage || isSending) return;

    setIsSending(true);
    try {
      await onReply(replyText.trim(), replyToMessage.id);
      setReplyText('');
      onCancelReply();
    } catch (error) {
      console.error('❌ Error sending reply:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    } else if (e.key === 'Escape') {
      onCancelReply();
    }
  };

  if (!replyToMessage) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="border-t border-slate-200 bg-slate-50 p-4"
      >
        {/* Reply Context */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Reply className="w-4 h-4" />
              <span>Replying to {replyToMessage.sender_name}</span>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
              disabled={isSending}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Original Message Preview */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 ml-6">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">
                {replyToMessage.sender_name}
              </span>
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400">
                {new Date(replyToMessage.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            
            <div className="flex items-start gap-2">
              <Quote className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                {replyToMessage.file_metadata ? (
                  <div className="text-sm text-slate-600">
                    📎 {JSON.parse(replyToMessage.file_metadata).originalName}
                  </div>
                ) : (
                  <p className="text-sm text-slate-700 line-clamp-2">
                    {replyToMessage.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reply Input */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your reply..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              disabled={disabled || isSending}
              autoFocus
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-slate-400">
                Press Enter to send, Shift+Enter for new line, Esc to cancel
              </span>
              <span className="text-xs text-slate-400">
                {replyText.length}/1000
              </span>
            </div>
          </div>

          <button
            onClick={handleSendReply}
            disabled={!replyText.trim() || isSending || disabled}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Reply
              </>
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
