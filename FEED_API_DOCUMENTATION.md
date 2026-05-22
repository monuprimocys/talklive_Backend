# Feed API Documentation

Complete guide for implementing all Feed-related APIs with detailed payload specifications.

**Base URL**: `/api/feed`
**Authentication**: All endpoints require JWT authentication token in headers

---

## Table of Contents
1. [Feed Management](#feed-management)
2. [Media Management](#media-management)
3. [Like/Unlike](#likeunlike)
4. [Comments](#comments)
5. [Save/Unsave](#saveunsave)
6. [Reports](#reports)

---

## Feed Management

### 1. Create Feed Post
**Endpoint**: `POST /api/feed/create`
**Access**: Private (Authenticated users)

**Description**: Create a new feed post with optional text and media.

**Headers**:
```json
{
  "Content-Type": "multipart/form-data",
  "Authorization": "Bearer {token}"
}
```

**Request Payload**:
```json
{
  "feed_type": "text",
  "content": "Your post content here",
  "location": "New York, USA",
  "allow_comments": true,
  "mentioned_users": [1, 2, 3]
}
```

**Form Data (for file uploads)**:
- `files`: File upload (multipart/form-data) - Optional, depends on feed_type

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| feed_type | enum | Yes | One of: `text`, `text_image`, `text_video`, `image_only`, `video_only` |
| content | string | Conditional | Required if feed_type is `text`, `text_image`, `text_video` |
| location | string | No | Location information for the post |
| allow_comments | boolean | No | Allow/disable comments on this post (default: true) |
| mentioned_users | array | No | Array of user IDs to mention |

**Request Examples**:

**Example 1: Text-only post**
```bash
curl -X POST /api/feed/create \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "feed_type": "text",
    "content": "Hello everyone! This is my first post.",
    "location": "San Francisco, CA",
    "allow_comments": true,
    "mentioned_users": [2, 3]
  }'
```

**Example 2: Text with Image (S3 Mode)**
```bash
curl -X POST /api/feed/create \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "feed_type": "text_image",
    "content": "Beautiful sunset at the beach",
    "location": "Malibu Beach",
    "allow_comments": true,
    "file_media_1": "https://s3.amazonaws.com/bucket/reelboost/feed/images/sunset.jpg"
  }'
```

**Example 3: Text with Image (Local Mode)**
```bash
curl -X POST /api/feed/create \
  -H "Authorization: Bearer {token}" \
  -F "feed_type=text_image" \
  -F "content=My holiday pics" \
  -F "location=Hawaii" \
  -F "allow_comments=true" \
  -F "mentioned_users=[1,2]" \
  -F "files=@/path/to/image.jpg"
```

**Example 4: Video Only**
```bash
curl -X POST /api/feed/create \
  -H "Authorization: Bearer {token}" \
  -F "feed_type=video_only" \
  -F "location=Hollywood" \
  -F "allow_comments=true" \
  -F "files=@/path/to/video.mp4"
```

**Response (Success - 201)**:
```json
{
  "success": true,
  "status_code": 201,
  "data": {
    "feed_id": 42
  },
  "message": "Feed post created successfully"
}
```

**Response (Error - 400)**:
```json
{
  "success": false,
  "status_code": 400,
  "data": {},
  "message": "Content is required for this feed type"
}
```

---

### 2. Get Feed Posts (List)
**Endpoint**: `POST /api/feed/get-feed`
**Access**: Private (Authenticated users)

**Description**: Fetch paginated feed posts with filters and sorting.

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
```

**Request Payload**:
```json
{
  "page": 1,
  "pageSize": 10,
  "feed_type": "all",
  "location": "New York",
  "hashtag": "travel",
  "user_name": "john",
  "sort_by": "createdAt",
  "sort_order": "DESC",
  "exclude_user_ids": [1, 2, 3]
}
```

**Parameters**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number for pagination |
| pageSize | integer | No | 10 | Number of posts per page |
| feed_type | enum | No | all | Filter: `text`, `text_image`, `text_video`, `image_only`, `video_only`, `all` |
| location | string | No | - | Filter by location |
| hashtag | string | No | - | Search by hashtag |
| user_name | string | No | - | Filter by username |
| sort_by | string | No | createdAt | Sort field: `createdAt`, `total_likes`, `total_comments` |
| sort_order | enum | No | DESC | Sort order: `DESC` or `ASC` |
| exclude_user_ids | array | No | [] | Exclude specific users from results |

**Request Examples**:

**Example 1: Get latest posts**
```bash
curl -X POST /api/feed/get-feed \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "pageSize": 10
  }'
```

**Example 2: Get image-only posts with pagination**
```bash
curl -X POST /api/feed/get-feed \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 2,
    "pageSize": 20,
    "feed_type": "image_only",
    "sort_by": "total_likes",
    "sort_order": "DESC"
  }'
```

**Example 3: Search by hashtag and location**
```bash
curl -X POST /api/feed/get-feed \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "pageSize": 15,
    "hashtag": "photography",
    "location": "New York"
  }'
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "posts": [
      {
        "feed_id": 1,
        "user_id": 5,
        "feed_type": "text_image",
        "content": "Beautiful day at the park",
        "location": "Central Park, NY",
        "hashtags": ["park", "nature"],
        "mentioned_users": [2, 3],
        "allow_comments": true,
        "total_likes": 45,
        "total_comments": 12,
        "total_shares": 3,
        "total_saves": 8,
        "status": true,
        "createdAt": "2026-05-21T10:30:00Z",
        "updatedAt": "2026-05-21T10:30:00Z",
        "media": [
          {
            "feed_media_id": 1,
            "media_url": "https://s3.amazonaws.com/bucket/image.jpg",
            "media_type": "image",
            "order": 0
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 150,
      "totalPages": 15
    }
  },
  "message": "Feed posts retrieved successfully"
}
```

---

### 3. Get Feed Post Detail
**Endpoint**: `GET /api/feed/get-feed/:feed_id`
**Access**: Private (Authenticated users)

**Description**: Get detailed information about a specific feed post.

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| feed_id | integer | Yes | The ID of the feed post |

**Request Example**:
```bash
curl -X GET /api/feed/get-feed/42 \
  -H "Authorization: Bearer {token}"
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "feed_id": 42,
    "user_id": 5,
    "feed_type": "text_image",
    "content": "Amazing sunset!",
    "location": "Malibu Beach",
    "hashtags": ["sunset", "beach"],
    "mentioned_users": [2],
    "allow_comments": true,
    "total_likes": 125,
    "total_comments": 34,
    "total_shares": 8,
    "total_saves": 22,
    "status": true,
    "deleted_by_user": false,
    "createdAt": "2026-05-20T15:45:00Z",
    "updatedAt": "2026-05-21T09:30:00Z",
    "User": {
      "user_id": 5,
      "first_name": "John",
      "last_name": "Doe",
      "user_name": "johndoe"
    },
    "media": [
      {
        "feed_media_id": 1,
        "media_url": "https://s3.amazonaws.com/bucket/sunset.jpg",
        "media_type": "image",
        "order": 0
      }
    ]
  },
  "message": "Feed post details retrieved successfully"
}
```

**Response (Error - 404)**:
```json
{
  "success": false,
  "status_code": 404,
  "data": {},
  "message": "Feed post not found"
}
```

---

### 4. Edit Feed Post
**Endpoint**: `PUT /api/feed/edit-feed/:feed_id`
**Access**: Private (Only post owner)

**Description**: Edit an existing feed post. Only the owner can edit their post.

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| feed_id | integer | Yes | The ID of the feed post |

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
```

**Request Payload**:
```json
{
  "content": "Updated post content",
  "location": "Updated location",
  "allow_comments": false
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| content | string | No | Updated post content |
| location | string | No | Updated location |
| allow_comments | boolean | No | Update comment setting |

**Request Example**:
```bash
curl -X PUT /api/feed/edit-feed/42 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated: Amazing sunset at Malibu!",
    "location": "Malibu Beach, California",
    "allow_comments": true
  }'
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "feed_id": 42
  },
  "message": "Feed post updated successfully"
}
```

**Response (Error - 403)**:
```json
{
  "success": false,
  "status_code": 403,
  "data": {},
  "message": "Unauthorized to edit this feed post"
}
```

---

### 5. Delete Feed Post
**Endpoint**: `DELETE /api/feed/delete-feed/:feed_id`
**Access**: Private (Only post owner)

**Description**: Delete a feed post (soft delete). Only the owner can delete their post.

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| feed_id | integer | Yes | The ID of the feed post |

**Request Example**:
```bash
curl -X DELETE /api/feed/delete-feed/42 \
  -H "Authorization: Bearer {token}"
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "feed_id": 42
  },
  "message": "Feed post deleted successfully"
}
```

**Response (Error - 403)**:
```json
{
  "success": false,
  "status_code": 403,
  "data": {},
  "message": "Unauthorized to delete this feed post"
}
```

---

## Media Management

### 1. Upload Media to S3 (Via Backend)
**Endpoint**: `POST /api/feed/upload-media-in-s3`
**Access**: Private (Authenticated users)

**Description**: Upload media (image/video) to S3 via backend. This is an alternative to presigned URLs.

**Headers**:
```json
{
  "Content-Type": "multipart/form-data",
  "Authorization": "Bearer {token}"
}
```

**Form Data**:
- `file`: File to upload (image or video)

**Request Example**:
```bash
curl -X POST /api/feed/upload-media-in-s3 \
  -H "Authorization: Bearer {token}" \
  -F "file=@/path/to/image.jpg"
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "url": "https://s3.amazonaws.com/bucket/reelboost/feed/1715253000000-image.jpg"
  },
  "message": "File Uploaded Successfully"
}
```

**Response (Error - 404)**:
```json
{
  "success": false,
  "status_code": 404,
  "data": {},
  "message": "File Data is missing"
}
```

---

### 2. Get Presigned URL for Direct S3 Upload
**Endpoint**: `POST /api/feed/get-presigned-url`
**Access**: Private (Authenticated users)

**Description**: Get a presigned URL for direct S3 upload. This bypasses the backend and is faster.

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
```

