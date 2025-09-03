import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    console.log('🔍 Running database health check...');
    
    // Test basic connection
    const connectionTest = await sql`SELECT 1 as test, NOW() as timestamp`;
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    const tableNames = tables.map(t => t.table_name);
    console.log('📋 Existing tables:', tableNames);
    
    // Check required tables
    const requiredTables = ['users', 'rooms', 'room_participants', 'files', 'messages'];
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    // Count records in each table
    const tableCounts: Record<string, number> = {};
    for (const table of tableNames) {
      try {
        const result = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`;
        tableCounts[table] = parseInt(result[0].count);
      } catch (error) {
        console.warn(`⚠️ Could not count records in ${table}:`, error);
        tableCounts[table] = -1;
      }
    }
    
    // Check indexes
    const indexes = await sql`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `;
    
    const healthStatus = {
      status: missingTables.length === 0 ? 'healthy' : 'needs_initialization',
      timestamp: new Date().toISOString(),
      connection: {
        status: 'connected',
        timestamp: connectionTest[0].timestamp
      },
      tables: {
        existing: tableNames,
        missing: missingTables,
        counts: tableCounts
      },
      indexes: indexes.map(idx => ({
        name: idx.indexname,
        table: idx.tablename
      })),
      recommendations: []
    };
    
    // Add recommendations
    if (missingTables.length > 0) {
      healthStatus.recommendations.push({
        type: 'error',
        message: `Missing required tables: ${missingTables.join(', ')}`,
        action: 'Run database initialization: POST /api/init-db'
      });
    }
    
    if (tableCounts.users === 0) {
      healthStatus.recommendations.push({
        type: 'info',
        message: 'No users in database',
        action: 'Users will be created automatically when they sign in'
      });
    }
    
    console.log('✅ Database health check completed');
    
    return NextResponse.json(healthStatus);
    
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      connection: {
        status: 'failed'
      },
      recommendations: [
        {
          type: 'error',
          message: 'Database connection failed',
          action: 'Check DATABASE_URL environment variable and database status'
        }
      ]
    }, { status: 500 });
  }
}

// Initialize database if needed
export async function POST() {
  try {
    console.log('🔧 Initializing database via health check...');
    
    const initResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/init-db`, {
      method: 'POST'
    });
    
    if (!initResponse.ok) {
      throw new Error(`Database initialization failed: ${initResponse.status}`);
    }
    
    const initResult = await initResponse.json();
    
    // Run health check after initialization
    const healthResponse = await GET();
    const healthData = await healthResponse.json();
    
    return NextResponse.json({
      message: 'Database initialized and health check completed',
      initialization: initResult,
      health: healthData
    });
    
  } catch (error) {
    console.error('❌ Database initialization via health check failed:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Database initialization failed'
    }, { status: 500 });
  }
}
