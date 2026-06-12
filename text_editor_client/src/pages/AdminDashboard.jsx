import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookA,
  FileText,
  MoveDiagonal2,
  Plus,
  SaveAllIcon,
  Search,
  Text,
  Upload,
  UserCheck,
  Users,
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
  const [tab, setTab] = useState("document");
  const currentUser = sessionService.getCurrentUser();

  const handleLogout = async () => {
    try {
      await userService.logout();
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
    <main className="flex flex-col items-center text-slate-900">
      <header className="border-b border-slate-200 bg-white w-full">
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

      <div
        className={`min-h-screen flex mt-5 max-w-6xl w-full mx-auto flex-col overflow-hidden rounded-lg shadow-lg transition-all duration-300  `}
      >
        <div className="px-4 flex  bg-gray-100">
          <div className="flex flex-row gap-3 rounded-2xl  p-1">
            <button
              type="button"
              onClick={() => setTab("document")}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                tab === "document"
                  ? "bg-white text-[#1a73e8] shadow-sm"
                  : "text-slate-600 border border-gray-50 hover:bg-white/70 hover:text-slate-900"
              }`}
            >
              <BookA size={18} />
              <span>Documents</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("proofFile")}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                tab === "proofFile"
                  ? "bg-white text-[#1a73e8] shadow-sm"
                  : "text-slate-600  border border-gray-50 hover:bg-white/70 hover:text-slate-900"
              }`}
            >
              <Text size={18} />
              <span>Proof File</span>
            </button>
          </div>
        </div>
        <div className="flex">
          {tab == "document" ? <DocumentSection /> : <ProofFileSection />}
        </div>
      </div>
    </main>
  );
};

export default AdminDashBoard;