**Request Payload**:
```json
{
  "file_type": "image",
  "mime_type": "image/jpeg"
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file_type | enum | Yes | One of: `image`, `video`, `doc`, `gif`, `thumb` |
| mime_type | string | Yes | MIME type (e.g., `image/jpeg`, `video/mp4`, `application/pdf`) |

**Request Examples**:

**Example 1: For image upload**
```bash
curl -X POST /api/feed/get-presigned-url \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "file_type": "image",
    "mime_type": "image/jpeg"
  }'
```

**Example 2: For video upload**
```bash
curl -X POST /api/feed/get-presigned-url \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "file_type": "video",
    "mime_type": "video/mp4"
  }'
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "presigned_url": "https://s3.amazonaws.com/bucket/reelboost/feed/images/presigned-upload-url",
    "file_url": "https://s3.amazonaws.com/bucket/reelboost/feed/images/1715253000000-image.jpg",
    "key": "reelboost/feed/images/1715253000000-image.jpg",
    "file_name": "1715253000000-image.jpg"
  },
  "message": "Presigned URL generated successfully"
}
```

**Frontend Usage**:
```javascript
// Step 1: Get presigned URL from backend
const presignedResponse = await fetch('/api/feed/get-presigned-url', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    file_type: 'image',
    mime_type: 'image/jpeg'
  })
});

