import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from '../assets/logo.png';

export default function HeaderHome() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const handleLinkClick = () => {
        setMobileMenuOpen(false);
    };

    // Gestion de l'état de défilement
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            if (scrollPosition > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        // Nettoyage de l'écouteur d'événement
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const headerClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out
                          ${isScrolled ? 'bg-white shadow-md' : 'bg-transparent'}`;
    
    const textClasses = `transition-colors duration-300 ease-in-out 
                         ${isScrolled ? 'text-gray-800' : 'text-white'}`;
    
    const navTextClasses = `hover:text-[#178A3B] transition-colors duration-300 ease-in-out`;

    return (
        <header className={headerClasses}>
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="MokineVet" className="h-10 w-auto object-contain" />
                </div>

                {/* Desktop nav */}
                <nav className={`hidden md:flex gap-6 text-sm items-center`}>
                    <a href="#" className={`${textClasses} ${navTextClasses}`}>Accueil</a>
                    <a href="/#about" className={`${textClasses} ${navTextClasses}`}>À propos</a>
                    <a href="/#solution" className={`${textClasses} ${navTextClasses}`}>Solution</a>
                    <a href="/#why" className={`${textClasses} ${navTextClasses}`}>Pourquoi</a>
                    <a href="/#contact" className={`${textClasses} ${navTextClasses}`}>Contact</a>
                    <button 
                        onClick={() => navigate('/login')} 
                        className="ml-4 bg-[#178A3B] text-white px-4 py-2 rounded-md text-sm transition-colors hover:bg-[#147932]"
                    >
                        Se connecter
                    </button>
                    {/* Selecteur de langue */}
                    <select
                        defaultValue="en"
                        className={`ml-4 p-2 rounded-md text-sm cursor-pointer
                                   ${isScrolled ? 'bg-white border-gray-300 text-gray-800' : 'bg-transparent border-gray-400 text-white'}
                                   focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-300`}
                    >
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                    </select>
                </nav>

                {/* Mobile menu button */}
                <button
                    className={`md:hidden p-2 rounded-md border text-xl transition-all duration-300 ease-in-out transform
                               ${isScrolled ? 'border-gray-300 text-gray-800' : 'border-gray-400 text-white'}`}
                    onClick={toggleMobileMenu}
                >
                    {mobileMenuOpen ? '×' : '☰'}
                </button>
            </div>

            {/* Mobile off-canvas container */}
            <div 
                className={`fixed inset-0 z-40 bg-black/40 md:hidden transition-opacity duration-300 ease-in-out ${
                    mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={handleLinkClick}
            >
                <div 
                    className={`w-full bg-white shadow-lg p-6 flex flex-col absolute top-16 transition-transform duration-300 ease-in-out ${
                        mobileMenuOpen ? 'transform translate-y-0' : 'transform -translate-y-full'
                    }`}
                    onClick={e => e.stopPropagation()}
                >
                    <nav className="flex flex-col gap-4 text-gray-700">
                        <Link to="/" onClick={handleLinkClick} className="hover:text-[#178A3B]">Accueil</Link>
                        <Link to="/about" onClick={handleLinkClick} className="hover:text-[#178A3B]">À propos</Link>
                        <Link to="/solution" onClick={handleLinkClick} className="hover:text-[#178A3B]">Solution</Link>
                        <Link to="/why" onClick={handleLinkClick} className="hover:text-[#178A3B]">Pourquoi</Link>
                        <Link to="/contact" onClick={handleLinkClick} className="hover:text-[#178A3B]">Contact</Link>
                        <button className="mt-4 bg-[#178A3B] text-white px-4 py-2 rounded-md text-sm hover:bg-[#147932]">
                            Se connecter
                        </button>
                         {/* Selecteur de langue mobile */}
                        <select
                            defaultValue="en"
                            className="mt-4 p-2 w-full rounded-md text-sm cursor-pointer border border-gray-300 text-gray-700"
                        >
                            <option value="en">English</option>
                            <option value="fr">Français</option>
                        </select>
                    </nav>
                </div>
            </div>
        </header>
    );
}
