const formatDocumentTitle = (title = "") =>
  title.replace(/\.[^.]+$/, "").trim() || "Untitled document";

export const mapUploadResponseToRecentDocument = (response, fileName) => ({
  id: response.documentId,
  title: formatDocumentTitle(response.documentTitle || fileName),
  description: fileName,
  sections: response.sectionsCount ?? response.sections?.length ?? 0,
  activeUsers: 0,
  owner: "You",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const mapSectionSummary = (section, index) => ({
  id: section.id,
  title: section.name || `Section ${index + 1}`,
  number: section.name || `${index + 1}`,
  content: section.contentPreview || "",
  version: section.version ?? 1,
  assignedUsers: [],
  isPublic: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const mapSectionDetail = (section, previous = {}) => ({
  ...previous,
  id: section.id,
  title: section.name || previous.title || "Untitled section",
  number: previous.number || section.name || "",
  content: section.content ?? previous.content ?? "",
  version: section.version ?? previous.version ?? 1,
  assignedUsers: (section.assignedUsers || []).map((user) => ({
    id: user.userId,
    email: user.email || `user-${user.userId}`,
    permission: user.permission,
  })),
  isPublic:
    previous.isPublic ??
    !(section.assignedUsers && section.assignedUsers.length > 0),
  updatedAt: new Date().toISOString(),
});
