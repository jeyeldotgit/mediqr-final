import { Routes, Route } from "react-router-dom";
import { CryptoProvider } from "./contexts/CryptoProvider";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Vault from "./pages/Vault";

function App() {
  return (
    <CryptoProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vault" element={<Vault />} />
      </Routes>
    </CryptoProvider>
  );
}

export default App;
