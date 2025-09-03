import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'standardwebhooks';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// 🔐 Clerk Webhook Handler for Real-time Profile Sync
// Automatically syncs user profile changes from Clerk to database

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('Please add CLERK_WEBHOOK_SECRET to your environment variables');
}

export async function POST(request: NextRequest) {
  try {
    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json(
        { error: 'Missing required Svix headers' },
        { status: 400 }
      );
    }

    // Get the body
    const payload = await request.text();

    // Create a new Svix instance with your webhook secret
    const wh = new Webhook(webhookSecret!);

    let evt: any;

    // Verify the payload with the headers
    try {
      evt = wh.verify(payload, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err) {
      console.error('❌ Error verifying webhook:', err);
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    // Handle the webhook event
    const { type, data } = evt;
    console.log(`🔔 Clerk webhook received: ${type}`, data?.id);

    switch (type) {
      case 'user.created':
        await handleUserCreated(data);
        break;
      
      case 'user.updated':
        await handleUserUpdated(data);
        break;
      
      case 'user.deleted':
        await handleUserDeleted(data);
        break;
      
      default:
        console.log(`ℹ️ Unhandled webhook type: ${type}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 👤 Handle user creation
async function handleUserCreated(data: any) {
  try {
    const {
      id: clerkId,
      username,
      email_addresses,
      first_name,
      last_name,
      image_url,
      public_metadata
    } = data;

    const email = email_addresses?.[0]?.email_address || '';
    const name = `${first_name || ''} ${last_name || ''}`.trim() || username || 'User';
    const avatarUrl = image_url || '';
    
    // Extract language preference from public metadata
    const language = public_metadata?.language || 'en';

    await sql`
      INSERT INTO users (
        clerk_id, 
        username, 
        email, 
        name, 
        avatar_url, 
        language,
        is_online,
        created_at,
        updated_at
      )
      VALUES (
        ${clerkId}, 
        ${username || email.split('@')[0] || `user_${Date.now()}`}, 
        ${email}, 
        ${name}, 
        ${avatarUrl}, 
        ${language},
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (clerk_id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url,
        language = EXCLUDED.language,
        updated_at = CURRENT_TIMESTAMP
    `;

    console.log(`✅ User created/updated in database: ${clerkId}`);
  } catch (error) {
    console.error('❌ Error handling user.created:', error);
    throw error;
  }
}

// 🔄 Handle user updates (profile changes, language preferences)
async function handleUserUpdated(data: any) {
  try {
    const {
      id: clerkId,
      username,
      email_addresses,
      first_name,
      last_name,
      image_url,
      public_metadata
    } = data;

    const email = email_addresses?.[0]?.email_address || '';
    const name = `${first_name || ''} ${last_name || ''}`.trim() || username || 'User';
    const avatarUrl = image_url || '';
    
    // Extract language preference from public metadata
    const language = public_metadata?.language || 'en';

    // Update user in database
    await sql`
      UPDATE users 
      SET 
        username = ${username || email.split('@')[0] || `user_${Date.now()}`},
        email = ${email},
        name = ${name},
        avatar_url = ${avatarUrl},
        language = ${language},
        updated_at = CURRENT_TIMESTAMP
      WHERE clerk_id = ${clerkId}
    `;

    console.log(`✅ User profile updated in database: ${clerkId}`, {
      name,
      language,
      avatarUrl: avatarUrl ? 'Updated' : 'No change'
    });

    // 🚀 Real-time broadcast user profile update to connected clients
    await broadcastUserProfileUpdate(clerkId, {
      name,
      avatarUrl,
      language
    });

  } catch (error) {
    console.error('❌ Error handling user.updated:', error);
    throw error;
  }
}

// 🗑️ Handle user deletion
async function handleUserDeleted(data: any) {
  try {
    const { id: clerkId } = data;

    // Soft delete or mark as inactive
    await sql`
      UPDATE users 
      SET 
        is_online = false,
        updated_at = CURRENT_TIMESTAMP
      WHERE clerk_id = ${clerkId}
    `;

    console.log(`✅ User marked as inactive: ${clerkId}`);
  } catch (error) {
    console.error('❌ Error handling user.deleted:', error);
    throw error;
  }
}

// 📡 Broadcast user profile updates to real-time clients
async function broadcastUserProfileUpdate(clerkId: string, updates: any) {
  try {
    // This would integrate with your Socket.IO server
    // For now, we'll use PostgreSQL NOTIFY for real-time updates
    await sql`
      SELECT pg_notify('user_profile_updated', json_build_object(
        'user_id', ${clerkId},
        'updates', ${JSON.stringify(updates)},
        'timestamp', extract(epoch from now())
      )::text)
    `;

    console.log(`📡 Broadcasted profile update for user: ${clerkId}`);
  } catch (error) {
    console.error('❌ Error broadcasting profile update:', error);
  }
}
