import React, { useEffect, useMemo, useState } from "react";
import { Search, Trash2, UserPlus, X } from "lucide-react";
import { userService } from "../../services/userService";
import sectionService from "../../services/sectionService";
import { toast } from "react-toastify";

const normalizeUsers = (result) => {
  const source = Array.isArray(result)
    ? result
    : Array.isArray(result?.data)
      ? result.data
      : Array.isArray(result?.users)
        ? result.users
        : [];

  return source.map((user) => ({
    id: user.id || user.userId || user._id || user.email,
    userId: user.id || user.userId || user._id || user.email,
    userEmail: user.email || user.userEmail || "",
    userName: user.name || user.userName || user.fullName || user.email || "",
    role: user.role || user.permission || "",
  }));
};

const getAssignments = (section) => {
  if (Array.isArray(section?.assignments)) {
    return section.assignments;
  }

  if (Array.isArray(section?.users)) {
    return section.users;
  }

  return [];
};

const getAssignmentKey = (assignment) =>
  assignment?.userId || assignment?.id || assignment?.userEmail || "";

const UserPermission = ({ selectedSection, onRemoveUser, onClose }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [permission, setPermission] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadUsers = async () => {
      setIsUsersLoading(true);

      try {
        const result = await userService.getAllUser();
        if (!isActive) {
          return;
        }

        setAllUsers(normalizeUsers(result));
      } catch {
        if (isActive) {
          setAllUsers([]);
        }
      } finally {
        if (isActive) {
          setIsUsersLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      isActive = false;
    };
  }, []);

  const assignedUsers = useMemo(
    () => getAssignments(selectedSection),
    [selectedSection],
  );

  const assignedLookup = useMemo(() => {
    const lookup = new Set();

    assignedUsers.forEach((assignment) => {
      const key = getAssignmentKey(assignment);
      if (key) {
        lookup.add(key);
      }

      if (assignment?.userEmail) {
        lookup.add(assignment.userEmail);
      }
    });

    return lookup;
  }, [assignedUsers]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return allUsers.filter((user) => {
      const key = getAssignmentKey(user);
      if (assignedLookup.has(key) || assignedLookup.has(user.userEmail)) {
        return false;
      }

      if (!term) {
        return true;
      }

      return [user.userName, user.userEmail, user.role]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [allUsers, assignedLookup, searchTerm]);

  const handleAddUserToSection = async (user, permission = 1) => {
    if (!selectedSection || !user) {
      return;
    }
    try {
      await sectionService.addUserToSetion(
        selectedSection.id,
        user.id,
        permission,
      );

      setSearchTerm("");
      setIsAddModalOpen(false);

      toast.success("Đã thêm người dùng vào section");
    } catch (error) {
      toast.error(error?.message || "Không thể thêm người dùng vào section");
    }
  };

  if (!selectedSection) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
        Hãy chọn một section ở cột bên trái.
      </div>
    );
  }

  return (
    <section className="shadow-sm p-2">
      <div className="gap-2 flex flex-wrap">
        {assignedUsers.length === 0 ? (
          <div className="rounded-2xl border border-dashed text-center text-sm text-slate-500">
            Chưa có user nào được gán cho section này.
          </div>
        ) : (
          assignedUsers.map((assignment) => (
            <div
              key={assignment.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-1 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">
                  {assignment.userName}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {assignment.userEmail}
                </div>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                  {assignment.permission}
                </span>

                <button
                  type="button"
                  onClick={() => onRemoveUser?.(assignment.id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-600 transition hover:bg-red-50"
                  aria-label="Xóa user"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}

        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1765cc]"
          >
            <UserPlus size={16} />
            Thêm user
          </button>
        </div>
      </div>

      {isAddModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h4 className="text-base font-semibold text-slate-900">
                  Chọn user, quyền và thêm vào section hiện tại
                </h4>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Đóng modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_180px]">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <Search size={16} className="text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo tên hoặc email"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                Quyền
                <select
                  value={permission}
                  onChange={(e) => setPermission(Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                >
                  <option value="0">View</option>
                  <option value="1">Edit</option>
                  <option value="2">Owner</option>
                </select>
              </label>
            </div>

            <div className="max-h-[420px] overflow-y-auto px-5 pb-5">
              {isUsersLoading ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Đang tải danh sách user...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Không tìm thấy user phù hợp.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {user.userName}
                        </div>
                        <div className="truncate text-xs text-slate-500">
                          {user.userEmail}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={async () =>
                          await handleAddUserToSection(user, permission)
                        }
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                      >
                        Thêm
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default UserPermission;
