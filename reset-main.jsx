import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import PasswordReset from "./src/PasswordReset.jsx";
import "./src/styles.css";
import "./src/styles/screens.css";

const rootElement = document.getElementById("react-root");

if (!rootElement) {
  throw new Error('Elemento raiz do React "#react-root" não encontrado.');
}

createRoot(rootElement).render(
  <StrictMode>
    <PasswordReset />
  </StrictMode>
);
