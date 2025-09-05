import { neon } from '@neondatabase/serverless';

// Global broadcaster instance
let broadcasterInstance: RealtimeBroadcaster | null = null;

export class RealtimeBroadcaster {
  private client: any;
  private isListening = false;
  private connections = new Map<string, { 
    controller: ReadableStreamDefaultController;
    userId: string;
  }>();

  constructor() {
    this.client = neon(process.env.DATABASE_URL!);
  }

  // Add connection for broadcasting
  addConnection(userId: string, controller: ReadableStreamDefaultController) {
    this.connections.set(userId, { controller, userId });
    console.log(`🔌 Added connection for user: ${userId}`);
    console.log(`📊 Total connections: ${this.connections.size}`);
  }

  // Remove connection
  removeConnection(userId: string) {
    this.connections.delete(userId);
    console.log(`🔌 Removed connection for user: ${userId}`);
    console.log(`📊 Total connections: ${this.connections.size}`);
  }

  // Start listening for database notifications
  async startListening() {
    if (this.isListening) return;

    try {
      console.log('🎧 Starting PostgreSQL notification listener...');
      
      // Note: Neon doesn't support LISTEN/NOTIFY in the same way as regular PostgreSQL
      // We'll use a polling approach instead for now
      this.isListening = true;
      console.log('✅ Real-time broadcaster started');
      
    } catch (error) {
      console.error('❌ Failed to start real-time broadcaster:', error);
    }
  }

  // Broadcast message to specific room participants
  async broadcastToRoom(roomId: string, messageData: any, senderUserId: string) {
    console.log(`📡 Broadcasting message to room ${roomId} (excluding sender ${senderUserId})`);
    
    try {
      // Get room participants
      const participants = await this.client`
        SELECT DISTINCT user_clerk_id 
        FROM room_participants 
        WHERE room_id = ${roomId}
      `;
      
      const participantIds = participants.map((p: any) => p.user_clerk_id);
      console.log(`👥 Room participants:`, participantIds);
      console.log(`🔌 Currently connected users:`, Array.from(this.connections.keys()));
      
      let sentCount = 0;
      
      // Send to each participant (except sender)
      participantIds.forEach((participantId: string) => {
        if (participantId === senderUserId) {
          console.log(`⏭️ Skipping sender: ${participantId}`);
          return;
        }
        
        const connection = this.connections.get(participantId);
        if (connection) {
          try {
            const eventData = `data: ${JSON.stringify({
              type: 'new_message',
              payload: messageData
            })}\n\n`;
            
            connection.controller.enqueue(new TextEncoder().encode(eventData));
            console.log(`📤 Message delivered to user: ${participantId}`);
            sentCount++;
          } catch (error) {
            console.error(`❌ Failed to send message to user ${participantId}:`, error);
            this.connections.delete(participantId);
          }
        } else {
          console.log(`📴 User ${participantId} not connected`);
        }
      });
      
      console.log(`✅ Broadcast complete: ${sentCount}/${participantIds.length - 1} recipients`);
      
    } catch (error) {
      console.error('❌ Error broadcasting message:', error);
    }
  }

  // Stop listening
  stopListening() {
    this.isListening = false;
    console.log('🛑 Real-time broadcaster stopped');
  }
}

// Get singleton instance
export function getBroadcaster(): RealtimeBroadcaster {
  if (!broadcasterInstance) {
    broadcasterInstance = new RealtimeBroadcaster();
    broadcasterInstance.startListening();
  }
  return broadcasterInstance;
}

// Export for use in API routes
export { broadcasterInstance };
