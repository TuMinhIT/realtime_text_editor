// Minimal SFDT parser/merger for this app
// Works with simple SFDT-like JSON structures where paragraphs are under
// `sections[].blocks[]` and each block has `inlines[]` with `text` fields.

const safeParse = (input) => {
  if (!input) return null;
  if (typeof input === "object") return input;
  try {
    return JSON.parse(input);
  } catch (e) {
    return null;
  }
};

export const extractHeadingAndBodyFromSfdt = (jsonOrString) => {
  const doc = safeParse(jsonOrString);
  if (!doc) {
    // fallback: treat input as plain text
    const text = typeof jsonOrString === "string" ? jsonOrString : "";
    const parts = text.split("\n\n");
    return { heading: parts[0] || "", body: parts.slice(1).join("\n\n") };
  }

  const paragraphs = [];

  const sections = doc.sections || doc.Sections || [];
  for (const sec of sections) {
    const blocks = sec.blocks || sec.Blocks || [];
    for (const block of blocks) {
      // Build paragraph text from inlines
      const inlines = block.inlines || block.Inlines || [];
      const txt = inlines.map((i) => i.text || i.Text || "").join("");
      paragraphs.push(txt);
    }
  }

  const heading = paragraphs.length > 0 ? paragraphs[0] : "";
  const body = paragraphs.length > 1 ? paragraphs.slice(1).join("\n\n") : "";
  return { heading, body };
};

const makeParagraphBlock = (text) => ({
  inlines: [{ text }],
});

export const mergeBodyIntoSfdt = (jsonOrString, heading, body) => {
  const doc = safeParse(jsonOrString);

  const bodyParagraphs = (body || "").split(/\n\n/).map((p) => p.trim());

  if (!doc) {
    // Create a simple SFDT-like object
    const sections = [
      {
        blocks: [
          makeParagraphBlock(heading),
          ...bodyParagraphs.map(makeParagraphBlock),
        ],
      },
    ];
    return JSON.stringify({ sections }, null, 2);
  }

  // If doc has sections/blocks, replace blocks: keep first block as heading if exists
  const sectionsKey = doc.sections
    ? "sections"
    : doc.Sections
      ? "Sections"
      : null;

  if (sectionsKey) {
    const sections = doc[sectionsKey];
    if (sections.length === 0) {
      doc[sectionsKey] = [
        {
          blocks: [
            makeParagraphBlock(heading),
            ...bodyParagraphs.map(makeParagraphBlock),
          ],
        },
      ];
    } else {
      // Replace blocks of first section
      const first = sections[0];
      first.blocks = [
        makeParagraphBlock(heading),
        ...bodyParagraphs.map(makeParagraphBlock),
      ];
    }
    return JSON.stringify(doc, null, 2);
  }

  // Generic fallback: return a new simple doc
  return JSON.stringify(
    {
      sections: [
        {
          blocks: [
            makeParagraphBlock(heading),
            ...bodyParagraphs.map(makeParagraphBlock),
          ],
        },
      ],
    },
    null,
    2,
  );
};
