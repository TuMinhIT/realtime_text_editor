import { http } from "./http";

const resource = "/prooffile";

const toError = (err) => err?.response?.data || err;

const normalizeUploadOptions = (options) => {
  if (typeof options === "boolean") {
    return { isGlobal: options };
  }

  return options || {};
};

export const fileService = {
  async uploadFile(file, options = {}) {
    try {
      if (!file) throw new Error("No file provided");

      const {
        isGlobal = true,
        folderId,
        folderName,
        folderPath,
        relativePath,
      } = normalizeUploadOptions(options);

      const formData = new FormData();
      formData.append("file", file);

      formData.append("isGlobal", String(isGlobal));

      if (folderId) {
        formData.append("folderId", folderId);
      }

      if (folderName) {
        formData.append("folderName", folderName);
      }

      if (folderPath) {
        formData.append("folderPath", folderPath);
      }

      if (relativePath) {
        formData.append("relativePath", relativePath);
      }

      const res = await http.post(`${resource}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  async uploadFiles(files, options = {}) {
    try {
      if (!Array.isArray(files) || files.length === 0) {
        throw new Error("No files provided");
      }

      const results = [];
      for (const file of files) {
        const res = await this.uploadFile(file, options);
        results.push(res);
      }

      return results;
    } catch (err) {
      throw toError(err);
    }
  },

  async uploadByUser(file, id) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentId", id);

      const res = await http.post(`${resource}/uploadByUser`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  async getAllFiles() {
    try {
      const res = await http.get(`${resource}/getFiles`);
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  async getAllInternalFiles(id) {
    try {
      const res = await http.get(`${resource}/getInternalFiles/${id}`);
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  async deleteFile(id) {
    try {
      const res = await http.delete(`${resource}/${id}`);
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },
};

export default fileService;
