import { Routes, Route } from "react-router-dom";
import { CryptoProvider } from "./contexts/CryptoProvider";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <CryptoProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </CryptoProvider>
  );
}

export default App;
