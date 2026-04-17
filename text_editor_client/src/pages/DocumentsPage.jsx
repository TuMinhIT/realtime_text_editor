import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DocumentUpload from "../components/DocumentUpload";
import { FileText, Users, Clock, Trash2, Eye } from "lucide-react";

const DocumentsPage = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([
    {
      id: "doc-001",
      title: "Collaborative Document",
      description: "A sample collaborative document for testing",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      sections: 4,
      activeUsers: 2,
      owner: "John Doe",
    },
    {
      id: "doc-002",
      title: "Project Proposal",
      description: "Q1 Project Proposal Document",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      sections: 6,
      activeUsers: 0,
      owner: "Jane Smith",
    },
  ]);

  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (file) => {
    setIsUploading(true);
    try {
      // Simulate file upload and parsing
      setTimeout(() => {
        const newDocument = {
          id: `doc-${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ""),
          description: "Newly uploaded document",
          createdAt: new Date(),
          updatedAt: new Date(),
          sections: Math.floor(Math.random() * 5) + 2,
          activeUsers: 0,
          owner: "You",
        };

        setDocuments([newDocument, ...documents]);
        alert("Document uploaded successfully!");
      }, 1500);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (docId) => {
    if (confirm("Are you sure you want to delete this document?")) {
      setDocuments(documents.filter((d) => d.id !== docId));
    }
  };

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Documents</h1>
          <p className="text-base-content/60">
            Manage and collaborate on your documents in real-time
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4">Create New Document</h2>
          <DocumentUpload onUpload={handleUpload} isLoading={isUploading} />
        </div>

        {/* Documents Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Recent Documents</h2>
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-base-content/50">
                No documents yet. Start by uploading one!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="card bg-base-100 border border-base-300 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="card-body">
                    {/* Title and Icon */}
                    <div className="flex items-start gap-3 mb-3">
                      <FileText className="text-primary shrink-0" size={24} />
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-bold text-lg truncate hover:text-primary"
                          onClick={() => navigate(`/editor?doc=${doc.id}`)}
                        >
                          {doc.title}
                        </h3>
                        <p className="text-sm text-base-content/60 truncate">
                          {doc.description}
                        </p>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2 text-base-content/60">
                        <FileText size={14} />
                        {doc.sections} sections
                      </div>
                      <div className="flex items-center gap-2 text-base-content/60">
                        <Users size={14} />
                        {doc.activeUsers} active
                        {doc.activeUsers > 0 && (
                          <span className="badge badge-sm badge-success">
                            Live
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-base-content/60">
                        <Clock size={14} />
                        Updated {new Date(doc.updatedAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="card-actions justify-between">
                      <button
                        onClick={() => navigate(`/editor?doc=${doc.id}`)}
                        className="btn btn-primary btn-sm gap-2"
                      >
                        <Eye size={16} />
                        Open
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="btn btn-ghost btn-sm"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
