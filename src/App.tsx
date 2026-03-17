import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAppSettings } from "@/hooks/useAppSettings";
import AuthPage from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Trips from "./pages/Trips.tsx";
import SectionLibrary from "./pages/SectionLibrary.tsx";
import AdminPage from "./pages/Admin.tsx";
import EditorPage from "./pages/EditorPage.tsx";
import ClientView from "./pages/ClientView.tsx";
import ApprovePage from "./pages/Approve.tsx";
import RevisionsPage from "./pages/Revisions.tsx";
import CheckoutPage from "./pages/Checkout.tsx";
import SettingsPage from "./pages/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";
import PendingPage from "./pages/Pending.tsx";

const queryClient = new QueryClient();

function AppContent() {
  const { cssVars } = useAppSettings();

  return (
    <div style={cssVars as React.CSSProperties}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/section-library" element={<SectionLibrary />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/editor/:id" element={<EditorPage />} />
          <Route path="/view/:shareId" element={<ClientView />} />
          <Route path="/approve" element={<ApprovePage />} />
          <Route path="/revisions" element={<RevisionsPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/pending" element={<PendingPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
