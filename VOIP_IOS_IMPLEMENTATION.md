# iOS VOIP Implementation Guide

## Quick Setup

### 1. Enable Capabilities in Xcode
- Background Modes → Voice over IP
- Push Notifications

### 2. Register VOIP Token
```swift
func registerVoipToken() {
    let voipRegistry = PKPushRegistry(queue: DispatchQueue.main)
    voipRegistry.delegate = self
    voipRegistry.desiredPushTypes = [.voIP]
}

func pushRegistry(_ registry: PKPushRegistry, didUpdate credentials: PKPushCredentials, for type: PKPushType) {
    let deviceToken = credentials.token.map { String(format: "%02x", $0) }.joined()
    
    // Send to backend API
    // Update user with: voip_token and platforms: ["ios"]
}
```

### 3. Handle Incoming Calls
```swift
func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType) {
    if type == .voIP {
        if let call = payload.dictionaryPayload["call"] as? [String: Any],
           let roomId = call["room_id"] as? String,
           let callType = call["call_type"] as? String {
            
            // Launch call UI with roomId and callType
        }
    }
}
```

### 4. Payload Structure
```json
{
  "call": {
    "call_id": 123,
    "room_id": "abc123",
    "call_type": "audio",
    "chat_id": 456
  },
  "user": {
    "user_id": 789,
    "full_name": "John Doe",
    "profile_pic": "url"
  }
}
```

### 5. Backend Integration
- Send VOIP token to your user update endpoint
- Set `platforms: ["ios"]`
- Backend automatically sends VOIP when calls are made via `/api/call/make-call`

## Testing
Use sandbox environment (`PUSH_PRODUCTION=false`) for development.

## Support
Check server logs for: `✅ VOIP notification sent to user X`
