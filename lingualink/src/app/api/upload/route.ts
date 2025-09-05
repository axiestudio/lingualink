import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';
import { apiRateLimit, getClientIP } from '@/lib/rate-limiter';
import { logUnauthorizedAccess, logRateLimitExceeded, logDataAccess } from '@/lib/security-audit';

const sql = neon(process.env.DATABASE_URL!);

// File upload configuration
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  // Images
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Documents
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv', 'application/rtf',
  // Archives
  'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
  // Audio
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm',
  // Video
  'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv',
  // Other
  'application/json', 'application/xml'
];

// Upload file endpoint
export async function POST(request: NextRequest) {
  try {
    console.log('📁 File upload request received');

    // 🔒 SECURITY: Authentication check
    const { userId } = await auth();
    if (!userId) {
      const clientIP = getClientIP(request);
      logUnauthorizedAccess(undefined, clientIP, '/api/upload', request.headers.get('user-agent') || undefined);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🔒 SECURITY: Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = apiRateLimit.check(`${userId}:${clientIP}`);
    if (!rateLimitResult.allowed) {
      logRateLimitExceeded(userId, clientIP, '/api/upload', request.headers.get('user-agent') || undefined);
      return NextResponse.json({
        error: 'Too many upload requests. Please try again later.',
        resetTime: rateLimitResult.resetTime
      }, { status: 429 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const roomId = formData.get('roomId') as string;
    const messageText = formData.get('message') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    // 🔒 SECURITY: File validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: `File type not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}` 
      }, { status: 400 });
    }

    // 🔒 SECURITY: Sanitize filename
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileExtension = path.extname(sanitizedFileName);
    const fileName = `${Date.now()}_${userId}_${sanitizedFileName}`;

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file to disk
    const filePath = path.join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);
    console.log(`✅ File saved: ${fileName}`);

    // Get file metadata
    const fileMetadata = {
      originalName: file.name,
      fileName: fileName,
      fileSize: file.size,
      fileType: file.type,
      uploadPath: `/uploads/${fileName}`,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString()
    };

    // Save file record to database
    const fileRecord = await sql`
      INSERT INTO files (
        original_name, 
        file_name, 
        file_size, 
        file_type, 
        upload_path, 
        uploaded_by, 
        room_id,
        created_at
      ) VALUES (
        ${file.name},
        ${fileName},
        ${file.size},
        ${file.type},
        ${fileMetadata.uploadPath},
        ${userId},
        ${roomId},
        CURRENT_TIMESTAMP
      ) RETURNING *
    `;

    // Create message with file attachment
    const messageWithFile = await sql`
      INSERT INTO messages (
        room_id,
        sender_clerk_id,
        message,
        file_id,
        file_metadata,
        created_at
      ) VALUES (
        ${roomId},
        ${userId},
        ${messageText || `📎 Shared a file: ${file.name}`},
        ${fileRecord[0].id},
        ${JSON.stringify(fileMetadata)},
        CURRENT_TIMESTAMP
      ) RETURNING *
    `;

    // Get sender info for broadcasting
    const senderInfo = await sql`
      SELECT username, name, avatar_url
      FROM users
      WHERE clerk_id = ${userId}
    `;

    // Prepare message for real-time broadcast
    const messageForBroadcast = {
      ...messageWithFile[0],
      username: senderInfo[0]?.username || 'Unknown',
      sender_name: senderInfo[0]?.name || 'Unknown',
      sender_avatar: senderInfo[0]?.avatar_url || '',
      file_metadata: fileMetadata,
      has_file: true
    };

    // Broadcast file message via Socket.IO
    try {
      if (global.io) {
        console.log('📡 Broadcasting file message via Socket.IO');
        global.io.to(`room_${roomId}`).except(`user_${userId}`).emit('new_message', {
          type: 'new_message',
          payload: messageForBroadcast,
          timestamp: new Date().toISOString()
        });
        console.log('✅ File message broadcast completed');
      }
    } catch (socketError) {
      console.error('❌ Socket.IO broadcast failed:', socketError);
    }

    // Log successful upload
    logDataAccess(userId, clientIP, '/api/upload', 'FILE_UPLOAD', request.headers.get('user-agent') || undefined);

    return NextResponse.json({
      success: true,
      message: messageForBroadcast,
      file: fileMetadata
    });

  } catch (error) {
    console.error('❌ File upload error:', error);
    return NextResponse.json({
      error: 'File upload failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get file info endpoint
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'File ID required' }, { status: 400 });
    }

    const fileInfo = await sql`
      SELECT * FROM files WHERE id = ${fileId}
    `;

    if (fileInfo.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      file: fileInfo[0]
    });

  } catch (error) {
    console.error('❌ Get file info error:', error);
    return NextResponse.json({
      error: 'Failed to get file info'
    }, { status: 500 });
  }
}
