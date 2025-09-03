# 🔗 **Clerk Webhook Setup Guide**

## **🎯 Overview**
This guide helps you set up Clerk webhooks to automatically sync user profile changes (name, avatar, language preferences) from Clerk to your Lingua Link database.

## **🔧 Setup Steps**

### **1. Get Your Webhook Secret**
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Webhooks** in the sidebar
4. Click **Add Endpoint**
5. Set the endpoint URL: `https://your-domain.com/api/webhooks/clerk`
6. Select these events:
   - `user.created`
   - `user.updated` 
   - `user.deleted`
7. Copy the **Signing Secret**

### **2. Add Environment Variable**
Add this to your `.env.local` file:

```bash
# Clerk Webhook Secret
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### **3. Test the Webhook**
1. Deploy your application or use ngrok for local testing:
   ```bash
   # For local testing with ngrok
   ngrok http 3000
   # Use the ngrok URL: https://abc123.ngrok.io/api/webhooks/clerk
   ```

2. Update a user profile in Clerk Dashboard
3. Check your application logs for webhook events

## **🚀 Features Enabled**

### **Automatic Profile Sync**
- ✅ **Name changes** → Instantly synced to database
- ✅ **Avatar updates** → Automatically updated
- ✅ **Language preferences** → Real-time sync
- ✅ **Email changes** → Kept in sync

### **Real-time Updates**
- 📡 **Socket.IO broadcasts** → All connected clients get updates
- 🔄 **Database triggers** → PostgreSQL NOTIFY for real-time events
- ⚡ **Instant UI updates** → No page refresh needed

## **🔍 Webhook Events Handled**

### **user.created**
```json
{
  "type": "user.created",
  "data": {
    "id": "user_123",
    "username": "johndoe",
    "email_addresses": [{"email_address": "john@example.com"}],
    "first_name": "John",
    "last_name": "Doe",
    "image_url": "https://...",
    "public_metadata": {
      "language": "es"
    }
  }
}
```

### **user.updated**
```json
{
  "type": "user.updated",
  "data": {
    "id": "user_123",
    "first_name": "Johnny",
    "public_metadata": {
      "language": "fr"
    }
  }
}
```

## **🛠️ Troubleshooting**

### **Common Issues**

1. **Webhook not receiving events**
   - Check the endpoint URL is correct
   - Verify HTTPS is used (required by Clerk)
   - Check firewall/network settings

2. **Signature verification fails**
   - Ensure `CLERK_WEBHOOK_SECRET` is correct
   - Check for extra spaces or characters
   - Verify the secret starts with `whsec_`

3. **Database updates not working**
   - Check database connection
   - Verify user exists in database
   - Check application logs for errors

### **Debug Mode**
Enable detailed logging by checking your application logs:

```bash
# Check webhook events
tail -f logs/webhook.log

# Or check console output
npm run dev
```

## **🔐 Security Notes**

- ✅ **Signature verification** → All webhooks are cryptographically verified
- ✅ **HTTPS required** → Clerk only sends to HTTPS endpoints
- ✅ **Rate limiting** → Built-in protection against abuse
- ✅ **Error handling** → Graceful failure with logging

## **📊 Monitoring**

The webhook endpoint provides detailed logging:
- ✅ Successful profile updates
- ⚠️ Warning for missing data
- ❌ Errors with full context
- 📡 Real-time broadcast confirmations

## **🎉 Benefits**

1. **Zero Manual Sync** → Profile changes are automatic
2. **Real-time Updates** → Instant UI updates across all devices
3. **Consistent Data** → Database always matches Clerk
4. **Better UX** → Users see changes immediately
5. **Scalable** → Handles high-volume profile updates

---

**Need Help?** Check the application logs or contact support!
