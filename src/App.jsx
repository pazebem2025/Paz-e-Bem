import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import {
  NewspaperIcon,
  MegaphoneIcon,
  InformationCircleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Header from "./components/Header.jsx";
import Publicacoes from "./pages/Publicacoes.jsx";
import Informativos from "./pages/Informativos.jsx";
import Sobre from "./pages/Sobre.jsx";
import Login from "./pages/Login.jsx";
import AdminPublicacoes from "./pages/AdminPublicacoes.jsx";
import AdminInformativos from "./pages/AdminInformativos.jsx";
import Admin from "./pages/Admin.jsx";
import AdminEditPublicacao from "./pages/AdminEditPublicacao.jsx";
import AdminEditInformativo from "./pages/AdminEditInformativo.jsx";
import PublicacaoDetalhes from "./pages/PublicacaoDetalhes.jsx";
import Footer from "./components/Footer.jsx";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-100 text-slate-800 font-sans max-w-md mx-auto relative">
        <Header />
        <main className="pb-24">
          <Routes>
            <Route path="/" element={<Publicacoes />} />
            <Route path="/publicacoes/:id" element={<PublicacaoDetalhes />} />
            <Route path="/informativos" element={<Informativos />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/publicacoes" element={<AdminPublicacoes />} />
            <Route
              path="/admin/publicacoes/:id"
              element={<AdminEditPublicacao />}
            />
            <Route path="/admin/informativos" element={<AdminInformativos />} />
            <Route
              path="/admin/informativos/:id"
              element={<AdminEditInformativo />}
            />
          </Routes>
          <Footer />
        </main>
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md h-20 bg-white border-t border-gray-200 rounded-t-3xl shadow-lg z-50 flex justify-around items-center">
          <NavLink
            to="/"
            end
            className="flex flex-col items-center justify-center text-xs gap-1 w-1/4 relative"
          >
            {({ isActive }) => (
              <>
                <NewspaperIcon
                  className={`w-6 h-6 transition-colors ${
                    isActive ? "text-purple-600" : "text-slate-400"
                  }`}
                />
                {/* indicator removed */}
              </>
            )}
          </NavLink>
          <NavLink
            to="/informativos"
            className="flex flex-col items-center justify-center text-xs gap-1 w-1/4 relative"
          >
            {({ isActive }) => (
              <>
                <MegaphoneIcon
                  className={`w-6 h-6 transition-colors ${
                    isActive ? "text-purple-600" : "text-slate-400"
                  }`}
                />
                {/* indicator removed */}
              </>
            )}
          </NavLink>
          <NavLink
            to="/sobre"
            className="flex flex-col items-center justify-center text-xs gap-1 w-1/4 relative"
          >
            {({ isActive }) => (
              <>
                <InformationCircleIcon
                  className={`w-6 h-6 transition-colors ${
                    isActive ? "text-purple-600" : "text-slate-400"
                  }`}
                />
                {/* indicator removed */}
              </>
            )}
          </NavLink>
          <NavLink
            to="/login"
            className="flex flex-col items-center justify-center text-xs gap-1 w-1/4 relative"
          >
            {({ isActive }) => (
              <>
                <UserIcon
                  className={`w-6 h-6 transition-colors ${
                    isActive ? "text-purple-600" : "text-slate-400"
                  }`}
                />
                {/* indicator removed */}
              </>
            )}
          </NavLink>
        </nav>
      </div>
    </BrowserRouter>
  );
}

export default App;
