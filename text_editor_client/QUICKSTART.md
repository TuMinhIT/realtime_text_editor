# Quick Start Guide 🚀

## 1. Installation

```bash
# Install dependencies
npm install

# Hoặc nếu bạn chỉ cần cài @microsoft/signalr
npm install @microsoft/signalr
```

## 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local
```

Edit `.env.local`:

```
VITE_API_URL=http://localhost:5000/api
VITE_SIGNALR_URL=http://localhost:5000/editHub
```

## 3. Start Development Server

```bash
npm run dev
```

Browser sẽ mở tự động tại `http://localhost:5173`

## 4. Navigate to App

- **Login**: http://localhost:5173/login
- **Documents**: http://localhost:5173/documents
- **Editor**: http://localhost:5173/editor?doc=doc-001

## 📋 Demo Credentials (Frontend Mock)

```
Email: demo@example.com
Password: demo123
```

## 🔗 API Endpoints

Tất cả API endpoints đã được tạo sẵn trong:

- `src/services/documentService.js` - Document API
- `src/services/sectionService.js` - Section API
- `src/services/userService.js` - User & Auth API
- `src/services/realtimeSyncService.js` - Real-time sync

## 🎯 Component Flow

### Login Process

```
LoginPage
  └─ userService.login(email, password)
     └─ [API] POST /api/auth/login
        └─ Store token
           └─ Navigate to /documents
```

### Document Upload

```
DocumentsPage
  └─ DocumentUpload
     └─ documentService.uploadDocument(file)
        └─ [API] POST /api/documents/upload
           └─ Parse into sections
              └─ Show document in list
```

### Document Editing

```
EditorPage
  └─ DocumentEditor
     └─ realtimeSyncService.connect(docId, userId, token)
        └─ [SignalR] JoinDocument
           └─ Real-time sync active
              └─ Multiple users can edit
```

## 🛠️ Development

### Add New Page

```jsx
// src/pages/NewPage.jsx
import React from "react";

export default function NewPage() {
  return <div>Your content</div>;
}
```

Then add to `App.jsx`:

```jsx
<Route path="/new-page" element={<NewPage />} />
```

### Add New API Call

```javascript
// In appropriate service file
import { apiClient } from "./apiClient";

export const newService = {
  async getExample(id) {
    return await apiClient.get(`/endpoint/${id}`);
  },

  async createExample(data) {
    return await apiClient.post(`/endpoint`, data);
  },
};
```

### Use State

```jsx
import { useDocumentStore } from "@/store/useDocumentStore";

export function MyComponent() {
  const { document, setDocument } = useDocumentStore();

  return <div>{document.title}</div>;
}
```

## 📦 Build for Production

```bash
npm run build
```

Output goes to `dist/` folder, ready to deploy.

## 🐛 Debugging

Enable debug mode in `.env.local`:

```
VITE_DEBUG=true
```

Check browser console (F12) for:

- API call logs
- SignalR events
- State changes
- Errors

## 📚 Project Structure

```
src/
├── components/          # React components
│   └── common/         # Reusable components
├── pages/              # Page components
├── services/           # API & external services
├── store/              # Zustand stores
├── utils/              # Utilities & helpers
└── App.jsx             # Main app component
```

## 🎨 Styling

- **Framework**: Tailwind CSS
- **Component Library**: DaisyUI
- **Icons**: Lucide React

To add theme:

```jsx
<html data-theme="dark">
  {" "}
  {/* or 'light' */}
  ...
</html>
```

## 🔄 Real-time Features

When backend is ready, these will auto-work:

- Content sync
- Cursor tracking
- User presence
- Section locking
- Collaborative editing

No additional frontend changes needed!

## ✅ Checklist Before Going Live

- [ ] Backend API implemented
- [ ] CORS configured on backend
- [ ] SignalR Hub setup
- [ ] Environment variables configured
- [ ] JWT authentication working
- [ ] Document upload tested
- [ ] Real-time sync tested
- [ ] Permission system tested
- [ ] Error handling tested

## 📞 Common Issues

### "Failed to connect to API"

- Check VITE_API_URL in .env.local
- Ensure backend is running
- Check CORS on backend

### "Cannot connect to SignalR"

- Check VITE_SIGNALR_URL in .env.local
- Ensure SignalR hub is configured
- Check authentication token

### "State not updating"

- Check that you're using the correct store
- Verify action is being called
- Check browser console for errors

## 🚀 Deploy

### Vercel

```bash
npm install -g vercel
vercel
```

### GitHub Pages

```bash
npm run deploy
```

### Self-hosted

```bash
npm run build
# Upload dist/ folder to server
```

## 📖 Documentation

- See `SETUP.md` for detailed setup
- See `BACKEND_API_SPEC.md` for API details
- See `COMPLETION_SUMMARY.md` for architecture

---

**Sẵn sàng để phát triển!** 🎉
