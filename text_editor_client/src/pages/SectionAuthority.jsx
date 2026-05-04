import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Plus, Trash2, Users, Check, X } from "lucide-react";
import { toast } from "react-toastify";

const SectionAuthority = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState(null);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Mock data - Thay thế bằng API call khi backend sẵn sàng
  const mockSections = [
    {
      id: "section-1",
      documentId: documentId,
      title: "1. Introduction",
      orderIndex: 1,
      jsonContent: "...",
      assignments: [
        {
          id: "perm-1",
          userId: "user-1",
          userEmail: "john@example.com",
          userName: "John Doe",
          canEdit: true,
          canDelete: false,
        },
        {
          id: "perm-2",
          userId: "user-2",
          userEmail: "jane@example.com",
          userName: "Jane Smith",
          canEdit: true,
          canDelete: false,
        },
      ],
    },
    {
      id: "section-2",
      documentId: documentId,
      title: "2. Background",
      orderIndex: 2,
      jsonContent: "...",
      assignments: [
        {
          id: "perm-3",
          userId: "user-1",
          userEmail: "john@example.com",
          userName: "John Doe",
          canEdit: true,
          canDelete: true,
        },
      ],
    },
    {
      id: "section-3",
      documentId: documentId,
      title: "3. Methodology",
      orderIndex: 3,
      jsonContent: "...",
      assignments: [],
    },
  ];

  useEffect(() => {
    // TODO: Thay thế bằng API call
    // const loadSections = async () => {
    //   try {
    //     const res = await http.get(`/document/${documentId}/sections`);
    //     setSections(res.data);
    //   } catch (error) {
    //     toast.error("Không tải được danh sách sections");
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    // loadSections();

    // Mock loading
    setTimeout(() => {
      setSections(mockSections);
      setSelectedSection(mockSections[0]);
      setIsLoading(false);
    }, 500);
  }, [documentId]);

  const handleAddUser = async () => {
    if (!newUserEmail.trim() || !selectedSection) {
      toast.warn("Vui lòng nhập email người dùng");
      return;
    }

    setIsAddingUser(true);

    try {
      // TODO: Thay thế bằng API call
      // const res = await http.post(
      //   `/documents/${documentId}/sections/${selectedSection.id}/permissions`,
      //   { userEmail: newUserEmail.trim(), canEdit: true, canDelete: false }
      // );

      // Mock add user
      const newPermission = {
        id: `perm-${Date.now()}`,
        userId: `user-${Date.now()}`,
        userEmail: newUserEmail.trim(),
        userName: newUserEmail.split("@")[0],
        canEdit: true,
        canDelete: false,
      };

      setSections(
        sections.map((s) =>
          s.id === selectedSection.id
            ? {
                ...s,
                assignments: [...s.assignments, newPermission],
              }
            : s,
        ),
      );

      setSelectedSection({
        ...selectedSection,
        assignments: [...selectedSection.assignments, newPermission],
      });

      setNewUserEmail("");
      toast.success("Đã thêm quyền cho người dùng");
    } catch (error) {
      toast.error("Không thể thêm người dùng");
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleRemoveUser = async (permissionId) => {
    if (!selectedSection) return;

    try {
      // TODO: Thay thế bằng API call
      // await http.delete(
      //   `/documents/${documentId}/sections/${selectedSection.id}/permissions/${permissionId}`
      // );

      setSections(
        sections.map((s) =>
          s.id === selectedSection.id
            ? {
                ...s,
                assignments: s.assignments.filter((a) => a.id !== permissionId),
              }
            : s,
        ),
      );

      setSelectedSection({
        ...selectedSection,
        assignments: selectedSection.assignments.filter(
          (a) => a.id !== permissionId,
        ),
      });

      toast.success("Đã xóa quyền");
    } catch (error) {
      toast.error("Không thể xóa quyền");
    }
  };

  const handleTogglePermission = async (permissionId, permissionType) => {
    if (!selectedSection) return;

    try {
      // TODO: Thay thế bằng API call để update quyền
      // const permission = selectedSection.assignments.find(
      //   (a) => a.id === permissionId
      // );
      // await http.put(
      //   `/documents/${documentId}/sections/${selectedSection.id}/permissions/${permissionId}`,
      //   { ...permission, [permissionType]: !permission[permissionType] }
      // );

      const updatedAssignments = selectedSection.assignments.map((a) =>
        a.id === permissionId
          ? { ...a, [permissionType]: !a[permissionType] }
          : a,
      );

      setSections(
        sections.map((s) =>
          s.id === selectedSection.id
            ? { ...s, assignments: updatedAssignments }
            : s,
        ),
      );

      setSelectedSection({
        ...selectedSection,
        assignments: updatedAssignments,
      });

      toast.success("Cập nhật quyền thành công");
    } catch (error) {
      toast.error("Không thể cập nhật quyền");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-base-100">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <header className="bg-white border-b border-base-300 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-circle btn-sm"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Lock size={24} />
            Phân quyền theo Section
          </h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Danh sách Sections */}
          <div className="lg:col-span-1 bg-white rounded-lg border border-base-300 p-4">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users size={18} />
              Sections
            </h2>
            <div className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(section)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedSection?.id === section.id
                      ? "bg-primary text-primary-content"
                      : "bg-base-200 hover:bg-base-300"
                  }`}
                >
                  <div className="font-medium text-sm">{section.title}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {section.assignments.length} người
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chi tiết Section & Quản lý Permissions */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-base-300 p-6">
            {selectedSection ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedSection.title}
                  </h2>
                  <p className="text-base-content/60 text-sm">
                    ID: {selectedSection.id}
                  </p>
                </div>

                {/* Thêm người dùng mới */}
                <div className="mb-8 p-4 bg-base-100 rounded-lg">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Plus size={18} />
                    Thêm người dùng
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Nhập email người dùng..."
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="input input-bordered flex-1"
                      onKeyPress={(e) => e.key === "Enter" && handleAddUser()}
                    />
                    <button
                      onClick={handleAddUser}
                      disabled={isAddingUser || !newUserEmail.trim()}
                      className="btn btn-primary gap-2"
                    >
                      {isAddingUser ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        <Plus size={18} />
                      )}
                      Thêm
                    </button>
                  </div>
                </div>

                {/* Danh sách Permissions */}
                <div>
                  <h3 className="font-bold mb-4">Quyền truy cập</h3>
                  {selectedSection.assignments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="table table-compact w-full">
                        <thead>
                          <tr className="bg-base-200">
                            <th>Email</th>
                            <th>Tên</th>
                            <th>Chỉnh sửa</th>
                            <th>Xóa</th>
                            <th>Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSection.assignments.map((assignment) => (
                            <tr
                              key={assignment.id}
                              className="hover:bg-base-100"
                            >
                              <td>
                                <span className="font-mono text-xs">
                                  {assignment.userEmail}
                                </span>
                              </td>
                              <td>{assignment.userName}</td>
                              <td>
                                <button
                                  onClick={() =>
                                    handleTogglePermission(
                                      assignment.id,
                                      "canEdit",
                                    )
                                  }
                                  className={`btn btn-sm btn-outline gap-1 ${
                                    assignment.canEdit
                                      ? "btn-success"
                                      : "btn-ghost"
                                  }`}
                                >
                                  {assignment.canEdit ? (
                                    <Check size={14} />
                                  ) : (
                                    <X size={14} />
                                  )}
                                </button>
                              </td>
                              <td>
                                <button
                                  onClick={() =>
                                    handleTogglePermission(
                                      assignment.id,
                                      "canDelete",
                                    )
                                  }
                                  className={`btn btn-sm btn-outline gap-1 ${
                                    assignment.canDelete
                                      ? "btn-error"
                                      : "btn-ghost"
                                  }`}
                                >
                                  {assignment.canDelete ? (
                                    <Check size={14} />
                                  ) : (
                                    <X size={14} />
                                  )}
                                </button>
                              </td>
                              <td>
                                <button
                                  onClick={() =>
                                    handleRemoveUser(assignment.id)
                                  }
                                  className="btn btn-sm btn-error btn-outline gap-2"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-base-100 rounded-lg">
                      <Users size={32} className="mx-auto opacity-50 mb-2" />
                      <p className="text-base-content/60">
                        Chưa có ai được gán quyền cho section này
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-96">
                <p className="text-base-content/60">
                  Chọn một section để quản lý quyền
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionAuthority;
