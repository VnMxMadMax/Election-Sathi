import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ElectionSathi from "./ElectionSathi.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ElectionSathi />
  </StrictMode>
);
