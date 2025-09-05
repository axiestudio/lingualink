'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface SmoothMessageTransitionProps {
  children: ReactNode;
  messageId: string | number;
  isOptimistic?: boolean;
  isTranslating?: boolean;
  isSending?: boolean;
}

/**
 * Smooth transition component for messages
 * Handles optimistic updates, translation states, and smooth animations
 */
export default function SmoothMessageTransition({
  children,
  messageId,
  isOptimistic = false,
  isTranslating = false,
  isSending = false
}: SmoothMessageTransitionProps) {
  
  // Animation variants for different states
  const messageVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30,
        mass: 1
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };

  // Optimistic message variants (slightly different animation)
  const optimisticVariants = {
    initial: {
      opacity: 0,
      y: 15,
      scale: 0.98
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.8
      }
    },
    update: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  // Translation loading animation
  const translationVariants = {
    translating: {
      opacity: [1, 0.7, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`message-${messageId}`}
        variants={isOptimistic ? optimisticVariants : messageVariants}
        initial="initial"
        animate={isTranslating ? "translating" : "animate"}
        exit="exit"
        layout
        className={`
          ${isOptimistic ? 'optimistic-message' : ''}
          ${isTranslating ? 'translating-message' : ''}
          ${isSending ? 'sending-message' : ''}
        `}
        style={{
          // Add subtle visual indicators for different states
          filter: isTranslating ? 'brightness(0.95)' : 'none',
          transform: isSending ? 'scale(0.99)' : 'scale(1)'
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Wrapper for message content that handles translation updates smoothly
 */
interface TranslationUpdateWrapperProps {
  children: ReactNode;
  translatedText?: string;
  isTranslating?: boolean;
  showTranslation?: boolean;
}

export function TranslationUpdateWrapper({
  children,
  translatedText,
  isTranslating = false,
  showTranslation = false
}: TranslationUpdateWrapperProps) {
  
  const translationVariants = {
    hidden: {
      opacity: 0,
      height: 0,
      y: -10
    },
    visible: {
      opacity: 1,
      height: 'auto',
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    updating: {
      opacity: [0.5, 1],
      scale: [0.98, 1],
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="message-content-wrapper">
      {/* Original message content */}
      <div className="original-message">
        {children}
      </div>

      {/* Translation content with smooth transitions */}
      <AnimatePresence>
        {(showTranslation || isTranslating) && (
          <motion.div
            variants={translationVariants}
            initial="hidden"
            animate={translatedText ? "updating" : "visible"}
            exit="hidden"
            className="translation-content mt-2"
          >
            {isTranslating && !translatedText ? (
              <div className="flex items-center gap-2 text-sm opacity-70">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                </div>
                <span>Translating...</span>
              </div>
            ) : translatedText ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="translated-text text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border-l-2 border-blue-300"
              >
                {translatedText}
              </motion.div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Progress indicator for translation
 */
interface TranslationProgressProps {
  progress: number; // 0-100
  isVisible: boolean;
}

export function TranslationProgress({ progress, isVisible }: TranslationProgressProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: '100%' }}
          exit={{ opacity: 0, width: 0 }}
          className="translation-progress mt-1"
        >
          <div className="w-full bg-gray-200 rounded-full h-1">
            <motion.div
              className="bg-blue-500 h-1 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Translating... {progress}%
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Message status indicator with smooth transitions
 */
interface MessageStatusProps {
  status: 'sending' | 'sent' | 'delivered' | 'translating' | 'translated' | 'error';
  className?: string;
}

export function MessageStatus({ status, className = '' }: MessageStatusProps) {
  const statusConfig = {
    sending: { icon: '⏳', text: 'Sending...', color: 'text-gray-400' },
    sent: { icon: '✓', text: 'Sent', color: 'text-gray-500' },
    delivered: { icon: '✓✓', text: 'Delivered', color: 'text-blue-500' },
    translating: { icon: '🌐', text: 'Translating...', color: 'text-blue-400' },
    translated: { icon: '🌐✓', text: 'Translated', color: 'text-green-500' },
    error: { icon: '⚠️', text: 'Failed', color: 'text-red-500' }
  };

  const config = statusConfig[status];

  return (
    <motion.div
      key={status}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`flex items-center gap-1 text-xs ${config.color} ${className}`}
    >
      <span>{config.icon}</span>
      <span>{config.text}</span>
    </motion.div>
  );
}

/**
 * Typing indicator with smooth animation
 */
export function TypingIndicator({ isVisible }: { isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 text-sm text-gray-500 p-2"
        >
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          </div>
          <span>Someone is typing...</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
