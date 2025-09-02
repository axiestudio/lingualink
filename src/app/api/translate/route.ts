import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getTranslationService } from '@/lib/translation';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, targetLanguage, sourceLanguage } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json({ 
        error: 'Missing required fields: text and targetLanguage' 
      }, { status: 400 });
    }

    const translationService = getTranslationService();
    const result = await translationService.translateText(text, targetLanguage, sourceLanguage);

    return NextResponse.json({
      success: true,
      translation: result
    });

  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ 
      error: 'Translation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
