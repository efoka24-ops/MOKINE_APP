import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import './index.css';
import { Ia } from './pages/Ia';
import LoginPage from './pages/login';
import { SubscriptionPlans } from './pages/abonnement';
import { PaymentPage } from './pages/paiement';
import Priere from './pages/visioconference';
import Dashboard from './pages/Dashboard';
import RendezVous from './pages/RendezVous';
import MarketPlace from './pages/MarketPlace';
import Consultation from './pages/Consultation';
import Layout from './Layout/Layout';
import QRCodeGenerator from './pages/qrcode';
import Register from './pages/Register';
import AddAnimalPage from './pages/AddAnimalPage';
import IaQuestionnaire from './pages/IaQuestionnaire';
import AnimalDetail from './pages/AnimalDetail';
import MokineVetoPage from './pages/MokineVetoPage';
import MokineLabPage from './pages/MokineLabPage';
import ApiDocsPage from './pages/ApiDocsPage';
import CommandePage from './pages/CommandePage';
import CommercialApiPage from './pages/CommercialApiPage';
import CommercialDashboard from './pages/CommercialDashboard';
import Notification from './pages/Notification';
import Parametres from './pages/Parametres';
import { AuthProvider } from './context/AuthContext';
import { I18nProvider } from './i18n/index.js';
import { OfflineProvider } from './context/OfflineContext.jsx';
import OfflineIndicator from './components/OfflineIndicator.jsx';
import VetDashboard from './pages/VetDashboard';
import VendorDashboard from './pages/VendorDashboard';
import Ordonnances from './pages/Ordonnances';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import TebeDiagnostic from './pages/TebeDiagnostic';
import IoTDashboard from './pages/IoTDashboard';
import Forum from './pages/Forum';
import Analytics from './pages/Analytics';
import VideoTraining from './pages/VideoTraining';
import SanitaryAlerts from './pages/SanitaryAlerts';
import FarmManagement from './pages/FarmManagement';
import MokineFieldPage from './pages/MokineFieldPage';
import MokineMarketPage from './pages/MokineMarketPage';
import FarmerRoute from './components/FarmerRoute';

// Admin Imports
import ProtectedRoute from './admin/ProtectedRoute';
import {
  AdminDashboard,
  VetoModule,
  BoxModule,
  MarketModule,
  LabModule,
  FieldModule,
  SystemModule,
  AdminUsers,
  AdminVeterinarians,
  AdminPayments,
  AdminProducts,
  AdminSettings,
} from './admin/index';
import MarketplaceAdminModule from './admin/pages/MarketplaceModule';

// Suppress known third-party (VideoSDK/Emotion) jsx prop warning on DOM elements
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes("non-boolean attribute `jsx`")) return;
  originalConsoleError(...args);
};

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
<React.StrictMode>
    <QueryClientProvider client={queryClient}>
    <I18nProvider>
    <OfflineProvider>
    <AuthProvider>
      <BrowserRouter>
      <OfflineIndicator />
      <Routes>
        <Route path='/' element={ <App />}/>
        <Route path='/ia/:plan' element={ <Ia />}/>
        <Route path='/abonnement' element={ <SubscriptionPlans />}/>
        <Route path='/paiement/:plan' element={ <PaymentPage />}/>
        <Route path='/visio' element={ <Priere />}/>
        <Route path='/login' element={ <LoginPage />}/>
        <Route path='/register' element={ <Register />}/>
        <Route path='/forgot-password' element={ <ForgotPassword />}/>
        <Route path='/reset-password' element={ <ResetPassword />}/>
        <Route path='/mokineveto' element={ <MokineVetoPage />}/>
        <Route path='/mokinelab' element={ <MokineLabPage />}/>
        <Route path='/mokinelab/docs' element={ <ApiDocsPage />}/>
        <Route path='/commande' element={ <CommandePage />}/>
        <Route path='/mokinelab/commercial' element={ <CommercialApiPage />}/>
        <Route path='/mokinelab/dashboard' element={ <CommercialDashboard />}/>
        <Route path="/qrcode" element={<QRCodeGenerator />} />

{/* ====== Dashboard area (Layout avec Sidebar + Header) ====== */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/rendezvous" element={<RendezVous />} />
            <Route path="/marketplace" element={<MarketPlace />} />
            <Route path="/consultation" element={<Consultation />} />
            {/* ── Farmer-only routes ── */}
            <Route path="/animals/add" element={<FarmerRoute><AddAnimalPage /></FarmerRoute>} />
            <Route path="/animals/:id" element={<FarmerRoute><AnimalDetail /></FarmerRoute>} />
            <Route path="/ia/questionnaire" element={<FarmerRoute><IaQuestionnaire /></FarmerRoute>} />
            <Route path="/tebe" element={<FarmerRoute><TebeDiagnostic /></FarmerRoute>} />
            <Route path="/iot" element={<FarmerRoute><IoTDashboard /></FarmerRoute>} />
            <Route path="/farm-management" element={<FarmerRoute><FarmManagement /></FarmerRoute>} />
            <Route path="/mokine-field" element={<FarmerRoute><MokineFieldPage /></FarmerRoute>} />
            <Route path="/mokine-market" element={<FarmerRoute><MokineMarketPage /></FarmerRoute>} />
            {/* ── Shared routes ── */}
            <Route path="/ia" element={<Ia />} />
            <Route path="/notifications" element={<Notification />} />
            <Route path="/parametres" element={<Parametres />} />
            <Route path="/ordonnances" element={<Ordonnances />} />
            <Route path="/vet/dashboard" element={<VetDashboard />} />
            <Route path="/vendor/dashboard" element={<VendorDashboard />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/formation" element={<VideoTraining />} />
            <Route path="/alertes-sanitaires" element={<SanitaryAlerts />} />
          </Route>

        {/* ====== Admin Routes (Protected) ====== */}
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/veto" element={<ProtectedRoute><VetoModule /></ProtectedRoute>} />
        <Route path="/admin/box" element={<ProtectedRoute><BoxModuleplaceAdmin /></ProtectedRoute>} />
        <Route path="/admin/market" element={<ProtectedRoute><MarketModule /></ProtectedRoute>} />
        <Route path="/admin/lab" element={<ProtectedRoute><LabModule /></ProtectedRoute>} />
        <Route path="/admin/field" element={<ProtectedRoute><FieldModule /></ProtectedRoute>} />
        <Route path="/admin/system" element={<ProtectedRoute><SystemModule /></ProtectedRoute>} />

        {/* Legacy admin routes (redirect to new module pages) */}
        <Route path="/admin/users" element={<ProtectedRoute><SystemModule /></ProtectedRoute>} />
        <Route path="/admin/veterinarians" element={<ProtectedRoute><VetoModule /></ProtectedRoute>} />
        <Route path="/admin/payments" element={<ProtectedRoute><SystemModule /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute><MarketModule /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute><SystemModule /></ProtectedRoute>} />

      </Routes>
      </BrowserRouter>
    </AuthProvider>
    </OfflineProvider>
    </I18nProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
