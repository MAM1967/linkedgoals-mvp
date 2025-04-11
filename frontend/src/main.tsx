import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App";
import LinkedInLogin from "./LinkedInLogin"; // ✅ make sure this file exists
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/linkedin" element={<LinkedInLogin />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);

