import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  MoveDiagonal2,
  Plus,
  SaveAllIcon,
  Search,
  Upload,
  UserCheck,
} from "lucide-react";

import { sessionService } from "../services/sessionService";
import { CgAdd, CgSpinner } from "react-icons/cg";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";
import { SiAuthelia } from "react-icons/si";

import ProofFileSection from "../components/SectionAuth/ProofFileSection";
import DocumentSection from "../components/SectionAuth/documentSection";
import { signalRService } from "../services/signalRService";
import http from "../services/http";
import { userService } from "../services/userService";
const AdminDashBoard = () => {
  const navigate = useNavigate();

  const currentUser = sessionService.getCurrentUser();

  // const handleLogout = () => {
  //   //Kết thúc signalR khi đăng xuất:
  //   signalRService.disconnect();
  //   sessionService.clearStore();
  //   http.setToken(null);
  //   window.localStorage.removeItem("accessToken");
  //   window.localStorage.removeItem("user");

  //   navigate("/login", { replace: true });
  // };
  const handleLogout = async () => {
    try {
      await userService.logout(); // revoke refresh token
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      signalRService.disconnect();
      sessionService.clearStore();
      http.setToken(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    }
  };

  return (
    <main className="min-h-screen bg-[#f1f3f4] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex flex-row justify-between w-full max-w-[1440px] items-center gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a73e8] text-white">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-lg font-medium text-slate-900">Docs</h1>
              <p className="text-xs text-slate-500">Realtime Editor</p>
            </div>
          </div>

          <div className="flex">
            <div className="hidden px-3 py-2 text-sm font-medium text-black md:block">
              {currentUser?.fullName}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="hidden rounded-full bg-red-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500 hover:text-white md:block"
            >
              logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6">
        <DocumentSection />

        <ProofFileSection />
      </div>
    </main>
  );
};

export default AdminDashBoard;