const { data } = await presignedResponse.json();

// Step 2: Upload directly to S3 using presigned URL
const uploadResponse = await fetch(data.presigned_url, {
  method: 'PUT',
  headers: {
    'Content-Type': 'image/jpeg'
  },
  body: imageFile
});

// Step 3: Use data.file_url in your feed creation
console.log('Use this URL:', data.file_url); // Use this in feed creation
```

---

### 3. Add Media to Existing Feed Post
**Endpoint**: `POST /api/feed/add-media/:feed_id`
**Access**: Private (Authenticated users)

**Description**: Upload and add media (image/video) to an existing feed post.

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| feed_id | integer | Yes | The ID of the feed post |

**Headers**:
```json
{
  "Content-Type": "multipart/form-data",
  "Authorization": "Bearer {token}"
}
```

**Form Data**:
- `file`: File to upload (image or video)

**Request Example**:
```bash
curl -X POST /api/feed/add-media/42 \
  -H "Authorization: Bearer {token}" \
  -F "file=@/path/to/additional-image.jpg"
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "feed_media_id": 5,
    "feed_id": 42,
    "media_url": "https://s3.amazonaws.com/bucket/reelboost/feed/1715253000000-image.jpg",
    "media_type": "image"
  },
  "message": "Media added successfully"
}
```

---

## Like/Unlike

### 1. Like Feed Post
**Endpoint**: `POST /api/feed/like-feed`
**Access**: Private (Authenticated users)

**Description**: Like a feed post.

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
```

