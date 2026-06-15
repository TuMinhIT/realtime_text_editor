import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { registerLicense } from "@syncfusion/ej2-base";
import "./index.css";
import { ToastContainer } from "react-toastify";
import { TurkishLira } from "lucide-react";
import Footer from "./components/Footer.jsx";

const syncfusionLicenseKey = import.meta.env.VITE_SYNCFUSION_LICENSE_KEY;

if (syncfusionLicenseKey) {
  registerLicense(syncfusionLicenseKey);
}

createRoot(document.getElementById("root")).render(
  <>
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={true}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover={false}
      />
      <App />

      <Footer />
    </BrowserRouter>
  </>,
);
