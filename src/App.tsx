import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Index from "./pages/Index";
import Relatar from "./pages/Relatar";
import Comunidade from "./pages/Comunidade";
import Alertas from "./pages/Alertas";
import Doacoes from "./pages/Doacoes";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import { ProtectedRoute } from "./components/ProtectedRoute";
import PWAInstallButton from "./components/PWAInstallButton";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Rota pública - Landing Page */}
          <Route path="/" element={<Landing />} />

          {/* Rotas de autenticação - públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rotas protegidas - necessitam login */}
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/relatar"
            element={
              <ProtectedRoute>
                <Relatar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/comunidade"
            element={
              <ProtectedRoute>
                <Comunidade />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alertas"
            element={
              <ProtectedRoute>
                <Alertas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doacoes"
            element={
              <ProtectedRoute>
                <Doacoes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>

        {/* PWA Install Button - Flutuante */}
        <PWAInstallButton showAsFloating={true} />

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#fff",
              color: "#333",
              border: "1px solid #e2e8f0",
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
