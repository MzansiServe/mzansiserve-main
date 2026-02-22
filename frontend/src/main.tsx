import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// React Router Future Flags for v7 (added to address console warnings)
const routerFutureFlags = {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
};

createRoot(document.getElementById("root")!).render(<App />);
