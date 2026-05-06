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
