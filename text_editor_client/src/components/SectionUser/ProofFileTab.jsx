import React, { useEffect, useMemo, useRef, useState, useContext } from "react";
import fileService from "../../services/fileService";

import InternalFileComponent from "./InternalFileComponent";
import FileItemUser from "./FileItemUser";
import folderService from "../../services/folderService";
import FolderItemUser from "./FolderItemUser";
import { SectionContext } from "../../context/appContext";
const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const ProofFileTab = ({ documentId }) => {
  const { handleInsertProofTable } = useContext(SectionContext);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [folders, setFolders] = useState([]);
  const loadFiles = async () => {
    setIsLoading(true);

    const result = await fileService.getAllFiles();
    if (result) {
      setFiles(result.data);
    }
    setIsLoading(false);
  };

  // mới dô load data lên đi
  useEffect(() => {
    loadFiles();
    loadFolders();
  }, []);



  const loadFolders = async () => {
    try {
      const result = await folderService.getAllFolder();
      setFolders(result.data);
    } catch (err) {
      setFolders([]);

    }
  };

  return (
    <section className=" w-full rounded-xl bg-white ">
      <div className="flex flex-row items-center justify-between">


        <div className="flex items-center flex-row gap-2.5">
          <span className="flex text-lg font-medium text-slate-900">
            File dùng chung
          </span>

          <span className=" flex text-sm text-slate-500">
            {files && files.length} files, {folders && folders.length} folders
          </span>
        </div>
      </div>

      <div className="mt-2 overflow-x-auto">
        {isLoading ? (
          <div>
            <div
              colSpan={5}
              className="border-b border-slate-100 px-4 py-8 text-center text-sm text-slate-500"
            >
              Dang tai danh sach tai lieu...
            </div>
          </div>
        ) : files && files.length ? (
          files.map((doc) => <FileItemUser key={doc.id} doc={doc} />)
        ) : null}

        {/* folders */}
        <div>
          {folders && folders.length
            ? folders.map((folder) => (
              <FolderItemUser
                key={folder.id}
                folder={folder}
                loadFolders={loadFolders}
              />
            ))
            : null}
        </div>
      </div>

      {/* // internal file */}
      <InternalFileComponent documentId={documentId} />

      <div className="flex w-full flex-row items-center justify-center gap-2">
        <button
          onClick={handleInsertProofTable}
          className="rounded-lg border bg-amber-100 px-2 py-2 font-semibold hover:bg-amber-200">
          Bảng minh chứng
        </button>

      </div>
    </section>
  );
};

export default ProofFileTab;
