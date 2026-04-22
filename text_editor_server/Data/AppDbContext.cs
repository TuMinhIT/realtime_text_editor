using Microsoft.EntityFrameworkCore;
using text_editor_server.Entities;

namespace text_editor_server.Data
{
    public class AppDbContext : DbContext
    {
        public DbSet<User> Users { get; set; }
        public DbSet<Document> Documents { get; set; }
        public DbSet<Section> Sections { get; set; }
        public DbSet<SectionUser> SectionUsers { get; set; }
        public DbSet<OperationalChange> OperationalChanges { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<DocumentBlock> DocumentBlocks { get; set; }
        public DbSet<DocumentPermission> DocumentPermissions { get; set; }
        public DbSet<BlockPermission> BlockPermissions { get; set; }

        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            //Them index de truy van nhanh hon

            modelBuilder.Entity<RefreshToken>()
                .HasIndex(rt => rt.TokenId)
                .IsUnique();

            // User -> Document relationship
            modelBuilder.Entity<Document>()
                .HasOne(d => d.Creator)
                .WithMany(u => u.OwnedDocuments)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);
            
            // User -> RefreshToken relationship
            modelBuilder.Entity<RefreshToken>()
                .HasOne(rt => rt.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Document -> Section relationship
            modelBuilder.Entity<Section>()
                .HasOne(s => s.Document)
                .WithMany(d => d.Sections)
                .HasForeignKey(s => s.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            // SectionUser relationships
            modelBuilder.Entity<SectionUser>()
                .HasOne(su => su.Section)
                .WithMany(s => s.Assignments)
                .HasForeignKey(su => su.SectionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SectionUser>()
                .HasOne(su => su.User)
                .WithMany(u => u.SectionAssignments)
                .HasForeignKey(su => su.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // OperationalChange relationships
            modelBuilder.Entity<OperationalChange>()
                .HasOne(oc => oc.Section)
                .WithMany(s => s.ChangeLog)
                .HasForeignKey(oc => oc.SectionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OperationalChange>()
                .HasOne(oc => oc.User)
                .WithMany(u => u.Changes)
                .HasForeignKey(oc => oc.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // DocumentBlock relationships
            modelBuilder.Entity<DocumentBlock>()
                .HasOne<Document>()
                .WithMany()
                .HasForeignKey(db => db.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            // DocumentPermission relationships
            modelBuilder.Entity<DocumentPermission>()
                .HasOne<Document>()
                .WithMany()
                .HasForeignKey(dp => dp.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DocumentPermission>()
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(dp => dp.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // BlockPermission relationships
            modelBuilder.Entity<BlockPermission>()
                .HasOne<DocumentBlock>()
                .WithMany()
                .HasForeignKey(bp => bp.BlockId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<BlockPermission>()
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(bp => bp.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indexes for performance
            modelBuilder.Entity<Section>()
                .HasIndex(s => s.DocumentId);

            modelBuilder.Entity<SectionUser>()
                .HasIndex(su => new { su.SectionId, su.UserId });

            modelBuilder.Entity<OperationalChange>()
                .HasIndex(oc => new { oc.SectionId, oc.CreatedAt });

            modelBuilder.Entity<DocumentBlock>()
                .HasIndex(db => new { db.DocumentId, db.Order });

            modelBuilder.Entity<DocumentPermission>()
                .HasIndex(dp => new { dp.DocumentId, dp.UserId })
                .IsUnique();

            modelBuilder.Entity<BlockPermission>()
                .HasIndex(bp => new { bp.BlockId, bp.UserId })
                .IsUnique();
        }
    }

}

