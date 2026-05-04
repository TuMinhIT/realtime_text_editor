using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using text_editor_server.Entities;

namespace text_editor_server.Services
{


    public class DocxParsingService
    {
        /// <summary>
        /// Parse .docx file and extract content organized by heading levels
        /// Creates sections based on heading hierarchy (e.g., Heading1 = 1, Heading2 = 1.1)
        /// </summary>
        public async Task<(List<Section> sections, string sfdt)> ParseDocxAsync(Stream fileStream)
        {
            var sections = new List<Section>();
            var plainText = new System.Text.StringBuilder();
            var sectionHierarchy = new Stack<(string prefix, int level)>();
            var contentBuilder = new System.Text.StringBuilder();
            var currentSectionName = "";
            int[] levelCounters = new int[10]; // Support up to 10 heading levels

            try
            {
                using (var wordDoc = WordprocessingDocument.Open(fileStream, false))
                {
                    var body = wordDoc.MainDocumentPart.Document.Body;

                    foreach (var paragraph in body.Elements<Paragraph>())
                    {
                        var text = ExtractTextFromParagraph(paragraph);
                        plainText.AppendLine(text);

                        // Get paragraph style
                        var pPr = paragraph.ParagraphProperties;
                        var style = pPr?.ParagraphStyleId?.Val?.Value ?? "";

                        // Detect heading level
                        int headingLevel = GetHeadingLevel(style);

                        if (headingLevel > 0)
                        {
                            // Save previous section if it has content
                            if (!string.IsNullOrWhiteSpace(currentSectionName) && contentBuilder.Length > 0)
                            {
                                sections.Add(new Section
                                {
                                    Id = Guid.NewGuid(),
                                    Title = currentSectionName,
                                  //  JsonContent = contentBuilder.ToString()
                                });
                                contentBuilder.Clear();
                            }

                            // Update hierarchy
                            levelCounters[headingLevel - 1]++;
                            for (int i = headingLevel; i < levelCounters.Length; i++)
                            {
                                levelCounters[i] = 0;
                            }

                            // Generate section name (e.g., "1.1", "2.3.2")
                            currentSectionName = GenerateSectionName(levelCounters, headingLevel);
                            contentBuilder.AppendLine($"# {text}");
                        }
                        else
                        {
                            // Regular paragraph - add to current section
                            contentBuilder.AppendLine(text);
                        }
                    }

                    // Save last section
                    if (!string.IsNullOrWhiteSpace(currentSectionName) && contentBuilder.Length > 0)
                    {
                        sections.Add(new Section
                        {
                            Id = Guid.NewGuid(),
                            Title = currentSectionName,
                     //       JsonContent = contentBuilder.ToString()
                        }); 
                    }
                }

                return (sections, plainText.ToString());
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Failed to parse .docx file", ex);
            }
        }

 
        public string ExtractTextFromParagraph(Paragraph paragraph)
        {
            var text = new System.Text.StringBuilder();

            foreach (var run in paragraph.Elements<Run>())
            {
                foreach (var textElement in run.Elements<Text>())
                {
                    text.Append(textElement.Text);
                }
            }

            return text.ToString().Trim();
        }

        private int GetHeadingLevel(string styleId)
        {
            if (string.IsNullOrEmpty(styleId)) return 0;

            // Detect heading level from style ID (Heading1, Heading2, etc.)
            if (styleId.StartsWith("Heading", StringComparison.OrdinalIgnoreCase))
            {
                var levelPart = styleId.Substring(7); // Remove "Heading"
                if (int.TryParse(levelPart, out var level))
                {
                    return level;
                }
            }

            return 0;
        }

        private string GenerateSectionName(int[] levelCounters, int maxLevel)
        {
            var parts = new List<string>();
            for (int i = 0; i < maxLevel; i++)
            {
                if (levelCounters[i] > 0)
                {
                    parts.Add(levelCounters[i].ToString());
                }
            }

            return string.Join(".", parts);
        }
    }
}
