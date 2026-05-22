# Audio/Video Call Frontend Implementation

This document explains how the frontend should integrate the backend call API and socket events.

## 1. Connect Socket

Socket URL uses the backend Socket.IO path:

```js
import { io } from "socket.io-client";

const socket = io(BASE_URL, {
  path: "/socket",
  auth: {
    token: USER_JWT_TOKEN,
  },
});
```

The same JWT used in REST `Authorization: Bearer <token>` must be sent in socket auth.

## 2. Start Call

Use this REST API when the caller taps audio call or video call.

```http
POST /api/call/make-call
Authorization: Bearer <token>
Content-Type: application/json
```

### Body

Use `peer_id` when there is no chat yet. Use `chat_id` when chat already exists.

```json
{
  "peer_id": 12,
  "call_type": "audio"
}
```

or:

```json
{
  "chat_id": 45,
  "call_type": "video"
}
```

`call_type` must be:

```txt
audio
video
```

### Success Response

```json
{
  "success": true,
  "call": {
    "call_id": 1,
    "call_type": "video",
    "call_status": "ringing",
    "call_duration": 0,
    "users": [10],
    "current_users": [10],
    "message_id": 100,
    "chat_id": 45,
    "user_id": 10,
    "room_id": "room_id_here",
    "caller_name": "Caller Name"
  }
}
```

Save `call_id`, `chat_id`, and `room_id`.

## 3. Incoming Call

Receiver listens for:

```js
socket.on("receiving_call", ({ call, user, chat }) => {
  // Show incoming call screen
  // call.call_type decides audio/video UI
  // user is caller info
});
```

The backend also emits `receive` with the call message for chat list/message UI.

## 4. Accept Call

Frontend must create a WebRTC/PeerJS peer id first, then emit `accept_call`.

```js
socket.emit("accept_call", {
  call_id: call.call_id,
  chat_id: call.chat_id,
  peer_id: myPeerId
});
```

After accepting, listen for `user_joined`:

```js
socket.on("user_joined", ({ user, call, peer_id }) => {
  // Connect WebRTC/PeerJS call to peer_id
  // If video call, send audio + video stream
  // If audio call, send audio-only stream
});
```

## 5. Local Media

For audio call:

```js
const stream = await navigator.mediaDevices.getUserMedia({
  audio: true,
  video: false,
});
```

For video call:

```js
const stream = await navigator.mediaDevices.getUserMedia({
  audio: true,
  video: true,
});
```

Show the local stream in the caller/receiver UI. When `user_joined` gives a remote `peer_id`, start the WebRTC/PeerJS connection and render the remote stream.

## 6. Decline Call

Receiver emits:

```js
socket.emit("decline_call", {
  call_id: call.call_id,
  chat_id: call.chat_id
});
```

Caller listens:

```js
socket.on("call_declined", ({ user, call, chat }) => {
  // Close ringing screen and show declined status
});
```

## 7. Leave or End Call

Any joined user emits:

```js
socket.emit("leave_call", {
  call_id: call.call_id,
  chat_id: call.chat_id,
  peer_id: myPeerId
});
```

Listen for:

```js
socket.on("user_left", ({ user, call, peer_id }) => {
  // Remove that remote user stream
});

socket.on("call_ended", (call) => {
  // Stop local stream tracks and close call screen
});

socket.on("missed_call", (call) => {
  // Show missed call status
});
```

Always stop local camera/microphone when leaving:

```js
stream.getTracks().forEach((track) => track.stop());
```

## 8. Mute, Speaker, Camera Toggle

For local UI, update tracks directly:

```js
audioTrack.enabled = !isMuted;
videoTrack.enabled = isCameraOn;
```

Notify other users:

```js
socket.emit("call_changes", {
  room_id: call.room_id,
  call_id: call.call_id,
  chat_id: call.chat_id,
  user_id: currentUserId,
  is_muted: true,
  is_camera_on: false
});
```

Listen:

```js
socket.on("call_changes", (data) => {
  // Update remote user mute/camera indicators
});
```

## 9. Recommended Frontend Flow

1. Connect socket after login.
2. Create PeerJS/WebRTC peer and keep `myPeerId`.
3. Caller taps audio/video.
4. Call `POST /api/call/make-call`.
5. Caller opens ringing screen.
6. Receiver gets `receiving_call` and opens incoming call screen.
7. Receiver accepts with `accept_call`.
8. Both sides use `user_joined` peer ids to connect media streams.
9. On decline, emit `decline_call`.
10. On end, emit `leave_call` and stop all media tracks.

## 10. Important Notes

- Backend does not send WebRTC offer/answer/ICE data. Frontend should use PeerJS or its own WebRTC signaling layer.
- `peer_id` in socket events is the frontend WebRTC/PeerJS peer id, not the backend user id.
- `call_type` controls media constraints: `audio` means audio only, `video` means audio + video.
- Keep `call_id`, `chat_id`, and `room_id` in call screen state until the call ends.
- Handle `402` from `make-call` as insufficient coins/payment required.
