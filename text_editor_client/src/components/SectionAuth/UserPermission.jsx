import React, { useEffect, useMemo, useState } from "react";
import { Search, Trash2, UserPlus, X } from "lucide-react";
import { userService } from "../../services/userService";

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

const UserPermission = ({
  selectedSection,
  onAddUser,
  onRemoveUser,
  onClose,
}) => {
  const [allUsers, setAllUsers] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [permission, setPermission] = useState("edit");

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

  const handleAdd = async (user) => {
    if (!user || !onAddUser) {
      return;
    }

    await onAddUser(user, permission);
    setSearchTerm("");
  };

  if (!selectedSection) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
        Hãy chọn một section ở cột bên trái.
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
      <button
        type="button"
        // onClick={() => setShowFormAdd((current) => !current)}
        className="rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1765cc] disabled:cursor-not-allowed disabled:opacity-60"
      >
        Thêm mới
      </button>

      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Quản lý user trong section
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Thêm hoặc xóa quyền cho section: {selectedSection.title}
          </p>
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-slate-900">
              User hiện có trong section
            </h4>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
              {assignedUsers.length}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {assignedUsers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                Chưa có user nào được gán cho section này.
              </div>
            ) : (
              assignedUsers.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">
                      {assignment.userName ||
                        assignment.userEmail ||
                        "Người dùng"}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {assignment.userEmail || assignment.userId || ""}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveUser?.(assignment.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-600 transition hover:bg-red-50"
                    aria-label="Xóa user"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Danh sách tất cả user
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                Tìm user và thêm vào section hiện tại.
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              Quyền mặc định
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400"
              >
                <option value="view">View</option>
                <option value="edit">Edit</option>
                <option value="owner">Owner</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên hoặc email"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {isUsersLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Đang tải danh sách user...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Không tìm thấy user phù hợp.
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">
                      {user.userName}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {user.userEmail}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAdd(user)}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                  >
                    <UserPlus size={14} />
                    Thêm
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserPermission;
