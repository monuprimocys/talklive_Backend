# VOIP Integration Guide for TalkLive Backend

## Overview
This guide explains the VOIP (Voice over IP) functionality that has been integrated into the TalkLive backend for handling incoming call notifications on iOS devices.

## What Was Added

### 1. Database Schema Changes
- **File**: `models/User.js`
- **Change**: Added `voip_token` field to store iOS VOIP device tokens
- **Type**: STRING, nullable, default empty string

### 2. New Routes
- **File**: `src/routes/voip.routes.js` (new file)
- **Endpoint**: `POST /api/voip/incoming-call`
- **Purpose**: Standalone endpoint for sending VOIP notifications (mainly for testing)

### 3. Route Registration
- **File**: `src/routes/index.routes.js`
- **Change**: Registered VOIP routes at `/api/voip`

### 4. Call Controller Integration
- **File**: `src/controller/call_controller/make_call.controller.js`
- **Change**: Integrated automatic VOIP notification sending in the make-call flow
- **Logic**: Automatically sends VOIP push notifications to iOS users when calls are made

### 5. Service Layer Updates
- **File**: `src/service/repository/user.service.js`
- **Change**: Updated `getUser` function to support custom attributes parameter
- **Purpose**: Allows selective field retrieval including `voip_token` and `platforms`

### 6. Environment Configuration
- **File**: `.env.example` (new file)
- **Variables**: 
  - `PUSH_TEAM_ID`
  - `PUSH_KEY_ID`
  - `PUSH_BUNDLE_ID`
  - `PUSH_PRODUCTION`

## Existing Components (Already Present)

The following VOIP components were already present in your project:

- `config/voipConfig.js` - APNs configuration
- `src/service/voipService.js` - VOIP notification service
- `src/helper/apnsToken.js` - JWT token generation for APNs
- `src/controller/voipController.js` - VOIP controller
- `certs/AuthKey_X7FGCTU477.p8` - Apple APNs certificate

## Setup Instructions

### 1. Environment Variables
Add the following to your `.env` file:

```env
PUSH_TEAM_ID=your_team_id_here
PUSH_KEY_ID=your_key_id_here
PUSH_BUNDLE_ID=your_bundle_id_here
PUSH_PRODUCTION=false
```

**Note**: 
- Set `PUSH_PRODUCTION=false` for development/sandbox
- Set `PUSH_PRODUCTION=true` for production

### 2. Database Migration
The `voip_token` field will be automatically added to the User table when the server starts due to the `alter: true` setting in `index.js`.

### 3. iOS App Requirements
Your iOS app needs to:
- Enable "Background Modes" → "Voice over IP"
- Enable "Push Notifications"
- Register VOIP tokens and send them to the backend
- Store the token in the `voip_token` field
- Set `platforms` to include "ios"

## API Endpoints

### 1. Make Call (Integrated with VOIP) - **RECOMMENDED**
**Endpoint**: `POST /api/call/make-call`

**Purpose**: Initiate a call with automatic VOIP notifications to iOS participants

**Request Body**:
```json
{
  "chat_id": "number",
  "peer_id": "number (optional)",
  "call_type": "string (audio/video)"
}
```

**Features**:
- ✅ Creates call record in database
- ✅ Sends regular push notifications to all participants
- ✅ **Automatically sends VOIP notifications to iOS users**
- ✅ Emits socket events for real-time updates
- ✅ Handles paid call logic

### 2. Send VOIP Notification (Standalone) - **TESTING ONLY**
**Endpoint**: `POST /api/voip/incoming-call`

**Purpose**: Send VOIP push notification to a specific user (for testing)

**Request Body**:
```json
{
  "userId": "number",
  "caller_id": "string",
  "caller_name": "string"
}
```

**Note**: This endpoint is mainly for testing. Use `/api/call/make-call` for actual call functionality.

## How VOIP Integration Works

### Automatic Flow
When `POST /api/call/make-call` is called:

1. **Call Record Creation**: New call entry in database
2. **Regular Push Notifications**: Sent via OneSignal to all participants
3. **VOIP Push Notifications**: Automatically sent to iOS users who:
   - Have a valid `voip_token`
   - Have "ios" in their `platforms` array
4. **Socket Events**: Real-time notifications emitted
5. **Response**: Call details returned