**Request Payload**:
```json
{
  "feed_id": 42
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| feed_id | integer | Yes | The ID of the feed post to like |

**Request Example**:
```bash
curl -X POST /api/feed/like-feed \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "feed_id": 42
  }'
```

**Response (Success - 201)**:
```json
{
  "success": true,
  "status_code": 201,
  "data": {
    "feed_like_id": 123,
    "feed_id": 42,
    "user_id": 5
  },
  "message": "Like added successfully"
}
```

---

### 2. Unlike Feed Post
**Endpoint**: `POST /api/feed/unlike-feed`
**Access**: Private (Authenticated users)

**Description**: Remove like from a feed post.

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
```

**Request Payload**:
```json
{
  "feed_id": 42
}
```

**Request Example**:
```bash
curl -X POST /api/feed/unlike-feed \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "feed_id": 42
  }'
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "feed_id": 42,
    "removed": true
  },
  "message": "Like removed successfully"
}
```

---

### 3. Get Feed Post Likes
**Endpoint**: `POST /api/feed/get-likes/:feed_id`
**Access**: Private (Authenticated users)

**Description**: Get all users who liked a feed post with pagination.

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| feed_id | integer | Yes | The ID of the feed post |

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
```

**Request Payload**:
```json
{
  "page": 1,
  "pageSize": 20
}
```

**Parameters**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number for pagination |
| pageSize | integer | No | 20 | Number of likes per page |

**Request Example**:
```bash
curl -X POST /api/feed/get-likes/42 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "pageSize": 20
  }'
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "likes": [
      {
        "feed_like_id": 1,
        "feed_id": 42,
        "user_id": 2,
        "createdAt": "2026-05-21T08:15:00Z",
        "User": {
          "user_id": 2,
          "first_name": "Jane",
          "last_name": "Smith",
          "user_name": "janesmith"
        }
      },
      {
        "feed_like_id": 2,
        "feed_id": 42,
        "user_id": 3,
        "createdAt": "2026-05-21T08:20:00Z",
        "User": {
          "user_id": 3,
          "first_name": "Bob",
          "last_name": "Johnson",
          "user_name": "bobjohnson"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 125,
      "totalPages": 7
    }
  },
  "message": "Likes retrieved successfully"
}
```

---

## Comments

### 1. Add Comment to Feed
**Endpoint**: `POST /api/feed/add-comment`
**Access**: Private (Authenticated users)

**Description**: Add a comment to a feed post.

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
```

