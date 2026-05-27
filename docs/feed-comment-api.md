# 📝 Feed Comment & Reply API — Frontend Developer Guide

> **Base URL:** `http://YOUR_SERVER:3000/api/feed`
> **Auth:** All APIs require `Authorization: Bearer <token>` header.

---

## 📋 Table of Contents

1. [Add Comment](#1-add-comment)
2. [Add Reply (Sub-comment)](#2-add-reply-sub-comment)
3. [Get Comments (with is_liked + reply_count)](#3-get-comments)
4. [Get Replies (with is_liked)](#4-get-replies)
5. [Like a Comment or Reply](#5-like-comment--reply)
6. [Unlike a Comment or Reply](#6-unlike-comment--reply)
7. [Response Format Overview](#7-response-format-overview)

---

## 1. Add Comment

Add a top-level comment to a feed post.

- **Method:** `POST`
- **URL:** `/api/feed/add-comment`

### Request

```json
{
  "feed_id": 23,
  "comment_text": "This is a great post!"
}
```

| Field          | Type    | Required | Description                  |
|----------------|---------|----------|------------------------------|
| `feed_id`      | Integer | ✅ Yes   | ID of the feed post          |
| `comment_text` | String  | ✅ Yes   | Text content of the comment  |

### ✅ Success Response `201`

```json
{
  "status": true,
  "message": "Comment added successfully",
  "toast": true,
  "data": {
    "feed_comment_id": 15
  }
}
```

### ❌ Error Responses

| Status | Message |
|--------|---------|
| `400` | `"Invalid feed ID"` |
| `400` | `"Comment text is required"` |
| `403` | `"Comments are disabled for this feed post"` |
| `404` | `"Feed post not found"` |

---

## 2. Add Reply (Sub-comment)

Add a reply to an existing comment. Uses the **same `feed_comment_id`** returned from a comment.

- **Method:** `POST`
- **URL:** `/api/feed/add-reply`

### Request

```json
{
  "feed_id": 23,
  "parent_comment_id": 6,
  "comment_text": "I totally agree with this!"
}
```

| Field               | Type    | Required | Description                              |
|---------------------|---------|----------|------------------------------------------|
| `feed_id`           | Integer | ✅ Yes   | ID of the feed post                      |
| `parent_comment_id` | Integer | ✅ Yes   | `feed_comment_id` of the parent comment  |
| `comment_text`      | String  | ✅ Yes   | Text content of the reply                |

### ✅ Success Response `201`

```json
{
  "status": true,
  "message": "Reply added successfully",
  "toast": true,
  "data": {
    "feed_comment_id": 17
  }
}
```

> 💡 **Tip:** Save the returned `feed_comment_id` — you need it to like/unlike this reply.

---

## 3. Get Comments

Get all top-level comments for a feed post. Each comment includes:
- `is_liked` — whether **the logged-in user** has liked this comment
- `reply_count` — how many replies exist under this comment

- **Method:** `POST`
- **URL:** `/api/feed/get-comments/:feed_id`

### Request

```json
{
  "page": 1,
  "pageSize": 20
}
```

| Field      | Type    | Required | Default | Description       |
|------------|---------|----------|---------|-------------------|
| `page`     | Integer | ❌ No    | `1`     | Page number       |
| `pageSize` | Integer | ❌ No    | `20`    | Items per page    |

### ✅ Success Response `200`

```json
{
  "status": true,
  "message": "Comments retrieved successfully",
  "toast": false,
  "data": {
    "Records": [
      {
        "feed_comment_id": 6,
        "comment_text": "Hello 23 S",
        "total_likes": 2,
        "mentioned_users": [],
        "parent_comment_id": null,
        "reply_count": 3,
        "is_liked": false,
        "createdAt": "2026-05-25T11:30:40.758Z",
        "updatedAt": "2026-05-25T11:30:40.758Z",
        "feed_id": 23,
        "user_id": 5,
        "User": {
          "user_id": 5,
          "user_name": "tirathprimocys",
          "full_name": "Tirath Primocys",
          "profile_pic": "https://example.com/pic.jpg"
        }
      }
    ],
    "Pagination": {
      "total_records": 5,
      "total_pages": 1,
      "current_page": 1,
      "records_per_page": 20
    }
  }
}
```

### Key Fields in Each Comment

| Field             | Type    | Description                                        |
|-------------------|---------|----------------------------------------------------|
| `feed_comment_id` | Integer | Unique ID — use this for like/unlike/reply         |
| `comment_text`    | String  | The comment content                                |
| `total_likes`     | Integer | Total number of likes on this comment              |
| `reply_count`     | Integer | Number of replies under this comment               |
| `is_liked`        | Boolean | `true` if current user already liked this comment  |
| `parent_comment_id` | null  | Always `null` for top-level comments              |
| `User`            | Object  | Info about who posted the comment                  |

---

## 4. Get Replies

Get all replies (sub-comments) for a specific comment. Each reply also includes `is_liked`.

- **Method:** `POST`
- **URL:** `/api/feed/get-replies`

### Request

```json
{
  "comment_id": 6,
  "page": 1,
  "pageSize": 20
}
```

| Field        | Type    | Required | Default | Description                              |
|--------------|---------|----------|---------|------------------------------------------|
| `comment_id` | Integer | ✅ Yes   | —       | `feed_comment_id` of the parent comment  |
| `page`       | Integer | ❌ No    | `1`     | Page number                              |
| `pageSize`   | Integer | ❌ No    | `20`    | Items per page                           |

### ✅ Success Response `200`

```json
{
  "status": true,
  "message": "Replies retrieved successfully",
  "toast": false,
  "data": {
    "Records": [
      {
        "feed_comment_id": 9,
        "comment_text": "I agree with this!",
        "total_likes": 1,
        "mentioned_users": [],
        "parent_comment_id": 6,
        "is_liked": false,
        "createdAt": "2026-05-25T11:56:18.067Z",
        "updatedAt": "2026-05-25T11:56:18.067Z",
        "feed_id": 23,
        "user_id": 5,
        "User": {
          "user_id": 5,
          "user_name": "tirathprimocys",
          "full_name": "Tirath Primocys",
          "profile_pic": "https://example.com/pic.jpg"
        }
      }
    ],
    "Pagination": {
      "total_records": 3,
      "total_pages": 1,
      "current_page": 1,
      "records_per_page": 20
    }
  }
}
```

### Key Fields in Each Reply

| Field               | Type    | Description                                      |
|---------------------|---------|--------------------------------------------------|
| `feed_comment_id`   | Integer | Unique ID — use this to like/unlike this reply   |
| `comment_text`      | String  | The reply content                                |
| `total_likes`       | Integer | Total number of likes on this reply              |
| `is_liked`          | Boolean | `true` if current user already liked this reply  |
| `parent_comment_id` | Integer | ID of the parent comment (never null for reply)  |

> 📌 **Replies are sorted oldest first (ASC)** so the conversation flows naturally top-to-bottom.

---

## 5. Like Comment / Reply

Like a **top-level comment** OR a **reply (sub-comment)** — **same endpoint for both**.

- **Method:** `POST`
- **URL:** `/api/feed/like-comment`

### Request

```json
{
  "feed_comment_id": 9
}
```

| Field             | Type    | Required | Description                                            |
|-------------------|---------|----------|--------------------------------------------------------|
| `feed_comment_id` | Integer | ✅ Yes   | ID of comment or reply to like                        |

### ✅ Success Response `201`

```json
{
  "status": true,
  "message": "Comment liked successfully",
  "toast": true,
  "data": {
    "feed_comment_id": 9,
    "feed_comment_like_id": 3,
    "is_liked": true,
    "total_likes": 1
  }
}
```

### ⚠️ Already Liked — Response `409`

```json
{
  "status": false,
  "message": "Comment already liked",
  "toast": true,
  "data": {
    "feed_comment_id": 9,
    "is_liked": true,
    "total_likes": 1
  }
}
```

### ❌ Error Responses

| Status | Message |
|--------|---------|
| `400` | `"Invalid feed comment ID"` |
| `404` | `"Comment or reply not found"` |

---

## 6. Unlike Comment / Reply

Unlike a **top-level comment** OR a **reply (sub-comment)** — **same endpoint for both**.

- **Method:** `POST`
- **URL:** `/api/feed/unlike-comment`

### Request

```json
{
  "feed_comment_id": 9
}
```

| Field             | Type    | Required | Description                                            |
|-------------------|---------|----------|--------------------------------------------------------|
| `feed_comment_id` | Integer | ✅ Yes   | ID of comment or reply to unlike                      |

### ✅ Success Response `200`

```json
{
  "status": true,
  "message": "Comment like removed successfully",
  "toast": true,
  "data": {
    "feed_comment_id": 9,
    "is_liked": false,
    "total_likes": 0
  }
}
```

### ⚠️ Not Liked — Response `404`

```json
{
  "status": false,
  "message": "Comment was not liked by user",
  "toast": true,
  "data": {
    "feed_comment_id": 9,
    "is_liked": false,
    "total_likes": 0
  }
}
```

---

## 7. Response Format Overview

All APIs return a consistent response shape:

```json
{
  "status": true | false,
  "message": "Human readable message",
  "toast": true | false,
  "data": { ... }
}
```

| Field     | Type    | Description                                          |
|-----------|---------|------------------------------------------------------|
| `status`  | Boolean | `true` = success, `false` = error                    |
| `message` | String  | Message to show user (if `toast: true`)              |
| `toast`   | Boolean | Whether to show a toast/snackbar notification        |
| `data`    | Object  | The actual response payload                          |

---

## 🔄 Complete Flow — Comments & Replies

```
User opens feed post #23
        │
        ▼
POST /get-comments/23          ← Get top-level comments
        │
        │ Each comment has:
        │   reply_count: 3     ← Show "View 3 replies" button
        │   is_liked: false    ← Show heart (unfilled)
        │
        ▼
User taps "View replies" on comment #6
        │
        ▼
POST /get-replies              ← body: { comment_id: 6 }
        │
        │ Each reply has:
        │   is_liked: false    ← Show heart (unfilled)
        │
        ▼
User taps ❤️ on Reply #9
        │
        ▼
POST /like-comment             ← body: { feed_comment_id: 9 }
        │
        │ Response: { is_liked: true, total_likes: 1 }
        │   Update UI: heart = filled, count +1
        │
        ▼
User taps ❤️ again (unlike)
        │
        ▼
POST /unlike-comment           ← body: { feed_comment_id: 9 }
        │
        │ Response: { is_liked: false, total_likes: 0 }
        │   Update UI: heart = unfilled, count -1
```

---

## 📌 Quick Reference

| Action                    | Method | URL                              | Key Body Fields                             |
|---------------------------|--------|----------------------------------|---------------------------------------------|
| Add comment               | POST   | `/feed/add-comment`              | `feed_id`, `comment_text`                   |
| Add reply (sub-comment)   | POST   | `/feed/add-reply`                | `feed_id`, `parent_comment_id`, `comment_text` |
| Get comments              | POST   | `/feed/get-comments/:feed_id`    | `page`, `pageSize`                          |
| Get replies               | POST   | `/feed/get-replies`              | `comment_id`, `page`, `pageSize`            |
| Like comment OR reply     | POST   | `/feed/like-comment`             | `feed_comment_id`                           |
| Unlike comment OR reply   | POST   | `/feed/unlike-comment`           | `feed_comment_id`                           |

> ✅ **Important:** `like-comment` and `unlike-comment` work for BOTH top-level comments AND replies — no separate endpoint needed.
