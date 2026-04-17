# Collaborative Text Editor - Frontend

Giao diện web cho hệ thống soạn thảo văn bản collaborative, cho phép nhiều user edit cùng lúc trong cùng một section với sync real-time.

## Features

✅ **Document Management**

- Upload and parse Word documents (.docx, .txt)
- Auto-divide into numbered sections (1, 1.1, 1.2, 2, etc.)
- Real-time section editing

✅ **Collaboration**

- Multiple users editing same section simultaneously
- Real-time cursor tracking
- Active user presence indicator
- Live sync via SignalR

✅ **Access Control**

- Section-based permission assignment
- User management per section
- Public/private section settings

✅ **UI Components**

- Section panel with quick navigation
- Full-featured text editor
- User presence sidebar
- Document upload interface
- Permission management dialog
- Sync status indicator

## Project Structure

```
src/
├── components/
│   ├── DocumentEditor.jsx          # Main editor component
│   ├── DocumentHeader.jsx          # Document title & actions
│   ├── SectionPanel.jsx            # Section navigation
│   ├── SectionEditor.jsx           # Section content editor
│   ├── UserPresence.jsx            # Active users sidebar
│   ├── SyncStatus.jsx              # Connection status
│   ├── PermissionDialog.jsx        # Permission management
│   └── DocumentUpload.jsx          # File upload interface
├── pages/
│   ├── EditorPage.jsx              # Editor page
│   └── DocumentsPage.jsx           # Documents listing
├── services/
│   ├── apiClient.js                # HTTP client
│   ├── documentService.js          # Document API
│   ├── sectionService.js           # Section API
│   ├── userService.js              # User & Auth API
│   └── realtimeSyncService.js      # SignalR integration
├── store/
│   ├── useDocumentStore.js         # Document state (Zustand)
│   └── useCollaborationStore.js    # Collaboration state (Zustand)
└── utils/
    └── documentParser.js           # Document parsing utilities
```

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
VITE_API_URL=http://localhost:5000/api
VITE_SIGNALR_URL=http://localhost:5000/editHub
```

### 3. Install Additional Libraries

For real-time sync with SignalR:

```bash
npm install @microsoft/signalr
```

## Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## API Integration

This frontend is designed to work with a .NET backend providing:

### Authentication APIs

- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token

### Document APIs

- `GET /api/documents` - Get user's documents
- `GET /api/documents/:id` - Get document details
- `POST /api/documents` - Create document
- `POST /api/documents/upload` - Upload and parse document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/:id/download` - Download document
- `GET /api/documents/:id/users/active` - Get active users

### Section APIs

- `GET /api/documents/:docId/sections` - Get all sections
- `GET /api/documents/:docId/sections/:id` - Get section
- `POST /api/documents/:docId/sections` - Create section
- `PUT /api/documents/:docId/sections/:id/content` - Update content
- `PUT /api/documents/:docId/sections/:id` - Update section metadata
- `DELETE /api/documents/:docId/sections/:id` - Delete section
- `POST /api/documents/:docId/sections/:id/assign` - Assign user
- `DELETE /api/documents/:docId/sections/:id/users/:userId` - Remove user
- `GET /api/documents/:docId/sections/:id/editors` - Get active editors

### SignalR Hub: `/editHub`

**Client Methods (Call to Server):**

```csharp
connection.invoke('JoinDocument', documentId, userId);
connection.invoke('UpdateSectionContent', { sectionId, content, userId, timestamp });
connection.invoke('UpdateCursor', { sectionId, position, userId, userName, timestamp });
connection.invoke('UpdateUserStatus', { userId, userName, sectionId, status, timestamp });
connection.invoke('RequestDocumentSync', documentId);
```

**Server Messages (Receive from Server):**

```csharp
connection.on('ContentUpdated', (change) => { ... });
connection.on('UserStatusChanged', (statusData) => { ... });
connection.on('CursorMoved', (cursorData) => { ... });
connection.on('UserJoined', (user) => { ... });
connection.on('UserLeft', (userId) => { ... });
connection.on('SectionLocked', (sectionId) => { ... });
connection.on('SectionUnlocked', (sectionId) => { ... });
connection.on('DocumentSynced', (document) => { ... });
```

## Services Usage

### Document Service

```javascript
import { documentService } from "@/services/documentService";

// Get documents
const docs = await documentService.getDocuments();

// Upload document
const result = await documentService.uploadDocument(file);

// Download document
await documentService.downloadDocument(documentId);
```

### Section Service

```javascript
import { sectionService } from "@/services/sectionService";

// Get sections
const sections = await sectionService.getSections(documentId);

// Update section content
await sectionService.updateSectionContent(documentId, sectionId, content);

// Assign user
await sectionService.assignUser(documentId, sectionId, userEmail);
```

### User Service

```javascript
import { userService } from "@/services/userService";

// Login
const user = await userService.login(email, password);

// Get current user
const currentUser = await userService.getCurrentUser();

// Get shared documents
const shared = await userService.getSharedDocuments();
```

### Real-time Sync

```javascript
import { realtimeSyncService } from "@/services/realtimeSyncService";

// Connect to document
await realtimeSyncService.connect(documentId, userId, token);

// Listen for events
realtimeSyncService.on("content-updated", (change) => {
  console.log("Content updated:", change);
});

// Send updates
await realtimeSyncService.sendContentUpdate(sectionId, content, userId);

// Disconnect
await realtimeSyncService.disconnect();
```

## State Management

Using Zustand for state management:

### useDocumentStore

```javascript
import { useDocumentStore } from "@/store/useDocumentStore";

const {
  document,
  activeSection,
  setDocument,
  updateSectionContent,
  canEditSection,
  // ... other actions
} = useDocumentStore();
```

### useCollaborationStore

```javascript
import { useCollaborationStore } from "@/store/useCollaborationStore";

const {
  activeUsers,
  syncStatus,
  pendingChanges,
  // ... other actions
} = useCollaborationStore();
```

## Build

```bash
npm run build
```

Output will be in `dist/` directory.

## Component Usage Example

```jsx
import DocumentEditor from "@/components/DocumentEditor";

function App() {
  return <DocumentEditor documentId="doc-001" />;
}
```

## Authentication Flow

1. User registers/logs in via LoginPage
2. `userService.login()` returns token
3. Token is stored and added to API headers
4. SignalR connects with token for authentication
5. All subsequent API calls include token

## Error Handling

The frontend includes error handling for:

- Network errors
- Authentication errors
- Document parsing errors
- Real-time sync failures

Errors are logged to console and displayed to user via UI alerts.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Performance Optimization

- Lazy loading of SignalR library
- Debounced content updates
- Memoized components
- Code splitting with Vite

## Next Steps

1. Set up .NET backend with these APIs
2. Configure CORS on backend
3. Update `.env.local` with correct API URLs
4. Test document upload and real-time sync
5. Implement user authentication UI

## License

MIT