**Request Payload**:
```json
{
  "feed_id": 42,
  "comment_text": "Great post!",
  "mentioned_users": [2, 3]
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| feed_id | integer | Yes | The ID of the feed post |
| comment_text | string | Yes | The comment text |
| mentioned_users | array | No | Array of user IDs to mention in the comment |

**Request Examples**:

**Example 1: Simple comment**
```bash
curl -X POST /api/feed/add-comment \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "feed_id": 42,
    "comment_text": "This is amazing!"
  }'
```

**Example 2: Comment with mentions**
```bash
curl -X POST /api/feed/add-comment \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "feed_id": 42,
    "comment_text": "Great shot! @johndoe @janesmith",
    "mentioned_users": [2, 3]
  }'
```

**Response (Success - 201)**:
```json
{
  "success": true,
  "status_code": 201,
  "data": {
    "feed_comment_id": 567
  },
  "message": "Comment added successfully"
}
```

**Response (Error - 403)**:
```json
{
  "success": false,
  "status_code": 403,
  "data": {},
  "message": "Comments are disabled for this feed post"
}
```

---

### 2. Get Feed Post Comments
**Endpoint**: `POST /api/feed/get-comments/:feed_id`
**Access**: Private (Authenticated users)

**Description**: Get all comments for a feed post with pagination.

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| feed_id | integer | Yes | The ID of the feed post |

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
```

**Request Payload**:
```json
{
  "page": 1,
  "pageSize": 20
}
```

**Parameters**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number for pagination |
| pageSize | integer | No | 20 | Number of comments per page |

**Request Example**:
```bash
curl -X POST /api/feed/get-comments/42 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "pageSize": 20
  }'
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "comments": [
      {
        "feed_comment_id": 1,
        "feed_id": 42,
        "user_id": 2,
        "comment_text": "Wonderful picture!",
        "mentioned_users": [],
        "createdAt": "2026-05-21T10:00:00Z",
        "updatedAt": "2026-05-21T10:00:00Z",
        "User": {
          "user_id": 2,
          "first_name": "Jane",
          "last_name": "Smith",
          "user_name": "janesmith"
        }
      },
      {
        "feed_comment_id": 2,
        "feed_id": 42,
        "user_id": 3,
        "comment_text": "Love this!",
        "mentioned_users": [],
        "createdAt": "2026-05-21T10:05:00Z",
        "updatedAt": "2026-05-21T10:05:00Z",
        "User": {
          "user_id": 3,
          "first_name": "Bob",
          "last_name": "Johnson",
          "user_name": "bobjohnson"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 34,
      "totalPages": 2
    }
  },
  "message": "Comments retrieved successfully"
}
```

---

### 3. Delete Comment from Feed
**Endpoint**: `DELETE /api/feed/delete-comment/:comment_id`
**Access**: Private (Comment owner or feed owner)

**Description**: Delete a specific comment from a feed post.

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| comment_id | integer | Yes | The ID of the comment to delete |

**Request Example**:
```bash
curl -X DELETE /api/feed/delete-comment/567 \
  -H "Authorization: Bearer {token}"
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "feed_comment_id": 567,
    "deleted": true
  },
  "message": "Comment deleted successfully"
}
```

**Response (Error - 403)**:
```json
{
  "success": false,
  "status_code": 403,
  "data": {},
  "message": "Unauthorized to delete this comment"
}
```

---

## Save/Unsave

### 1. Save Feed Post
**Endpoint**: `POST /api/feed/save-feed`
**Access**: Private (Authenticated users)

