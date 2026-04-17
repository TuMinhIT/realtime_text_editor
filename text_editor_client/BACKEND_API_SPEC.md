# Backend API Specification for .NET

Đây là các API endpoints mà backend .NET cần implement để frontend có thể hoạt động.

## Authentication Endpoints

### POST /api/auth/login

Đăng nhập user

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "token": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": "user-001",
    "name": "John Doe",
    "email": "user@example.com"
  }
}
```

### POST /api/auth/register

Đăng ký user mới

**Request:**

```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201):**

```json
{
  "token": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": "user-001",
    "name": "John Doe",
    "email": "user@example.com"
  }
}
```

### POST /api/auth/logout

Đăng xuất

**Response (200):**

```json
{
  "success": true
}
```

### POST /api/auth/refresh

Refresh access token

**Request:**

```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response (200):**

```json
{
  "token": "new_jwt_token",
  "refreshToken": "new_refresh_token"
}
```

---

## User Endpoints

### GET /api/users/me

Lấy thông tin user hiện tại

**Response (200):**

```json
{
  "id": "user-001",
  "name": "John Doe",
  "email": "user@example.com",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

### PUT /api/users/me

Cập nhật profile

**Request:**

```json
{
  "name": "Jane Doe"
}
```

**Response (200):**

```json
{
  "id": "user-001",
  "name": "Jane Doe",
  "email": "user@example.com"
}
```

### POST /api/users/change-password

Đổi mật khẩu

**Request:**

```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

**Response (200):**

```json
{
  "success": true
}
```

### GET /api/users/search

Tìm kiếm user theo email

**Query:** `?q=email@example.com`

**Response (200):**

```json
[
  {
    "id": "user-002",
    "name": "Jane Smith",
    "email": "email@example.com"
  }
]
```

### GET /api/users/me/documents/shared

Lấy danh sách documents được share

**Response (200):**

```json
[
  {
    "id": "doc-001",
    "title": "Shared Document",
    "owner": "user-002",
    "createdAt": "2026-01-01T00:00:00Z"
  }
]
```

### GET /api/users/me/activity

Lấy lịch sử hoạt động

**Query:** `?limit=50`

**Response (200):**

```json
{
  "activities": [
    {
      "id": "activity-001",
      "type": "edit",
      "documentId": "doc-001",
      "sectionId": "section-1",
      "action": "Updated content",
      "timestamp": "2026-01-15T10:30:00Z"
    }
  ]
}
```

---

## Document Endpoints

### GET /api/documents

Lấy danh sách documents của user

**Query:** `?page=1&limit=10&search=query`

**Response (200):**

```json
{
  "documents": [
    {
      "id": "doc-001",
      "title": "Document Title",
      "owner": "user-001",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-15T10:30:00Z",
      "sections": 4,
      "activeUsers": 2
    }
  ],
  "total": 15,
  "page": 1
}
```

### POST /api/documents

Tạo document mới

**Request:**

```json
{
  "title": "New Document"
}
```

**Response (201):**

```json
{
  "id": "doc-002",
  "title": "New Document",
  "owner": "user-001",
  "sections": [],
  "createdAt": "2026-01-15T10:30:00Z",
  "updatedAt": "2026-01-15T10:30:00Z"
}
```

### GET /api/documents/:id

Lấy chi tiết document

**Response (200):**

```json
{
  "id": "doc-001",
  "title": "Document Title",
  "owner": "user-001",
  "content": "Full document content",
  "sections": [
    {
      "id": "section-1",
      "title": "1. Introduction",
      "number": "1",
      "content": "Section content",
      "assignedUsers": [],
      "isPublic": true
    }
  ],
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-15T10:30:00Z"
}
```

### PUT /api/documents/:id

Cập nhật metadata document

**Request:**

```json
{
  "title": "Updated Title"
}
```

**Response (200):**

```json
{
  "id": "doc-001",
  "title": "Updated Title",
  "updatedAt": "2026-01-15T10:30:00Z"
}
```

### DELETE /api/documents/:id

Xóa document

**Response (200):**

```json
{
  "success": true
}
```

### POST /api/documents/upload

Upload và parse file .docx/.txt

**Form Data:**

- `file`: File được upload
- `title`: Tên document (optional)

**Response (200):**

```json
{
  "id": "doc-003",
  "title": "Uploaded Document",
  "sections": [
    {
      "id": "section-1",
      "title": "1. Introduction",
      "number": "1",
      "content": "Parsed content"
    }
  ]
}
```

### GET /api/documents/:id/download

Download document dưới dạng .docx

**Response:**

- Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
- File binary

### GET /api/documents/:id/users/active

Lấy danh sách user đang active

**Response (200):**

```json
[
  {
    "id": "user-001",
    "name": "John Doe",
    "email": "john@example.com",
    "editingSection": "section-1",
    "lastSeen": "2026-01-15T10:30:00Z"
  }
]
```

### GET /api/documents/:id/access

Lấy danh sách quyền truy cập

**Response (200):**

```json
{
  "owner": "user-001",
  "sharedWith": [
    {
      "userId": "user-002",
      "email": "user2@example.com",
      "role": "editor",
      "grantedAt": "2026-01-10T00:00:00Z"
    }
  ]
}
```

### POST /api/documents/:id/share

Chia sẻ document

**Request:**

```json
{
  "userEmails": ["user2@example.com", "user3@example.com"],
  "permissions": "edit"
}
```

**Response (200):**

```json
{
  "success": true,
  "sharedWith": [
    {
      "email": "user2@example.com",
      "role": "editor"
    }
  ]
}
```

---

## Section Endpoints

### GET /api/documents/:docId/sections

Lấy tất cả sections trong document

**Response (200):**

```json
{
  "sections": [
    {
      "id": "section-1",
      "title": "1. Introduction",
      "number": "1",
      "content": "Content here",
      "assignedUsers": [],
      "isPublic": true,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-15T10:30:00Z"
    }
  ]
}
```

### GET /api/documents/:docId/sections/:id

Lấy section cụ thể

**Response (200):**

```json
{
  "id": "section-1",
  "title": "1. Introduction",
  "number": "1",
  "content": "Content here",
  "assignedUsers": [],
  "isPublic": true,
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-15T10:30:00Z"
}
```

### POST /api/documents/:docId/sections

Tạo section mới

**Request:**

```json
{
  "title": "1.1 New Section",
  "number": "1.1",
  "content": "Initial content"
}
```

**Response (201):**

```json
{
  "id": "section-1-1",
  "title": "1.1 New Section",
  "number": "1.1",
  "content": "Initial content"
}
```

### PUT /api/documents/:docId/sections/:id/content

Cập nhật nội dung section

**Request:**

```json
{
  "content": "Updated content"
}
```

**Response (200):**

```json
{
  "id": "section-1",
  "content": "Updated content",
  "updatedAt": "2026-01-15T10:30:00Z"
}
```

### PUT /api/documents/:docId/sections/:id

Cập nhật metadata section

**Request:**

```json
{
  "title": "Updated Title",
  "isPublic": false
}
```

**Response (200):**

```json
{
  "id": "section-1",
  "title": "Updated Title",
  "isPublic": false
}
```

### DELETE /api/documents/:docId/sections/:id

Xóa section

**Response (200):**

```json
{
  "success": true
}
```

### POST /api/documents/:docId/sections/:id/assign

Gán user vào section

**Request:**

```json
{
  "userEmail": "user2@example.com"
}
```

**Response (200):**

```json
{
  "success": true,
  "assignedUsers": [
    {
      "id": "user-002",
      "email": "user2@example.com"
    }
  ]
}
```

### DELETE /api/documents/:docId/sections/:id/users/:userId

Gỡ user khỏi section

**Response (200):**

```json
{
  "success": true
}
```

### GET /api/documents/:docId/sections/:id/editors

Lấy danh sách editor đang active

**Response (200):**

```json
[
  {
    "id": "user-001",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "editing",
    "lastActivity": "2026-01-15T10:30:00Z"
  }
]
```

### GET /api/documents/:docId/sections/:id/history

Lấy lịch sử edit

**Query:** `?limit=20`

**Response (200):**

```json
{
  "history": [
    {
      "id": "change-001",
      "userId": "user-001",
      "action": "Updated content",
      "timestamp": "2026-01-15T10:30:00Z",
      "content": "Changed text"
    }
  ]
}
```

### POST /api/documents/:docId/sections/:id/lock

Lock section để edit

**Response (200):**

```json
{
  "success": true,
  "lockedBy": "user-001",
  "lockedAt": "2026-01-15T10:30:00Z"
}
```

### POST /api/documents/:docId/sections/:id/unlock

Unlock section

**Response (200):**

```json
{
  "success": true
}
```

---

## SignalR Hub: /editHub

### Hub Methods (Backend Should Invoke to Client)

**ContentUpdated**

```csharp
await Clients.Group(documentId).SendAsync("ContentUpdated", new {
  sectionId = "section-1",
  content = "Updated content",
  userId = "user-001",
  timestamp = DateTime.UtcNow
});
```

**UserStatusChanged**

```csharp
await Clients.Group(documentId).SendAsync("UserStatusChanged", new {
  userId = "user-001",
  userName = "John Doe",
  sectionId = "section-1",
  status = "editing",
  timestamp = DateTime.UtcNow
});
```

**CursorMoved**

```csharp
await Clients.Group(documentId).SendAsync("CursorMoved", new {
  sectionId = "section-1",
  userId = "user-001",
  userName = "John Doe",
  position = 100,
  timestamp = DateTime.UtcNow
});
```

**UserJoined**

```csharp
await Clients.Group(documentId).SendAsync("UserJoined", new {
  id = "user-001",
  name = "John Doe",
  email = "john@example.com",
  editingSection = "section-1"
});
```

**UserLeft**

```csharp
await Clients.Group(documentId).SendAsync("UserLeft", userId);
```

**SectionLocked**

```csharp
await Clients.Group(documentId).SendAsync("SectionLocked", sectionId);
```

**SectionUnlocked**

```csharp
await Clients.Group(documentId).SendAsync("SectionUnlocked", sectionId);
```

**DocumentSynced**

```csharp
await Clients.Group(documentId).SendAsync("DocumentSynced", document);
```

### Client Methods (Backend Should Listen For)

**JoinDocument**

```csharp
public async Task JoinDocument(string documentId, string userId)
{
  await Groups.AddToGroupAsync(Context.ConnectionId, documentId);
  // Store user session info
  // Broadcast user joined
}
```

**UpdateSectionContent**

```csharp
public async Task UpdateSectionContent(object change)
{
  var sectionId = change.sectionId;
  var content = change.content;
  var userId = change.userId;

  // Save to database
  // Broadcast to all clients in document group
  await Clients.Group(documentId).SendAsync("ContentUpdated", change);
}
```

**UpdateCursor**

```csharp
public async Task UpdateCursor(object cursorData)
{
  // Broadcast cursor position to other users
  await Clients.Group(documentId).SendAsync("CursorMoved", cursorData);
}
```

**UpdateUserStatus**

```csharp
public async Task UpdateUserStatus(object statusData)
{
  // Update user status
  await Clients.Group(documentId).SendAsync("UserStatusChanged", statusData);
}
```

**RequestDocumentSync**

```csharp
public async Task RequestDocumentSync(string documentId)
{
  // Send full document state to requesting user
  var document = await db.GetDocument(documentId);
  await Clients.Caller.SendAsync("DocumentSynced", document);
}
```

---

## Error Responses

Tất cả lỗi nên return JSON format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional details"
}
```

### Common HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., already exists)
- `500 Internal Server Error` - Server error

---

## Authentication

Tất cả endpoints (except /auth/\*) yêu cầu JWT token trong header:

```
Authorization: Bearer <token>
```

---

## Database Schema Recommendations

### Users Table

```sql
CREATE TABLE Users (
  Id NVARCHAR(MAX) PRIMARY KEY,
  Name NVARCHAR(MAX),
  Email NVARCHAR(MAX) UNIQUE,
  PasswordHash NVARCHAR(MAX),
  CreatedAt DATETIME2,
  UpdatedAt DATETIME2
);
```

### Documents Table

```sql
CREATE TABLE Documents (
  Id NVARCHAR(MAX) PRIMARY KEY,
  Title NVARCHAR(MAX),
  OwnerId NVARCHAR(MAX),
  Content NVARCHAR(MAX),
  CreatedAt DATETIME2,
  UpdatedAt DATETIME2,
  FOREIGN KEY (OwnerId) REFERENCES Users(Id)
);
```

### Sections Table

```sql
CREATE TABLE Sections (
  Id NVARCHAR(MAX) PRIMARY KEY,
  DocumentId NVARCHAR(MAX),
  Title NVARCHAR(MAX),
  Number NVARCHAR(50),
  Content NVARCHAR(MAX),
  IsPublic BIT,
  CreatedAt DATETIME2,
  UpdatedAt DATETIME2,
  FOREIGN KEY (DocumentId) REFERENCES Documents(Id)
);
```

### SectionAssignments Table

```sql
CREATE TABLE SectionAssignments (
  Id NVARCHAR(MAX) PRIMARY KEY,
  SectionId NVARCHAR(MAX),
  UserId NVARCHAR(MAX),
  AssignedAt DATETIME2,
  FOREIGN KEY (SectionId) REFERENCES Sections(Id),
  FOREIGN KEY (UserId) REFERENCES Users(Id)
);
```

---

## Notes

- Tất cả timestamps nên là UTC
- Implement proper error handling
- Add rate limiting to prevent abuse
- Validate all user inputs
- Implement CORS for frontend domain
- Store passwords hashed (bcrypt recommended)
- Use refresh tokens for security
- Implement document version history
- Add activity logging
