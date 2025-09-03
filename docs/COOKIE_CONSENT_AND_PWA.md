# 🍪 Cookie Consent & PWA Implementation

## **Overview**

Lingua Link now includes a comprehensive cookie consent system and PWA (Progressive Web App) optimization for mobile deployment via Bubblewrap and desktop deployment via Pake.

## **🍪 Cookie Consent System**

### **Features**
- ✅ **GDPR Compliant** - Full user control over data collection
- ✅ **PWA Optimized** - Special handling for standalone app mode
- ✅ **Mobile Friendly** - Responsive design for all screen sizes
- ✅ **Permission Integration** - Automatically requests browser permissions
- ✅ **Persistent Storage** - Remembers user preferences

### **Permission Categories**

#### **Essential (Always Required)**
- Authentication cookies
- Security tokens
- Core messaging functionality

#### **Push Notifications**
- Real-time message notifications
- Offline message alerts
- PWA-optimized notification handling

#### **Offline Storage**
- Persistent storage for PWA
- Message caching for offline access
- Settings synchronization

#### **Analytics (Optional)**
- Translation quality metrics
- App performance monitoring
- User experience improvements

### **Implementation**

The cookie consent appears automatically on first visit and provides:

1. **Quick Accept** - One-click to enable all features
2. **Essential Only** - Minimal functionality mode
3. **Custom Preferences** - Granular control over each category

```typescript
// Usage in components
import CookieConsent from '@/components/CookieConsent';

<CookieConsent 
  onAccept={() => console.log('User accepted')}
  onDecline={() => console.log('User declined')}
/>
```

## **📱 PWA Implementation**

### **PWA Manager Features**

The `PWAPermissionManager` provides:

- ✅ **Device Detection** - iOS, Android, mobile, desktop
- ✅ **Standalone Mode Detection** - PWA vs browser mode
- ✅ **Permission Management** - Notifications, storage, media
- ✅ **Service Worker Registration** - Offline functionality
- ✅ **Install Prompt Handling** - Add to home screen

### **PWA Capabilities Detection**

```typescript
import { getPWAManager } from '@/lib/pwa-permissions';

const pwaManager = getPWAManager();

// Check if running as PWA
const isPWA = pwaManager.isPWAMode();

// Get device-specific recommendations
const recommendations = pwaManager.getDeviceRecommendations();

// Request permissions
await pwaManager.requestNotificationPermission();
await pwaManager.requestPersistentStorage();
```

### **Mobile Deployment Strategy**

#### **Bubblewrap (Android)**
```bash
# Install Bubblewrap
npm install -g @bubblewrap/cli

# Initialize PWA
bubblewrap init --manifest https://localhost:3000/manifest.json

# Build APK
bubblewrap build

# Upload to Google Play Store manually
```

#### **Pake (Desktop)**
```bash
# Install Pake
npm install -g pake-cli

# Build desktop app
pake https://localhost:3000 --name "Lingua Link" --icon icon-512.png

# Distribute as desktop application
```

## **🔑 Multiple API Key Support**

### **Featherless.ai Concurrency Enhancement**

Based on Featherless.ai documentation:
- **Feather Basic**: 2 concurrent connections
- **Feather Premium**: 4 concurrent connections  
- **Multiple Keys**: Linear scaling of concurrency

### **Environment Variables**

```env
# Primary key
FEATHERLESS_API_KEY=rc_your_primary_key

# Additional keys for enhanced concurrency
FEATHERLESS_API_KEY_1=rc_your_second_key
FEATHERLESS_API_KEY_2=rc_your_third_key
# ... up to FEATHERLESS_API_KEY_10
```

### **Key Rotation Strategy**

The system automatically:
1. **Detects all available keys** from environment variables
2. **Distributes load** using round-robin with usage tracking
3. **Handles rate limits** by switching to least-used keys
4. **Provides fallback** to OpenAI if all Featherless keys are exhausted

### **Concurrency Benefits**

With multiple Featherless API keys:
- **2 keys**: Up to 4 concurrent translations (Basic plan)
- **3 keys**: Up to 6 concurrent translations
- **4 keys**: Up to 8 concurrent translations

Perfect for high-traffic scenarios and group conversations.

## **🔧 Configuration**

### **Environment Setup**

```env
# Multiple Featherless keys for enhanced concurrency
FEATHERLESS_API_KEY=rc_primary_key
FEATHERLESS_API_KEY_1=rc_second_key
FEATHERLESS_API_KEY_2=rc_third_key

# OpenAI backup (optional)
OPENAI_API_KEY=sk-your_openai_key

# PWA Configuration
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your_email@domain.com
```

### **Health Check**

Visit `/api/health/system` to verify:
- Multiple API key detection
- PWA service worker status
- Database schema compliance
- Permission system status

## **🚀 Deployment Checklist**

### **Web Deployment**
- [ ] Configure multiple Featherless API keys
- [ ] Set up VAPID keys for push notifications
- [ ] Verify PWA manifest and service worker
- [ ] Test cookie consent flow
- [ ] Validate offline functionality

### **Mobile PWA (Bubblewrap)**
- [ ] Test standalone mode detection
- [ ] Verify notification permissions work
- [ ] Test offline message caching
- [ ] Validate home screen installation
- [ ] Test app store submission process

### **Desktop PWA (Pake)**
- [ ] Test desktop app packaging
- [ ] Verify window management
- [ ] Test notification integration
- [ ] Validate auto-updater (if configured)

## **🔍 Testing**

### **Cookie Consent Testing**
1. Clear browser data
2. Visit application
3. Verify consent dialog appears
4. Test "Accept All" flow
5. Test "Essential Only" flow
6. Test custom preferences
7. Verify preferences persistence

### **PWA Testing**
1. Install as PWA (Add to Home Screen)
2. Test offline functionality
3. Verify push notifications
4. Test standalone mode detection
5. Validate service worker registration

### **API Key Testing**
1. Check health endpoint shows multiple keys
2. Send concurrent translation requests
3. Monitor key rotation in logs
4. Test rate limit handling
5. Verify fallback to OpenAI

## **📊 Monitoring**

The system provides detailed logging for:
- Cookie consent decisions
- PWA mode detection
- API key usage and rotation
- Permission request outcomes
- Translation service performance

Monitor these logs to optimize user experience and API usage.
