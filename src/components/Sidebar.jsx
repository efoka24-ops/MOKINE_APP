// src/components/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  CalendarIcon,
  ShoppingCartIcon,
  BriefcaseIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";
import logo from "../assets/logo.png";
import dashboardImage from "../assets/dashboard.jpg";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { to: "/rendezvous", label: "Rendez-vous", icon: CalendarIcon },
  { to: "/marketplace", label: "Market place", icon: ShoppingCartIcon },
  { to: "/consultation", label: "Consultation", icon: BriefcaseIcon },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md p-4 transition-transform transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:relative md:translate-x-0 md:flex md:flex-col md:h-screen md:sticky md:top-0`}
    >
      <div className="flex items-center justify-between mb-6">
        <NavLink to={'/'} className="flex items-center gap-3">
          <img src={logo} alt="Mokine" className="w-20 h-8 rounded object-cover" style={{aspectRatio: '1080 / 423'}} />
          <span className="text-xl font-bold text-green-800">Mokine</span>
        </NavLink>
        <button onClick={onClose} className="md:hidden text-gray-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <nav className="flex-1 space-y-2">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-md transition ${
                isActive
                  ? "bg-green-100 text-green-700 font-semibold"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            <l.icon className="h-5 w-5" />
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={dashboardImage}
              alt="User"
              className="w-10 h-10 rounded-full"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Dr Nasser</span>
              <span className="text-xs text-red-500">Profil incomplet</span>
            </div>
          </div>
          <button className="p-2 text-gray-500 hover:text-red-500">
            <ArrowLeftOnRectangleIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </aside>
  );
}