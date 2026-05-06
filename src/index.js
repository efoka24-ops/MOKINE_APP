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

// Admin Imports
import ProtectedRoute from './admin/ProtectedRoute';
import {
  AdminDashboard,
  AdminUsers,
  AdminVeterinarians,
  AdminPayments,
  AdminProducts,
  AdminSettings,
} from './admin/index';


const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
<React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
      <Routes>
        <Route path='/' element={ <App />}/>
        <Route path='/ia/:plan' element={ <Ia />}/>
        <Route path='/abonnement' element={ <SubscriptionPlans />}/>
        <Route path='/paiement/:plan' element={ <PaymentPage />}/>
        <Route path='/visio' element={ <Priere />}/>
        <Route path='/login' element={ <LoginPage />}/>
        <Route path="/qrcode" element={<QRCodeGenerator />} />

{/* ====== Dashboard area (Layout avec Sidebar + Header) ====== */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/rendezvous" element={<RendezVous />} />
            <Route path="/marketplace" element={<MarketPlace />} />
            <Route path="/consultation" element={<Consultation />} />

            {/* si tu as Notification/Parametres, ajoute-les aussi */}
            {/* <Route path="/notification" element={<Notification />} /> */}
            {/* <Route path="/parametres" element={<Parametres />} /> */}
          </Route>

        {/* ====== Admin Routes (Protected) ====== */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/veterinarians" 
          element={
            <ProtectedRoute>
              <AdminVeterinarians />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/payments" 
          element={
            <ProtectedRoute>
              <AdminPayments />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/products" 
          element={
            <ProtectedRoute>
              <AdminProducts />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/settings" 
          element={
            <ProtectedRoute>
              <AdminSettings />
            </ProtectedRoute>
          }
        />

      </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
