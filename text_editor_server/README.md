# Real-time Collaborative Text Editor System

A Word-like document editor that supports real-time collaborative editing with automatic section organization, user permissions, and operational transformation for conflict resolution.

## Features

- ✅ **Load Word Templates (.docx)** - Parse and import .docx files
- ✅ **Auto-Section Organization** - Automatically create sections based on heading hierarchy (1.1, 1.2, 2.1, etc.)
- ✅ **Multi-User Editing** - Multiple users can edit the same section simultaneously
- ✅ **Real-time Sync** - SignalR-based real-time synchronization
- ✅ **Operational Transformation** - Conflict-free concurrent editing using OT algorithm
- ✅ **Permission Control** - ViewOnly, Edit, and Admin permission levels
- ✅ **User Assignment** - Assign users to specific sections with granular permissions
- ✅ **JWT Authentication** - Secure user authentication and authorization
- ✅ **Change History** - Full audit trail of all document changes

## Tech Stack

### Backend

- **Framework**: ASP.NET Core 8
- **ORM**: Entity Framework Core
- **Real-time**: SignalR
- **Auth**: JWT
- **Document Parsing**: DocumentFormat.OpenXml
- **Database**: SQL Server (LocalDB for development)

### Frontend

- **Framework**: React
- **State Management**: TBD (Redux/Zustand)
- **Real-time**: SignalR Client
- **Rich Editor**: TBD (TipTap/Slate)

## Setup Instructions

### Prerequisites

- .NET 8 SDK
- SQL Server or LocalDB
- Node.js 18+
- npm or yarn

### Backend Setup

1. **Clone and navigate to backend**

   ```bash
   cd text_editor_server
   ```

2. **Install NuGet packages**

   ```bash
   dotnet restore
   ```

3. **Create Database Migration**

   ```bash
   dotnet ef migrations add InitialCreate
   dotnet ef database update
   ```

4. **Configure JWT Secret** (in `appsettings.Development.json`)

   ```json
   {
     "Jwt": {
       "Secret": "your-secret-key-at-least-32-characters-long",
       "Issuer": "text-editor-server",
       "Audience": "text-editor-client"
     }
   }
   ```

5. **Run the server**

   ```bash
   dotnet run
   ```

   Server will be available at `https://localhost:5001`

### Frontend Setup (React)

```bash
# Create React app
npx create-react-app text-editor-client
cd text-editor-client

# Install dependencies
npm install @microsoft/signalr axios zustand
```

## API Endpoints

### Authentication

- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/me` - Get current user profile
- `GET /api/users/search?query=` - Search users

### Documents & Sections

- `POST /api/sections/upload` - Upload .docx file
- `GET /api/sections/{docId}/sections` - Get all sections in document
- `GET /api/sections/section/{sectionId}` - Get section details
- `POST /api/sections/section/update` - Update section content
- `POST /api/sections/assign-user` - Assign user to section
- `GET /api/sections/section/{sectionId}/users` - Get assigned users
- `DELETE /api/sections/section/{sectionId}/user/{userId}` - Remove user from section

### SignalR Hub Events

**Client to Server:**

- `JoinSection(sectionId, userId)` - Join section for editing
- `LeaveSection(sectionId, userId)` - Leave section
- `SendChange(sectionId, userId, operationType, text, position, length, versionBefore)` - Send edit
- `GetChangeHistory(sectionId, fromVersion)` - Fetch change history

**Server to Client:**

- `LoadSection(data)` - Load section content
- `ReceiveChange(change)` - Receive edit from other user
- `UserJoined(userData)` - User joined section
- `UserLeft(userData)` - User left section
- `ChangeHistory(changes)` - Change history response
- `Error(message)` - Error notification

## Data Model

```
User
├── Id (Guid)
├── Email
├── PasswordHash
├── FullName
├── CreatedAt
└── IsActive

Document
├── Id (Guid)
├── Title
├── CreatedBy (UserId)
├── CreatedAt
├── SourceFilePath
└── Sections[]

Section
├── Id (Guid)
├── Name (e.g., "1.1", "2.3")
├── Content
├── Version
├── DocumentId
├── Assignments[] (SectionUser)
└── ChangeLog[] (OperationalChange)

