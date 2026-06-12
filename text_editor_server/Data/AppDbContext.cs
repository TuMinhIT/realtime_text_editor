using Microsoft.EntityFrameworkCore;
using text_editor_server.Entities;

namespace text_editor_server.Data
{
    public class AppDbContext : DbContext
    {
        public DbSet<User> Users { get; set; }
        public DbSet<Document> Documents { get; set; }
        public DbSet<Section> Sections { get; set; }
        public DbSet<SectionPermission> SectionPermissions { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<DocumentSnapshot> DocumentSnapshots { get; set; }
        public DbSet<ProofFile> ProofFiles { get; set; }
        public DbSet<DocumentFile> DocumentFiles { get; set; }
        public DbSet<Folder> Folders { get; set; }

        //Thêm file minh chứng
        public DbSet<SectionHyperlink> SectionHyperlinks { get; set; }


        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }


        //Hỗ trợ realtime collab:
       // public DbSet<SectionOperation> SectionOperations { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Them index de truy van nhanh hon
            modelBuilder.Entity<RefreshToken>()
                .HasIndex(rt => rt.TokenId)
                .IsUnique();

            // 1. User -> RefreshToken relationship
            modelBuilder.Entity<RefreshToken>()
                .HasOne(rt => rt.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // 2. Document -> User (Creator) relationship
            modelBuilder.Entity<Document>()
                .HasOne(d => d.Creator)
                .WithMany()
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // 3. Document -> Section relationship
            // Section không có navigation property về Document (chỉ có DocumentId)
            modelBuilder.Entity<Section>()
                .HasOne<Document>()
                .WithMany(d => d.Sections)
                .HasForeignKey(s => s.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            // 4. Section -> SectionPermission relationship
            modelBuilder.Entity<SectionPermission>()
                .HasOne(sp => sp.Section)
                .WithMany(s => s.Assignments)
                .HasForeignKey(sp => sp.SectionId)
                .OnDelete(DeleteBehavior.Cascade);

            // SectionPermission -> User relationship 
            // SectionPermission không có navigation property User (chỉ có UserId)
            modelBuilder.Entity<SectionPermission>()
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(sp => sp.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // 5. Document -> DocumentSnapshot relationship
            modelBuilder.Entity<DocumentSnapshot>()
                .HasOne<Document>()
                .WithMany()
                .HasForeignKey(ds => ds.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indexes for performance
            modelBuilder.Entity<Section>()
                .HasIndex(s => s.DocumentId);

            modelBuilder.Entity<SectionPermission>()
                .HasIndex(sp => new { sp.SectionId, sp.UserId });
                
            modelBuilder.Entity<DocumentSnapshot>()
                .HasIndex(ds => ds.DocumentId);


             modelBuilder.Entity<DocumentFile>()
                .HasOne(x => x.Document)
                .WithMany(x => x.DocumentFiles)
                .HasForeignKey(x => x.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DocumentFile>()
                .HasOne(x => x.File)
                .WithMany(x => x.DocumentFiles)
                .HasForeignKey(x => x.FileId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Folder>()
                .HasMany(x => x.Files)
                .WithOne(x => x.Folder)
                .HasForeignKey(x => x.FolderId)
                .OnDelete(DeleteBehavior.SetNull);

            //Thiết lập quan hệ giữa SectionHyperlink và ProofFile và Section

            modelBuilder.Entity<SectionHyperlink>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Code)
                   
                    .HasMaxLength(50);

                entity.Property(x => x.Url)
                    .IsRequired();
                //Section chứa link
                entity.HasOne(x => x.Section)
                    .WithMany()
                    .HasForeignKey(x => x.SectionId)
                    .OnDelete(DeleteBehavior.Cascade);
                // Owner section hyperlink
                entity.HasOne(x => x.OwnerSection)
                    .WithMany()
                    .HasForeignKey(x => x.OwnerSectionId)
                    .OnDelete(DeleteBehavior.Restrict);

            });

        }
    }
}









