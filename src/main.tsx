import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App.tsx"
import "./css/buttons.css"
import "./css/index.css"
import "./css/inputs.css"
import "./css/layout.css"
import "./css/typography.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App>
    </App>
  </StrictMode>
)
