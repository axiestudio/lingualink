'use client';

import { useState, useCallback, useRef } from 'react';

export interface TranslationProgress {
  messageId: string;
  status: 'idle' | 'translating' | 'completed' | 'error';
  progress: number; // 0-100
  translatedText?: string;
  error?: string;
}

export interface ProgressiveTranslationHook {
  translations: Map<string, TranslationProgress>;
  startTranslation: (messageId: string, text: string, targetLanguage: string, sourceLanguage?: string) => Promise<void>;
  getTranslationStatus: (messageId: string) => TranslationProgress | null;
  clearTranslation: (messageId: string) => void;
}

/**
 * Hook for progressive translation with real-time updates
 * Provides smooth UX by showing translation progress and updating incrementally
 */
export function useProgressiveTranslation(): ProgressiveTranslationHook {
  const [translations, setTranslations] = useState<Map<string, TranslationProgress>>(new Map());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const updateTranslation = useCallback((messageId: string, update: Partial<TranslationProgress>) => {
    setTranslations(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(messageId) || {
        messageId,
        status: 'idle',
        progress: 0
      };
      newMap.set(messageId, { ...current, ...update });
      return newMap;
    });
  }, []);

  const startTranslation = useCallback(async (
    messageId: string,
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ) => {
    // Cancel any existing translation for this message
    const existingController = abortControllersRef.current.get(messageId);
    if (existingController) {
      existingController.abort();
    }

    // Create new abort controller
    const controller = new AbortController();
    abortControllersRef.current.set(messageId, controller);

    // Initialize translation state
    updateTranslation(messageId, {
      status: 'translating',
      progress: 10,
      translatedText: undefined,
      error: undefined
    });

    try {
      // Simulate progressive loading for better UX
      const progressSteps = [20, 40, 60, 80];
      let currentStep = 0;

      const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length && !controller.signal.aborted) {
          updateTranslation(messageId, {
            progress: progressSteps[currentStep]
          });
          currentStep++;
        } else {
          clearInterval(progressInterval);
        }
      }, 200); // Update progress every 200ms

      // Make the actual translation request
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLanguage,
          sourceLanguage
        }),
        signal: controller.signal
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (controller.signal.aborted) {
        return; // Request was cancelled
      }

      // Update with completed translation
      updateTranslation(messageId, {
        status: 'completed',
        progress: 100,
        translatedText: data.translation.translatedText,
        error: undefined
      });

      console.log('✅ Progressive translation completed:', {
        messageId,
        originalText: text,
        translatedText: data.translation.translatedText,
        translator: data.translation.translator
      });

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('🚫 Translation cancelled for message:', messageId);
        return;
      }

      console.error('❌ Progressive translation failed:', error);
      
      updateTranslation(messageId, {
        status: 'error',
        progress: 0,
        error: error.message || 'Translation failed'
      });
    } finally {
      // Clean up abort controller
      abortControllersRef.current.delete(messageId);
    }
  }, [updateTranslation]);

  const getTranslationStatus = useCallback((messageId: string): TranslationProgress | null => {
    return translations.get(messageId) || null;
  }, [translations]);

  const clearTranslation = useCallback((messageId: string) => {
    // Cancel any ongoing translation
    const controller = abortControllersRef.current.get(messageId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(messageId);
    }

    // Remove from state
    setTranslations(prev => {
      const newMap = new Map(prev);
      newMap.delete(messageId);
      return newMap;
    });
  }, []);

  return {
    translations,
    startTranslation,
    getTranslationStatus,
    clearTranslation
  };
}

/**
 * Utility function to format translation progress for display
 */
export function formatTranslationProgress(progress: TranslationProgress): string {
  switch (progress.status) {
    case 'idle':
      return 'Ready to translate';
    case 'translating':
      return `Translating... ${progress.progress}%`;
    case 'completed':
      return 'Translation complete';
    case 'error':
      return `Error: ${progress.error}`;
    default:
      return 'Unknown status';
  }
}

/**
 * Hook for managing multiple message translations
 */
export function useMessageTranslations() {
  const progressiveTranslation = useProgressiveTranslation();
  const [messageTranslations, setMessageTranslations] = useState<Map<string, string>>(new Map());

  const translateMessage = useCallback(async (
    messageId: string,
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ) => {
    await progressiveTranslation.startTranslation(messageId, text, targetLanguage, sourceLanguage);
    
    // Monitor translation completion
    const checkCompletion = () => {
      const status = progressiveTranslation.getTranslationStatus(messageId);
      if (status?.status === 'completed' && status.translatedText) {
        setMessageTranslations(prev => {
          const newMap = new Map(prev);
          newMap.set(messageId, status.translatedText!);
          return newMap;
        });
      } else if (status?.status === 'translating') {
        // Check again in 100ms
        setTimeout(checkCompletion, 100);
      }
    };
    
    checkCompletion();
  }, [progressiveTranslation]);

  const getMessageTranslation = useCallback((messageId: string): string | null => {
    return messageTranslations.get(messageId) || null;
  }, [messageTranslations]);

  return {
    ...progressiveTranslation,
    translateMessage,
    getMessageTranslation,
    messageTranslations
  };
}
