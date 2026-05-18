import { http } from "./http";

const resource = "/prooffile";

export const fileService = {
  async uploadFile(file, title) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      if (title?.trim()) {
        formData.append("title", title.trim());
      }

      const res = await http.post(`${resource}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
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
