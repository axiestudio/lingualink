"use client";

import {
  Reply,
  Globe,
  Loader2,
  Quote
} from 'lucide-react';
import FileMessage from './FileMessage';
import SmoothMessageTransition from './SmoothMessageTransition';

interface Message {
  id: number | string;
  room_id: string;
  sender_clerk_id: string;
  message: string;
  translated_message?: string;
  target_language?: string;
  file_id?: number;
  file_metadata?: any;
  reply_to_message_id?: number;
  created_at: string;
  username: string;
  sender_name: string;
  sender_avatar?: string;
  sending?: boolean;
  translating?: boolean;
  optimistic?: boolean;
}

interface ThreadedMessageProps {
  message: Message;
  replyToMessage?: Message | null;
  isOwn: boolean;
  onReply: (message: Message) => void;
  showReplyButton?: boolean;
}

export default function ThreadedMessage({ 
  message, 
  replyToMessage, 
  isOwn, 
  onReply,
  showReplyButton = true 
}: ThreadedMessageProps) {

  return (
    <SmoothMessageTransition
      messageId={message.id}
      isOptimistic={message.optimistic}
      isTranslating={message.translating}
      isSending={message.sending}
    >
      <div className={`flex items-start space-x-3 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 ${isOwn ? 'order-2' : 'order-1'}`}>
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {message.sender_name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      </div>

      {/* Message Content */}
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        {/* Reply Context (if this is a reply) */}
        {replyToMessage && (
          <div className={`mb-2 ${isOwn ? 'text-right' : 'text-left'}`}>
            <div className="inline-block bg-slate-100 border border-slate-200 rounded-lg p-2 text-xs">
              <div className="flex items-center gap-1 mb-1 text-slate-500">
                <Reply className="w-3 h-3" />
                <span>Reply to {replyToMessage.sender_name}</span>
              </div>
              <div className="flex items-start gap-1">
                <Quote className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  {replyToMessage.file_metadata ? (
                    <span className="text-slate-600">
                      📎 {JSON.parse(replyToMessage.file_metadata).originalName}
                    </span>
                  ) : (
                    <span className="text-slate-700 line-clamp-1">
                      {replyToMessage.message}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Message Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl ${
            isOwn
              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-br-md'
              : 'bg-white border border-slate-200/50 text-slate-900 rounded-bl-md'
          } shadow-sm ${message.sending ? 'opacity-70' : ''} ${message.optimistic ? 'ring-2 ring-blue-200 ring-opacity-50' : ''}`}
        >
          {/* File Attachment */}
          {message.file_metadata && (
            <div className="mb-3">
              <FileMessage
                fileMetadata={typeof message.file_metadata === 'string' 
                  ? JSON.parse(message.file_metadata) 
                  : message.file_metadata
                }
                message={message.message}
                showPreview={true}
              />
            </div>
          )}

          {/* Regular Message (only show if not a file-only message) */}
          {!message.file_metadata || !message.message.startsWith('📎 Shared a file:') ? (
            <>
              {/* Show translated message first if available, then original */}
              {message.translated_message ? (
                <div className="space-y-2">
                  <button
                    className={`text-left w-full p-2 rounded-lg transition-colors ${
                      isOwn
                        ? 'hover:bg-white/10 active:bg-white/20'
                        : 'hover:bg-slate-100 active:bg-slate-200'
                    }`}
                    onClick={() => {
                      // Copy translated message to clipboard
                      navigator.clipboard.writeText(message.translated_message || '');
                    }}
                  >
                    <p className="text-sm font-medium">{message.translated_message}</p>
                  </button>
                  <div className={`text-xs p-2 rounded-lg border ${
                    isOwn
                      ? 'bg-white/10 border-white/20 text-blue-100'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <div className="flex items-center space-x-1 mb-1">
                      <Globe className="w-3 h-3" />
                      <span>Original:</span>
                    </div>
                    <button
                      className="italic text-left w-full hover:underline"
                      onClick={() => {
                        // Copy original message to clipboard
                        navigator.clipboard.writeText(message.message);
                      }}
                    >
                      {message.message}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    className={`text-left flex-1 p-2 rounded-lg transition-colors ${
                      isOwn
                        ? 'hover:bg-white/10 active:bg-white/20'
                        : 'hover:bg-slate-100 active:bg-slate-200'
                    }`}
                    onClick={() => {
                      // Copy message to clipboard
                      navigator.clipboard.writeText(message.message);
                    }}
                  >
                    <p className="text-sm font-medium">{message.message}</p>
                  </button>
                  {/* 🚀 IMPROVED LOADING STATES */}
                  {message.sending && (
                    <div className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="text-xs opacity-75">Sending...</span>
                    </div>
                  )}
                  {message.translating && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-3 h-3 animate-pulse" />
                      <span className="text-xs opacity-75">Translating...</span>
                    </div>
                  )}
                  {message.optimistic && !message.sending && !message.translating && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-xs opacity-50">Delivered</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Message Footer */}
        <div className={`flex items-center justify-between mt-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center space-x-2 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <span className="text-xs text-slate-400">
              {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
            {message.sending && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Sending...
              </span>
            )}
            <span className="text-xs text-slate-400">{message.sender_name}</span>
          </div>

          {/* Reply Button */}
          {showReplyButton && !message.sending && (
            <button
              onClick={() => onReply(message)}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-all duration-200"
              title="Reply to this message"
            >
              <Reply className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      </div>
    </SmoothMessageTransition>
  );
}
