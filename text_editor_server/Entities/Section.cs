using text_editor_server.Entities;

public class Section
{
    public Guid Id { get; set; }
    public Guid DocumentId { get; set; }

    public string Title { get; set; } = "";
    public int Level { get; set; } // 1 = H1, 2 = H2

    public int OrderIndex { get; set; }

    public Guid? ParentSectionId { get; set; }
    public Section? ParentSection { get; set; }

    //  QUAN TRỌNG: range trong document
    public int StartBlockIndex { get; set; }
    public int EndBlockIndex { get; set; }

    // optional (debug / fallback)
    public string? HeadingText { get; set; }

    // versioning
    public int Version { get; set; } = 0;
    public long Timestamp { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

    public ICollection<SectionPermission> Assignments { get; set; } = new List<SectionPermission>();
}