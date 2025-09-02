import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateUserLanguage, getUserLanguage } from '@/app/actions';

// Get user language preference
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const language = await getUserLanguage(userId);

    return NextResponse.json({
      success: true,
      language
    });

  } catch (error) {
    console.error('Error getting user language:', error);
    return NextResponse.json({ 
      error: 'Failed to get language preference' 
    }, { status: 500 });
  }
}

// Update user language preference
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { language } = await request.json();

    if (!language) {
      return NextResponse.json({ 
        error: 'Language is required' 
      }, { status: 400 });
    }

    const updatedUser = await updateUserLanguage(userId, language);

    return NextResponse.json({
      success: true,
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user language:', error);
    return NextResponse.json({ 
      error: 'Failed to update language preference' 
    }, { status: 500 });
  }
}
