// src/layout/Layout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar pour mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />

      {/* Contenu principal (Header + Main) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-transform duration-300 ${
          isSidebarOpen ? "transform translate-x-64" : ""
        } md:transform-none`}
      >
        <Header toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}