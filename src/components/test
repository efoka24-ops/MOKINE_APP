import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  BellIcon,
  Cog6ToothIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import logo from "../assets/mokine.jpg";
import dashboardImage from "../assets/dashboard.jpg";

function pageTitle(pathname) {
  switch (pathname) {
    case "/dashboard":
      return "Dashboard";
    case "/rendezvous":
      return "Rendez-vous";
    case "/marketplace":
      return "Market place";
    case "/consultation":
      return "Consultation";
    default:
      return "";
  }
}

export default function Header({ toggleSidebar }) {
  const { pathname } = useLocation();
  const title = pageTitle(pathname);
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const notificationCount = 3;

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    setSettingsOpen(false);
  };

  const toggleSettings = () => {
    setSettingsOpen(!settingsOpen);
    setNotificationsOpen(false);
  };

  return (
    <header className="w-full h-16 bg-white shadow-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {/* Menu icon for mobile */}
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 text-gray-600 hover:text-gray-900"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        {/* Page title */}
        <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
      </div>

      <div className="flex items-center gap-4 relative">
        <span className="text-gray-500 text-sm hidden sm:block">{today}</span>

        {/* Notification icon with badge */}
        <div className="relative">
          <button
            onClick={toggleNotifications}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <BellIcon className="h-6 w-6" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-10">
              <div className="px-4 py-2 text-sm text-gray-500">
                Vous avez {notificationCount} nouvelles notifications.
              </div>
              {/* Exemple de notifications */}
              <div className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                Nouveau rendez-vous
              </div>
              <div className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                Paiement reçu
              </div>
            </div>
          )}
        </div>

        {/* Settings icon */}
        <div className="relative">
          <button
            onClick={toggleSettings}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <Cog6ToothIcon className="h-6 w-6" />
          </button>
          {settingsOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              {/* Exemple de menu Paramètres */}
              <div className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                Mon profil
              </div>
              <div className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                Confidentialité
              </div>
              <div className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                Aide
              </div>
            </div>
          )}
        </div>

        {/* User profile (hidden on mobile)
        <div className="hidden sm:flex items-center gap-2">
          <img
            src={dashboardImage}
            alt="profile"
            className="w-9 h-9 rounded-full border"
          />
          <span className="text-sm">Dr Nasser</span>
        </div> */}
      </div>
    </header>
  );
}