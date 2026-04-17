/**
 * Document Parser Utility
 * Handles parsing documents into numbered sections (1, 1.1, 1.2, 2, etc.)
 */

export const parseDocumentIntoSections = (text, filename = "Document") => {
  /**
   * Parse text into hierarchical sections
   * Recognizes patterns like:
   * 1. Title
   * 1.1 Subtitle
   * 1.1.1 Sub-subtitle
   */

  const lines = text.split("\n");
  const sections = [];
  let currentSection = null;
  let currentContent = "";

  const sectionRegex = /^(\d+(?:\.\d+)*)\s+(.+)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(sectionRegex);

    if (match) {
      // Found a section header
      const [, number, title] = match;

      // Save previous section
      if (currentSection) {
        currentSection.content = currentContent.trim();
        sections.push(currentSection);
      }

      // Start new section
      currentSection = {
        id: `section-${number.replace(/\./g, "-")}`,
        title: `${number} ${title}`,
        number,
        content: "",
        assignedUsers: [],
        isPublic: number.split(".").length === 1, // Top-level sections are public by default
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      currentContent = "";
    } else {
      // Regular content line
      currentContent += (currentContent ? "\n" : "") + line;
    }
  }

  // Save last section
  if (currentSection) {
    currentSection.content = currentContent.trim();
    sections.push(currentSection);
  }

  // If no sections found, create a default one from all content
  if (sections.length === 0) {
    sections.push({
      id: "section-1",
      title: "1. " + filename,
      number: "1",
      content: text,
      assignedUsers: [],
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return sections;
};

/**
 * Generate section hierarchy tree
 * Useful for creating nested navigation
 */
export const generateSectionTree = (sections) => {
  const tree = [];
  const map = {};

  // First pass: create all nodes
  sections.forEach((section) => {
    const parts = section.number.split(".");
    const level = parts.length - 1;

    const node = {
      ...section,
      level,
      children: [],
    };

    map[section.number] = node;
    tree.push(node);
  });

  // Second pass: build hierarchy
  const result = [];
  tree.forEach((node) => {
    const parts = node.number.split(".");
    if (parts.length === 1) {
      // Top level
      result.push(node);
    } else {
      // Find parent
      const parentNumber = parts.slice(0, -1).join(".");
      const parent = map[parentNumber];
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  return result;
};

/**
 * Export sections back to formatted text
 */
export const exportSectionsToText = (sections) => {
  return sections
    .map((section) => `${section.title}\n\n${section.content}`)
    .join("\n\n---\n\n");
};

/**
 * Parse .docx file (simplified - requires library like mammoth)
 * For now, this returns a placeholder
 */
export const parseDocxFile = async (file) => {
  // TODO: Integrate mammoth.js for proper .docx parsing
  // For now, we'll convert to text if it's .txt

  if (file.type === "text/plain" || file.name.endsWith(".txt")) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const sections = parseDocumentIntoSections(text, file.name);
        resolve(sections);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // For .docx files, return a placeholder
  return Promise.resolve([
    {
      id: "section-1",
      title: "1. " + file.name,
      number: "1",
      content: "Document content will appear here after parsing",
      assignedUsers: [],
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
};

/**
 * Calculate document statistics
 */
export const calculateDocumentStats = (sections) => {
  const totalWords = sections.reduce((acc, s) => {
    const words = s.content?.split(/\s+/).filter((w) => w) || [];
    return acc + words.length;
  }, 0);

  const totalCharacters = sections.reduce((acc, s) => {
    return acc + (s.content?.length || 0);
  }, 0);

  const totalSections = sections.length;

  const assignedUsers = new Set();
  sections.forEach((s) => {
    s.assignedUsers?.forEach((u) => {
      assignedUsers.add(u.id);
    });
  });

  return {
    totalWords,
    totalCharacters,
    totalSections,
    totalAssignedUsers: assignedUsers.size,
    averageWordsPerSection: Math.round(totalWords / totalSections),
  };
};