**Description**: Save a feed post to user's saved collection.

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
```

**Request Payload**:
```json
{
  "feed_id": 42
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| feed_id | integer | Yes | The ID of the feed post to save |

**Request Example**:
```bash
curl -X POST /api/feed/save-feed \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "feed_id": 42
  }'
```

**Response (Success - 201)**:
```json
{
  "success": true,
  "status_code": 201,
  "data": {
    "feed_save_id": 89,
    "feed_id": 42,
    "user_id": 5
  },
  "message": "Feed post saved successfully"
}
```

---

### 2. Unsave Feed Post
**Endpoint**: `POST /api/feed/unsave-feed`
**Access**: Private (Authenticated users)

**Description**: Remove a feed post from user's saved collection.

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
```

**Request Payload**:
```json
{
  "feed_id": 42
}
```

**Request Example**:
```bash
curl -X POST /api/feed/unsave-feed \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "feed_id": 42
  }'
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "feed_id": 42,
    "removed": true
  },
  "message": "Feed post unsaved successfully"
}
```

---

### 3. Get User's Saved Feeds
**Endpoint**: `POST /api/feed/get-saved-feeds`
**Access**: Private (Authenticated users)

**Description**: Get all feed posts saved by the current user.

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
```

**Request Payload**:
```json
{
  "page": 1,
  "pageSize": 10
}
```

**Parameters**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number for pagination |
| pageSize | integer | No | 10 | Number of saved posts per page |

**Request Example**:
```bash
curl -X POST /api/feed/get-saved-feeds \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "page": 1,
    "pageSize": 10
  }'
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "saved_feeds": [
      {
        "feed_save_id": 1,
        "feed_id": 42,
        "user_id": 5,
        "createdAt": "2026-05-20T14:30:00Z",
        "Feed": {
          "feed_id": 42,
          "user_id": 2,
          "feed_type": "text_image",
          "content": "Amazing sunset!",
          "location": "Malibu Beach",
          "total_likes": 125,
          "total_comments": 34,
          "createdAt": "2026-05-20T15:45:00Z",
          "media": [
            {
              "feed_media_id": 1,
              "media_url": "https://s3.amazonaws.com/bucket/sunset.jpg",
              "media_type": "image"
            }
          ]
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 22,
      "totalPages": 3
    }
  },
  "message": "Saved feeds retrieved successfully"
}
```

---

## Reports

### 1. Report Feed Post
**Endpoint**: `POST /api/feed/report-feed`
**Access**: Private (Authenticated users)

