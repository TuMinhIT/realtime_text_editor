import { useState } from "react";
import { PenBox } from "lucide-react";

export default function RenameForm({ name, handleRename }) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(name);

  return (
    <div className="mt-4 absolute inset-0 bg-amber-50 z-50 unded-lg border p-4">
      <h3 className="mb-3 font-medium">Rename</h3>

      <input
        type="text"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        className="w-full rounded border px-3 py-2"
        placeholder="Enter new name"
      />

      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={() => setIsRenaming(false)}
          className="rounded border px-4 py-2"
        >
          Cancel
        </button>

        <button
          onClick={handleRename}
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Save
        </button>
      </div>
    </div>
  );
}
