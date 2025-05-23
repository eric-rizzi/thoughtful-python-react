// src/main.tsx (Example - place provider appropriately)
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { PyodideProvider } from "./contexts/PyodideContext"; // Import Provider
import "./index.css";
import { BASE_PATH } from "./config";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={BASE_PATH}>
      <PyodideProvider>
        {" "}
        {/* Wrap App with the Provider */}
        <App />
      </PyodideProvider>
    </BrowserRouter>
  </React.StrictMode>
);