**Description**: Report a feed post for inappropriate content, spam, or other violations.

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
```

**Request Payload**:
```json
{
  "feed_id": 42,
  "report_type": "inappropriate",
  "report_description": "This post contains offensive language"
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| feed_id | integer | Yes | The ID of the feed post to report |
| report_type | enum | Yes | One of: `inappropriate`, `spam`, `harassment`, `other` |
| report_description | string | Yes | Detailed description of why the post is being reported |

**Request Examples**:

**Example 1: Report for spam**
```bash
curl -X POST /api/feed/report-feed \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "feed_id": 42,
    "report_type": "spam",
    "report_description": "This appears to be promotional spam repeated multiple times"
  }'
```

**Example 2: Report for harassment**
```bash
curl -X POST /api/feed/report-feed \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "feed_id": 42,
    "report_type": "harassment",
    "report_description": "The post contains threatening comments toward a user"
  }'
```

**Response (Success - 201)**:
```json
{
  "success": true,
  "status_code": 201,
  "data": {
    "feed_report_id": 234,
    "feed_id": 42,
    "user_id": 5,
    "report_type": "inappropriate",
    "report_description": "This post contains offensive language",
    "status": "pending",
    "createdAt": "2026-05-21T11:20:00Z"
  },
  "message": "Feed post reported successfully"
}
```

---

## Error Responses

All endpoints follow a consistent error response format:

**Error Response Format**:
```json
{
  "success": false,
  "status_code": 400,
  "data": {},
  "message": "Error message describing what went wrong"
}
```

**Common Error Status Codes**:

| Code | Status | Description |
|------|--------|-------------|
| 400 | Bad Request | Invalid parameters or missing required fields |
| 401 | Unauthorized | Authentication failed or token expired |
| 403 | Forbidden | User doesn't have permission to perform this action |
| 404 | Not Found | Resource not found (feed post, comment, etc.) |
| 500 | Internal Server Error | Server error occurred while processing request |

---

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```json
{
  "Authorization": "Bearer {jwt_token}"
}
```

**Example**:
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  https://api.example.com/api/feed/get-feed
```

---

## Feed Types Reference

| Feed Type | Description | Requires Media | Requires Content |
|-----------|-------------|-----------------|------------------|
| `text` | Text-only post | No | Yes |
| `text_image` | Text with image | Yes (1 image) | Yes |
| `text_video` | Text with video | Yes (1 video) | Yes |
| `image_only` | Image-only post | Yes (1+ images) | No |
| `video_only` | Video-only post | Yes (1+ videos) | No |

---

## Data Models

### Feed Model
```javascript
{
  feed_id: Integer,
  feed_type: Enum ['text', 'text_image', 'text_video', 'image_only', 'video_only'],
  content: String,
  location: String,
  hashtags: Array<String>,
  mentioned_users: Array<Integer>,
  allow_comments: Boolean,
  total_likes: Integer,
  total_comments: Integer,
  total_shares: Integer,
  total_saves: Integer,
  status: Boolean,
  deleted_by_user: Boolean,
  deleted_at: DateTime,
  user_id: Integer,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### FeedMedia Model
```javascript
{
  feed_media_id: Integer,
  feed_id: Integer,
  media_url: String,
  media_type: Enum ['image', 'video'],
  order: Integer,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### FeedLike Model
```javascript
{
  feed_like_id: Integer,
  feed_id: Integer,
  user_id: Integer,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### FeedComment Model
```javascript
{
  feed_comment_id: Integer,
  feed_id: Integer,
  user_id: Integer,
  comment_text: String,
  mentioned_users: Array<Integer>,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### FeedSave Model
```javascript
{
  feed_save_id: Integer,
  feed_id: Integer,
  user_id: Integer,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### FeedReport Model
```javascript
{
  feed_report_id: Integer,
  feed_id: Integer,
  user_id: Integer,
  report_type: Enum ['inappropriate', 'spam', 'harassment', 'other'],
  report_description: String,
  status: Enum ['pending', 'resolved', 'dismissed'],
  createdAt: DateTime,
  updatedAt: DateTime
}
```

---

## Testing the APIs

### Using Postman

1. **Create Environment Variables**:
   - `base_url`: http://localhost:3000/api
   - `token`: Your JWT token from login

2. **Example Request**:
   ```
   POST {{base_url}}/feed/create
   Headers:
   - Authorization: Bearer {{token}}
   
   Body (JSON):
   {
     "feed_type": "text",
     "content": "Hello world!",
     "location": "San Francisco",
     "allow_comments": true
   }
   ```

### Using cURL with Environment File

```bash
# Create .env file
TOKEN="your_jwt_token_here"
BASE_URL="http://localhost:3000/api"

# Test creating a post
curl -X POST $BASE_URL/feed/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "feed_type": "text",
    "content": "Test post",
    "location": "Test Location"
  }'
```

---

## Best Practices

1. **Media Upload**:
   - For small files: Use `upload-media-in-s3` endpoint
   - For large files or better performance: Use presigned URLs with direct S3 upload

2. **Pagination**:
   - Default pageSize is 10-20
   - Always include page and pageSize in list requests

3. **Error Handling**:
   - Always check `success` field in response
   - Handle all possible error status codes

4. **Performance**:
   - Exclude unneeded user_ids to get faster results
   - Use appropriate sort_order for data retrieval
   - Cache frequently accessed feed posts

5. **Security**:
   - Always validate user ownership before editing/deleting
   - Never expose sensitive user information in responses
   - Sanitize user inputs to prevent injection attacks

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-21 | Initial API documentation |

---
