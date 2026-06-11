import { http } from "./http";

const resource = "/ProofFolder";

const toError = (err) => err?.response?.data || err;

export const folderService = {
  async createFolder(name, isGlobal = true, documentId = null) {
    try {
      const res = await http.post(`${resource}`, {
        name,
        isGlobal,
        documentId,
      });

      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  async uploadFileToFolder(file, folderId) {
    try {
      if (!file) throw new Error("No file provided");

      const formData = new FormData();
      formData.append("file", file);

      if (folderId) {
        formData.append("folderId", folderId);
      }

      const res = await http.post(`${resource}/${folderId}/upload`, formData, {
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

  //oke
  async getAllFolder() {
    try {
      const res = await http.get(`${resource}`);
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  //oke
  async getAllFileInFolder(folderId) {
    try {
      const res = await http.get(`${resource}/${folderId}/files`);
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
  //oke
  async deleteFolder(id) {
    try {
      const res = await http.delete(`${resource}/${id}`);
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },
};

export default folderService;