SectionUser
├── Id (Guid)
├── SectionId
├── UserId
├── Permission (ViewOnly=0, Edit=1, Admin=2)
└── AssignedAt

OperationalChange
├── Id (Guid)
├── SectionId
├── UserId
├── OperationType ("insert", "delete", "replace")
├── Text
├── Position
├── Length
├── VersionBefore
├── VersionAfter
└── Timestamp
```

## Operational Transformation Algorithm

The system uses an OT algorithm to resolve concurrent edits:

1. **Capture Change**: When a user edits, the operation (insert/delete/replace) is captured with position, length, and content.
2. **Get Pending Ops**: Fetch all operations from other users that haven't been acknowledged.
3. **Transform**: Apply the OT transformation algorithm to adjust the incoming operation against pending operations.
4. **Apply**: Apply the transformed operation to the current content.
5. **Broadcast**: Send the change to all other clients in the section.

### Example:

```
Initial content: "Hello World"
User A: Insert "Beautiful " at position 6 → "Hello Beautiful World" (v1)
User B: Insert "Big " at position 6 (unaware of A's change)

Transformed:
- User B's operation is adjusted: Insert "Big " at position 16 (6 + "Beautiful ".length)
- Final result: "Hello Beautiful Big World"
```

## Usage Example

### 1. Register & Login

```bash
curl -X POST https://localhost:5001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "fullName": "John Doe"
  }'

curl -X POST https://localhost:5001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 2. Upload Document

```bash
curl -X POST https://localhost:5001/api/sections/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.docx" \
  -F "documentName=My Document"
```

### 3. Assign Users to Sections

```bash
curl -X POST https://localhost:5001/api/sections/assign-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "sectionId": "<section-id>",
    "userId": "<user-id>",
    "permission": 1
  }'
```

### 4. Real-time Editing (SignalR)

```javascript
const connection = new HubConnectionBuilder()
  .withUrl("https://localhost:5001/hubs/document", {
    accessTokenFactory: () => token,
  })
  .withAutomaticReconnect()
  .build();

// Join section
await connection.invoke("JoinSection", sectionId, userId);

// Listen for changes
connection.on("ReceiveChange", (change) => {
  // Apply change to editor
});

// Send edit
await connection.invoke(
  "SendChange",
  sectionId,
  userId,
  "insert",
  "text",
  5,
  0,
  currentVersion,
);
```

## Development Workflow

### Add Migration

```bash
dotnet ef migrations add MigrationName
dotnet ef database update
```

### Run with watch mode

```bash
dotnet watch run
```

### View Database

```bash
# Open SQL Server Management Studio and connect to (localdb)\mssqllocaldb
# Database: TextEditorDb
```

## Performance Considerations

1. **Change History Indexing** - Indexed on (SectionId, CreatedAt) for fast historical queries
2. **Section User Indexing** - Indexed on (SectionId, UserId) for fast permission lookups
3. **Pagination** - Implement pagination for large change histories
4. **Content Compression** - Consider compressing section content for storage
5. **Cache** - Cache frequently accessed sections and permissions

## Security

1. **JWT Tokens** - 24-hour expiration
2. **Password Hashing** - SHA256 with salt (upgrade to bcrypt in production)
3. **Permission Validation** - All operations validated against SectionUser permissions
4. **CORS** - Configured for React dev and production domains
5. **HTTPS** - Required in production

## Future Enhancements

- [ ] WebSocket fallback for non-CORS environments
- [ ] Conflict resolution UI for unsolvable conflicts
- [ ] Document version snapshots
- [ ] Change rollback functionality
- [ ] Comments and mentions
- [ ] Real-time cursor positions
- [ ] Offline editing sync
- [ ] Export to PDF/DOCX
- [ ] Document templates
- [ ] Undo/Redo with network awareness

## Troubleshooting

### Database Connection Failed

- Ensure SQL Server or LocalDB is running
- Check connection string in `appsettings.json`
- Run: `dotnet ef database update`

### SignalR Connection Failed

- Check CORS configuration
- Verify token is valid
- Check WebSocket support on network

### Document Parse Error

- Ensure .docx file is valid
- Check file size (max 50MB recommended)
- File should have proper heading hierarchy

## License

MIT

## Contact

For questions or support, please open an issue in the repository.
