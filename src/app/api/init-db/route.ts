import { NextResponse } from 'next/server';
import { initializeDatabase } from '../../actions';

export async function POST() {
  try {
    const result = await initializeDatabase();
    
    if (result.success) {
      return NextResponse.json({ 
        message: "Database initialized successfully",
        success: true 
      });
    } else {
      return NextResponse.json({ 
        message: "Database initialization failed",
        error: result.error,
        success: false 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Database initialization error:", error);
    return NextResponse.json({
      message: "Database initialization failed",
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}