### VOIP Payload Structure
The VOIP notification includes:
```json
{
  "aps": {
    "alert": {
      "title": "Incoming Call",
      "body": "Caller Name is calling..."
    },
    "content-available": 1
  },
  "uuid": "timestamp",
  "call": {
    "call_id": "number",
    "room_id": "string",
    "call_type": "audio/video",
    "chat_id": "number",
    "peer_id": "string",
    "current_users": "number",
    "start_time": "ISO_date"
  },
  "user": {
    "user_id": "number",
    "user_name": "string",
    "full_name": "string",
    "profile_pic": "string"
  },
  "chat": {
    "chat_id": "number",
    "chat_name": "string",
    "group_name": "string|null",
    "is_private": "boolean"
  },
  "voip": {
    "push_type": "voip",
    "priority": "high",
    "ttl": 30
  }
}
```

## Testing

### 1. Development Environment
```bash
# Ensure .env has PUSH_PRODUCTION=false
# Start the server
npm run dev
```

### 2. Test VOIP Endpoint
```bash
curl -X POST http://localhost:3000/api/voip/incoming-call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "userId": 123,
    "caller_id": "456",
    "caller_name": "John Doe"
  }'
```

### 3. Test Integrated Call
```bash
curl -X POST http://localhost:3000/api/call/make-call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "chat_id": 1,
    "call_type": "audio"
  }'
```

## iOS App Integration

### 1. Register VOIP Token
```swift
// In your iOS app, register for VOIP push notifications
// and send the token to your backend

func registerVoipToken() {
    let voipRegistry = PKPushRegistry(queue: DispatchQueue.main)
    voipRegistry.delegate = self
    voipRegistry.desiredPushTypes = [.voIP]
}

func pushRegistry(_ registry: PKPushRegistry, didUpdate credentials: PKPushCredentials, for type: PKPushType) {
    let deviceToken = credentials.token.map { String(format: "%02x", $0) }.joined()
    
    // Send this token to your backend
    // Update user record with:
    // voip_token: deviceToken
    // platforms: ["ios"]
}
```

### 2. Handle Incoming VOIP Push
```swift
func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType) {
    if type == .voIP {
        // Extract call information
        if let callId = payload.dictionaryPayload["call"] as? [String: Any] {
            // Launch your call UI
            let roomId = callId["room_id"] as? String
            let callType = callId["call_type"] as? String
            
            // Present incoming call UI
        }
    }
}
```

## Troubleshooting

### Common Issues

1. **VOIP notifications not received**
   - Verify user has `voip_token` set
   - Check `platforms` includes "ios"
   - Ensure APNs environment matches (sandbox vs production)
   - Check certificate file permissions

2. **403 Authentication Error**
   - Verify AuthKey.p8 file exists in `certs/` directory
   - Check team ID, key ID, bundle ID in .env
   - Ensure certificate has correct permissions

3. **400 Bad Request**
   - Validate device token format
   - Check payload structure
   - Verify user has VOIP token

### Server Logs
Monitor server logs for:
```
✅ VOIP notification sent to user X
❌ Failed to send VOIP to user X: error_details
📩 APNS STATUS: 200  // Success
📩 APNS STATUS: 400  // Bad request
```

## Security Considerations

- VOIP tokens are sensitive - treat them like passwords
- Use HTTPS in production
- Validate all user inputs
- Implement rate limiting for VOIP endpoints
- Monitor for abuse

## Production Deployment Checklist

- [ ] Valid AuthKey.p8 certificate in `certs/` directory
- [ ] Correct team ID, key ID, bundle ID in .env
- [ ] `PUSH_PRODUCTION=true` in .env
- [ ] Database migrated with voip_token field
- [ ] iOS app updated for VOIP handling
- [ ] SSL verification enabled
- [ ] Error monitoring and logging setup
- [ ] Rate limiting implemented

## Files Modified/Created

### Modified Files:
1. `models/User.js` - Added voip_token field
2. `src/routes/index.routes.js` - Registered VOIP routes
3. `src/controller/call_controller/make_call.controller.js` - Integrated VOIP notifications
4. `src/service/repository/user.service.js` - Added attributes parameter to getUser
5. `src/controller/voipController.js` - Updated to use new getUser signature

### Created Files:
1. `src/routes/voip.routes.js` - VOIP route definitions
2. `.env.example` - Environment variables template
3. `VOIP_INTEGRATION_GUIDE.md` - This documentation

### Existing Files (No Changes):
- `config/voipConfig.js`
- `src/service/voipService.js`
- `src/helper/apnsToken.js`
- `src/controller/voipController.js`
- `certs/AuthKey_X7FGCTU477.p8`

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify iOS app VOIP token registration
3. Test with sandbox environment first
4. Validate all environment variables

**Last Updated**: June 30, 2026
