import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Get user's language preferences (supporting multiple languages)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await sql`
      SELECT language, secondary_languages FROM users WHERE clerk_id = ${userId}
    `;

    const user = result[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse secondary languages (stored as JSON array)
    let secondaryLanguages = [];
    try {
      secondaryLanguages = user.secondary_languages ? JSON.parse(user.secondary_languages) : [];
    } catch (e) {
      console.warn('Failed to parse secondary languages:', e);
      secondaryLanguages = [];
    }

    return NextResponse.json({
      success: true,
      primaryLanguage: user.language || 'en',
      secondaryLanguages,
      allLanguages: [user.language || 'en', ...secondaryLanguages]
    });
  } catch (error) {
    console.error('Error getting user languages:', error);
    return NextResponse.json({
      error: 'Failed to get user languages',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update user's language preferences (supporting multiple languages)
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { primaryLanguage, secondaryLanguages = [] } = await request.json();

    if (!primaryLanguage) {
      return NextResponse.json({ error: 'Primary language is required' }, { status: 400 });
    }

    // Validate languages
    const supportedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'];
    
    if (!supportedLanguages.includes(primaryLanguage)) {
      return NextResponse.json({ error: 'Unsupported primary language' }, { status: 400 });
    }

    for (const lang of secondaryLanguages) {
      if (!supportedLanguages.includes(lang)) {
        return NextResponse.json({ error: `Unsupported secondary language: ${lang}` }, { status: 400 });
      }
    }

    // Remove duplicates and primary language from secondary languages
    const cleanSecondaryLanguages = [...new Set(secondaryLanguages)].filter(lang => lang !== primaryLanguage);

    await sql`
      UPDATE users 
      SET 
        language = ${primaryLanguage},
        secondary_languages = ${JSON.stringify(cleanSecondaryLanguages)},
        updated_at = CURRENT_TIMESTAMP
      WHERE clerk_id = ${userId}
    `;

    console.log(`✅ Updated user ${userId} languages:`, {
      primary: primaryLanguage,
      secondary: cleanSecondaryLanguages
    });

    return NextResponse.json({
      success: true,
      primaryLanguage,
      secondaryLanguages: cleanSecondaryLanguages,
      message: 'Language preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating user languages:', error);
    return NextResponse.json({
      error: 'Failed to update user languages',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
