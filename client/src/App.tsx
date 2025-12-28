import { Routes, Route } from "react-router-dom";
import { CryptoProvider } from "./contexts/CryptoProvider";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Restore from "./pages/Restore";
import Dashboard from "./pages/Dashboard";
import Vault from "./pages/Vault";
import StaffLogin from "./pages/StaffLogin";
import StaffScanner from "./pages/StaffScanner";
import StaffPatientView from "./pages/StaffPatientView";

function App() {
  return (
    <CryptoProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/restore" element={<Restore />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vault" element={<Vault />} />
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/staff/scanner" element={<StaffScanner />} />
        <Route path="/staff/patient-view/:id" element={<StaffPatientView />} />
      </Routes>
    </CryptoProvider>
  );
}

export default App;
