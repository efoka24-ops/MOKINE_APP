import React, { useEffect, useRef, useState } from "react";
import Slider from "react-slick";
import Header from "./components/Header";
import Footer from "./components/Footer";
import imageslide1 from './assets/images/mokinebox.jpg'
import imageslide2 from './assets/images/collier.jpg'
import imageslide3 from './assets/images/mokineapp.jpg'
import bg from './assets/images/eleveur1.jpg'
import apropos from './assets/images/abou.jpg'
import boeuf from './assets/images/boeuf.png'
import orange from './assets/images/orange.jpg'
import odc from './assets/images/odc.png'
import minsante from './assets/images/minsante.jpeg'
import minader from './assets/images/minader.jpeg'
import minepia from './assets/images/minepia.jpeg'
import missionimage from './assets/icones/mission.png'
import valeurimage from './assets/icones/value.png'
import visionimage from './assets/icones/circle.png'
import iaimage from './assets/images/mokineapp.png'
import appstore from './assets/images/store2.jpg'
import playstore from './assets/images/playstore.png'
import appv from './assets/images/mokineappv2.png'
import './style.css'
import {
    Clock,
    BellRing,
    Brain,
    FileText,
    MessageSquare,
    BarChart,
} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import HeaderHome from "./components/HeaderHome";
import MokineVetoBanner from "./components/MokineVetoBanner";
import MokineLabBanner from "./components/MokineLabBanner";

/* Helper component for scroll animations */
function AnimatedOnScroll({ children }) {
    const controls = useAnimation();
    const [ref, inView] = useInView({
        triggerOnce: true, // Only trigger animation once
        threshold: 0.1,    // Start animation when 10% of the component is visible
    });

    useEffect(() => {
        if (inView) {
            controls.start("visible");
        }
    }, [controls, inView]);

    const variants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    };

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={controls}
            variants={variants}
        >
            {children}
        </motion.div>
    );
}

/* Replace placeholders below with your real assets */
const HERO_TEXTS = [
    "Mokine box : votre ferme connectée en temps réel",
    "Mokine collar : un collier, milles informations",
    "Mokine app : votre troupeau dans votre poche"
];
const HERO_IMAGES = [
    imageslide1, imageslide2, imageslide3
];

const GRAY_STRIP_ITEMS = [
    { img: orange, title: "ORANGE CAMEROUN", subtitle: "Partenaire Officiel" },
    { img: minepia, title: "MINEPIA", subtitle: "Partenaire Officiel" },
    { img: minsante, title: "MINSANTE", subtitle: "Partenaire Officiel" },
    { img: minader, title: "MINADER", subtitle: "Partenaire Officiel" },
];

const VIDEO_YOUTUBE_EMBED = "https://www.youtube.com/embed/aEa-EISaCLw";

/* Helper small components inside file for rapid integration */
function GrayStrip({ items = GRAY_STRIP_ITEMS }) {
    return (
        <section className="mt-12 bg-gray-100 py-6 overflow-hidden">
            <div className="max-w-6xl mx-auto px-6">
                <div className="relative">
                    <div className="whitespace-nowrap animate-marquee">
                        {Array(3).fill(0).map((_, r) => (
                            <div key={r} className="inline-flex gap-8 pr-12 items-center">
                                {items.map((it, i) => (
                                    <div key={i} className="flex flex-col items-center justify-center">
                                        <img src={it.img} alt={it.title} className="w-16 h-16 object-contain rounded-full border-2 border-gray-200" />
                                        <h6 className="mt-2 font-semibold text-xs text-center">{it.title}</h6>
                                        <p className="text-[10px] text-gray-500 text-center">{it.subtitle}</p>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

/* Hero component: two synced sliders (text + image) */
function Hero() {
    const textSlider = useRef(null);
    const imgSlider = useRef(null);
    const [nav1, setNav1] = useState(null);
    const [nav2, setNav2] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (textSlider.current && imgSlider.current) {
            setNav1(textSlider.current);
            setNav2(imgSlider.current);
        }
    }, []);

    const sliderSettings = {
        asNavFor: nav2,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        fade: true,
        autoplay: true,
        autoplaySpeed: 4500,
        pauseOnHover: true,
        adaptiveHeight: true,
    };

    return (
        <section 
            id="home" 
            className="relative h-screen bg-gray-900 text-white overflow-hidden"
        >
            {/* Arrière-plan plein écran avec une superposition pour le contraste */}
            <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out" 
                 style={{ 
                    backgroundImage: `url(${imageslide1})` /* L'image est gérée par le slider, donc on peut mettre la première ici comme fond initial */
                 }}>
                <div className="absolute inset-0 bg-black opacity-60"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
            </div>

            {/* Contenu principal de la section */}
            <div className="relative z-10 h-full flex items-center justify-center">
                <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                        {/* Gauche : Textes */}
                        <motion.div
                            className="w-full md:w-1/2 relative z-10"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <h2 className="text-sm md:text-md uppercase tracking-widest text-[#178A3B] font-bold mb-2">Mokine</h2>
                            <Slider {...sliderSettings} ref={textSlider}>
                                {HERO_TEXTS.map((t, i) => (
                                    <div key={i}>
                                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight">
                                            {t}
                                        </h1>
                                        <p className="mt-4 md:mt-6 text-gray-300 max-w-md md:max-w-xl text-lg">
                                            La Mokine Box centralise toutes les données de vos animaux et
                                            les transmet directement sur votre application, même en zone
                                            reculée.
                                        </p>
                                    </div>
                                ))}
                            </Slider>

                            {/* Boutons */}
                            <motion.div
                                className="mt-8 flex gap-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                            >
                                <button onClick={() => { navigate('/visio') }} className="bg-[#178A3B] hover:bg-[#147932] transition text-white px-7 py-3 rounded-full font-semibold shadow-lg boutonherosection">
                                    Commander
                                </button>
                                <button onClick={() => { navigate('/mokinelab') }} className="border border-gray-600 hover:border-gray-400 transition text-white px-7 py-3 rounded-full font-semibold boutonherosection">
                                    Tester notre IA
                                </button>
                            </motion.div>
                        </motion.div>

                        {/* Droite : Images */}
                        <motion.div
                            className="w-full md:w-1/2 relative hidden md:block"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        >
                            <Slider {...sliderSettings} ref={imgSlider}>
                                {HERO_IMAGES.map((src, idx) => (
                                    <div key={idx} className="p-2">
                                        <img
                                        style={{height:src==imageslide3 && '30em'}}
                                            src={src}
                                            alt={`hero-${idx}`}
                                            className="w-full h-auto object-cover rounded-2xl shadow-2xl transform hover:scale-105 transition duration-300"
                                        />
                                    </div>
                                ))}
                            </Slider>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}


/* Reproduced sections after hero based on your second image */
function ContentSections() {
    const navigate = useNavigate();
    const steps = [
        { title: "Commander la Mokine Box", text: "Recevez votre Mokine Box contenant le collier connecté." },
        { title: "Installer le collier sur l'animal", text: "Fixez le collier sur l'animal pour un suivi en continu." },
        { title: "S'inscrire sur l'app", text: "Créez votre compte sur l'application mobile ou web." },
        { title: "L'IA analyse et propose un pré-diagnostic", text: "L'IA analyse les données et vous donne un diagnostic en temps réel." },
        { title: "Contacter un vétérinaire si besoin", text: "Contactez un vétérinaire en un clic si nécessaire." },
    ];
    return (
        <>
            <AnimatedOnScroll>
            <section id="about" className="max-w-6xl mx-auto mt-12">
                {/* Titre principal pour la section */}
                <div className="text-center mb-8">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-[#178A3B]">
                        À propos de Mokine
                    </h2>
                </div>

                <div className="bg-white rounded-xl p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-5 relative -top-3">
                        <img 
                            src={apropos} 
                            alt="Aboubakar" 
                            className="rounded-xl object-cover w-full h-96" 
                        />
                    </div>
                    <div className="md:col-span-7">
                        <h3 className="text-2xl font-extrabold mt-2">
                            D'Aboubakar à Mokine : une solution née du terrain
                        </h3>
                        <p className="mt-4 text-gray-600">
                            Après la perte d’une grande partie de son troupeau, Aboubakar a mis en lumière le besoin d’un suivi vétérinaire accessible. C’est ainsi qu’est née Mokine, une solution qui allie technologie et expertise pour protéger les animaux et soutenir les éleveurs.
                        </p>

                        <div className="flex flex-col items-start mt-5 gap-y-6">
                            <div className="flex flex-row justify-center items-center gap-x-4">
                                <img src={missionimage} className="h-6 w-6" />
                                <span><b>Mission</b> : Faciliter l’accès à des soins vétérinaires intelligents pour tous les éleveurs, même dans les zones à faible accès aux services.</span>
                            </div>

                            <div className="flex flex-row justify-center items-center gap-x-4">
                                <img src={visionimage} className="h-6 w-6" />
                                <span><b>Vision</b> : devenir le numéro un en télémédicine vétérinaire au cameroun.</span>
                            </div>

                            <div className="flex flex-row justify-center items-center gap-x-4">
                                <img src={valeurimage} className="h-6 w-6" />
                                <span><b>Valeurs</b> : innovation, accessibilité, fiabilité, proximité avec les utilisateurs, durabilité…</span>
                            </div>
                        </div>

                        <div className="mt-8 w-fll flex flex-col justify-center items-center">
                            <button className="bg-[#178A3B] text-white px-8 py-2 rounded-md">En savoir plus</button>
                        </div>
                    </div>
                </div>
            </section>
        </AnimatedOnScroll>

          <AnimatedOnScroll>
            <section id="solution" className="max-w-6xl mx-auto mt-12">
                {/* Titre principal pour la section */}
                <div className="text-center">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-[#178A3B]">
                        Notre solution
                    </h2>
                </div>

                <div className="w-full flex flex-row justify-center items-center">
                    <p className="text-center mt-8 text-xl font-bold w-11/12">
                        Mokine combine technologie et expertise vétérinaire pour offrir aux éleveurs un suivi simple, fiable et accessible. Notre solution repose sur trois outils complémentaires qui travaillent ensemble pour protéger chaque troupeau.
                    </p>
                </div>
            </section>
        </AnimatedOnScroll>


          <AnimatedOnScroll>
            <section id="collar" className="max-w-6xl mx-auto px-6 mt-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {/* Conteneur pour les images */}
                    {/* Utilisation de Flexbox pour placer les images côte à côte et les centrer verticalement */}
                    <div className="flex flex-col md:flex-row items-center justify-center">
                        <img 
                            src={boeuf} 
                            alt="Mokine Collar" 
                            className="rounded-xl object-cover w-full h-80 md:w-3/4" 
                        />
                        <img 
                            src={imageslide2} 
                            alt="Mokine Collar 2" 
                            className="rounded-xl object-cover w-1/2 md:w-1/3 md:bottom-0 bottom-12 h-44 relative right-12" 
                        />
                    </div>
                    <div>
                        <h3 className="text-2xl font-extrabold text-green-700">Mokine Collar</h3>
                        <p className="mt-4 text-gray-600">
                            Le collier connecté qui surveille en continu les données vitales de chaque animal. Véritable sentinelle, il détecte les premiers signes de maladies invisibles à l’œil nu.
                        </p>

                        <div className="flex flex-row flex-wrap justify-start items-start mt-5 gap-x-20 gap-y-6">
                            <div className="flex flex-row justify-center items-center gap-x-2">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M16.9244 3.97402C18.0593 5.16105 18.5087 6.79351 18.2727 8.33332H16.577C16.8315 7.21758 16.5458 5.98976 15.7197 5.12578C14.4971 3.84699 12.5472 3.84699 11.3246 5.12578L10.0003 6.5109L8.67603 5.12574C7.45341 3.84695 5.50353 3.84695 4.28091 5.12574C3.45485 5.98976 3.16907 7.21758 3.42357 8.33332H1.72794C1.49192 6.79351 1.94138 5.16101 3.07622 3.97398C4.81962 2.15054 7.56806 2.0189 9.45649 3.57918C9.60547 3.7024 9.74712 3.83423 9.88071 3.97398L10.0003 4.0991L10.1199 3.97402C10.2555 3.83219 10.3972 3.70058 10.5441 3.57918C12.4326 2.0189 15.181 2.15051 16.9244 3.97402ZM14.0683 11.6667H16.3742L10.0003 18.3333L3.62649 11.6667H5.93231L10.0003 15.9216L14.0683 11.6667ZM7.50032 4.80328L5.31782 9.16668H1.667V10.8333H6.34868L7.50032 8.53L10.0003 13.53L11.3486 10.8333H18.3336V9.16668H12.182L11.2503 7.30328L10.0003 9.8025L7.50032 4.80328Z" fill="#F9B233" />
                                </svg>
                                <span>Fréquence cardiaque</span>
                            </div>
                            <div className="flex flex-row flex-wrap justify-center items-center gap-x-2">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M16.9244 3.97402C18.0593 5.16105 18.5087 6.79351 18.2727 8.33332H16.577C16.8315 7.21758 16.5458 5.98976 15.7197 5.12578C14.4971 3.84699 12.5472 3.84699 11.3246 5.12578L10.0003 6.5109L8.67603 5.12574C7.45341 3.84695 5.50353 3.84695 4.28091 5.12574C3.45485 5.98976 3.16907 7.21758 3.42357 8.33332H1.72794C1.49192 6.79351 1.94138 5.16101 3.07622 3.97398C4.81962 2.15054 7.56806 2.0189 9.45649 3.57918C9.60547 3.7024 9.74712 3.83423 9.88071 3.97398L10.0003 4.0991L10.1199 3.97402C10.2555 3.83219 10.3972 3.70058 10.5441 3.57918C12.4326 2.0189 15.181 2.15051 16.9244 3.97402ZM14.0683 11.6667H16.3742L10.0003 18.3333L3.62649 11.6667H5.93231L10.0003 15.9216L14.0683 11.6667ZM7.50032 4.80328L5.31782 9.16668H1.667V10.8333H6.34868L7.50032 8.53L10.0003 13.53L11.3486 10.8333H18.3336V9.16668H12.182L11.2503 7.30328L10.0003 9.8025L7.50032 4.80328Z" fill="#F9B233" />
                                </svg>
                                <span>Température</span>
                            </div>
                        </div>

                        <div className="flex flex-row flex-wrap justify-start gap-x-28 items-start mt-8 gap-y-6">
                            <div className="flex flex-row justify-center items-center gap-x-2">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16.6663 8.33341C16.6663 12.4942 12.0505 16.8276 10.5005 18.1659C10.3561 18.2745 10.1803 18.3332 9.99967 18.3332C9.81901 18.3332 9.64324 18.2745 9.49884 18.1659C7.94884 16.8276 3.33301 12.4942 3.33301 8.33341C3.33301 6.5653 4.03539 4.86961 5.28563 3.61937C6.53587 2.36913 8.23156 1.66675 9.99967 1.66675C11.7678 1.66675 13.4635 2.36913 14.7137 3.61937C15.964 4.86961 16.6663 6.5653 16.6663 8.33341Z" stroke="#F9B233" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M10 10.8335C11.3807 10.8335 12.5 9.71421 12.5 8.3335C12.5 6.95278 11.3807 5.8335 10 5.8335C8.61929 5.8335 7.5 6.95278 7.5 8.3335C7.5 9.71421 8.61929 10.8335 10 10.8335Z" stroke="#F9B233" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>Géolocalisation</span>
                            </div>

                            <div className="flex flex-row justify-center items-center gap-x-2">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M15.9879 7.34367L15.7191 7.61242C15.2601 8.0718 15.0017 8.69426 15.0004 9.34367V9.99992C15.0004 10.5187 15.4191 10.9374 15.9379 10.9374C16.4566 10.9374 16.8754 10.5187 16.8754 9.99992V7.71242C16.8754 7.24992 16.3129 7.01867 15.9879 7.34367ZM8.81289 10.1687L10.7754 11.6437C11.0941 11.8812 10.9254 12.3812 10.5316 12.3812H9.03164C8.87251 12.3812 8.7199 12.318 8.60738 12.2054C8.49485 12.0929 8.43164 11.9403 8.43164 11.7812V10.3624C8.43164 10.1624 8.65664 10.0499 8.81289 10.1687ZM14.7441 11.7624C14.7441 11.9265 14.679 12.0839 14.5629 12.1999C14.4469 12.316 14.2895 12.3812 14.1254 12.3812C13.9613 12.3812 13.8039 12.316 13.6879 12.1999C13.5718 12.0839 13.5066 11.9265 13.5066 11.7624C13.5066 11.5983 13.5718 11.4409 13.6879 11.3249C13.8039 11.2089 13.9613 11.1437 14.1254 11.1437C14.2895 11.1437 14.4469 11.2089 14.5629 11.3249C14.679 11.4409 14.7441 11.5983 14.7441 11.7624Z" fill="#F9B233" />
                                    <path d="M5.0725 1.99375C5.01714 1.88217 4.9912 1.7583 4.99714 1.63389C5.00308 1.50948 5.0407 1.38864 5.10643 1.28284C5.17216 1.17704 5.26383 1.08979 5.37274 1.02935C5.48165 0.968914 5.60419 0.937298 5.72875 0.937501C5.99563 0.937501 6.25875 1.08563 6.38375 1.34375L6.79937 2.16875H7.0625V2.1625H9.99375V2.7875C9.99375 3.6125 9.50313 4.32688 8.79875 4.65375C9.26102 5.07833 9.86609 5.31348 10.4938 5.3125H15.8187C17.7838 5.3125 19.375 6.90625 19.375 8.875V16.5625C19.0446 16.5625 18.7276 16.4317 18.4933 16.1986C18.2591 15.9655 18.1267 15.6492 18.125 15.3188V18.2813C18.125 18.7138 17.7763 19.0625 17.3438 19.0625H16.4062C15.9738 19.0625 15.625 18.7138 15.625 18.2813V16.4263L15.1437 16.3069C14.9881 16.2684 14.8363 16.2161 14.69 16.1506L13.9131 18.8681C13.9026 18.9048 13.8805 18.937 13.85 18.9599C13.8196 18.9828 13.7825 18.9951 13.7444 18.995H12.7013C12.6737 18.9955 12.6465 18.9894 12.6218 18.9773C12.5971 18.9652 12.5757 18.9474 12.5592 18.9253C12.5427 18.9033 12.5317 18.8777 12.5271 18.8506C12.5224 18.8235 12.5243 18.7956 12.5325 18.7694L13.4312 15.625H13.05C12.4875 15.625 11.955 15.4738 11.555 15.1556C11.3903 15.0264 11.251 14.8677 11.1444 14.6875H10.6306L11.17 16.5663C11.2262 16.7713 11.2262 16.9831 11.17 17.1806L10.6763 18.8681C10.6657 18.9049 10.6435 18.9372 10.6129 18.9601C10.5823 18.983 10.5451 18.9952 10.5069 18.995H9.46187C9.43434 18.9953 9.40711 18.9891 9.38241 18.977C9.35771 18.9648 9.33624 18.9469 9.31973 18.9249C9.30323 18.9028 9.29216 18.8772 9.28743 18.8501C9.28269 18.8229 9.28443 18.7951 9.2925 18.7688L9.82875 16.9406C9.84289 16.9019 9.84289 16.8594 9.82875 16.8206L9.3675 15.2113C9.35519 15.5524 9.25149 15.884 9.06722 16.1714C8.88296 16.4588 8.6249 16.6914 8.32 16.845L8.11875 16.9469V18.2813C8.11875 18.7138 7.77 19.0625 7.3375 19.0625H6.4C5.9675 19.0625 5.61875 18.7138 5.61875 18.2813V14.4913C5.29149 14.3422 5.00536 14.1159 4.78499 13.8317C4.56462 13.5475 4.41663 13.2141 4.35375 12.86L4.35313 12.8575L3.92812 10.4219L3.56562 8.425H2.8625C2.26908 8.425 1.69996 8.18927 1.28035 7.76965C0.860736 7.35004 0.625 6.78092 0.625 6.1875C0.625 5.63875 0.9 5.1375 1.34813 4.84188L4.595 2.675C4.79863 2.53763 5.01868 2.42635 5.25 2.34375L5.0725 1.99375ZM5.64375 8.425H4.83625L4.95187 9.0625H5.55C6.0125 9.0625 6.45625 9.25 6.78125 9.58125C7.16875 9.975 7.175 10.6125 6.7875 11.0125L6.4125 11.4063C6.30498 11.5193 6.24463 11.669 6.24375 11.825V12.0875C6.24375 12.4856 6.1125 12.8656 5.87062 13.175C6.00312 13.3013 6.17125 13.3888 6.35687 13.4231L6.86875 13.5169V16.1781L7.755 15.73C7.98125 15.615 8.11875 15.3894 8.11875 15.15V13.4375H12.74C12.9713 13.4375 13.1837 13.3581 13.3669 13.22C13.4399 13.1648 13.5242 13.1263 13.6138 13.1073C13.7034 13.0883 13.7961 13.0891 13.8853 13.1099C13.9745 13.1306 14.058 13.1707 14.13 13.2274C14.202 13.284 14.2607 13.3557 14.3019 13.4375H14.3225L14.3294 13.5C14.3555 13.57 14.3688 13.6441 14.3687 13.7188C14.3687 14.37 14.8112 14.9375 15.4437 15.0938H15.4444L16.875 15.4488V12.0319L17.1562 11.8469C17.3396 11.7256 17.5042 11.579 17.65 11.4069L18.125 10.8494V8.875C18.125 7.59375 17.0912 6.5625 15.8187 6.5625H15.0131L14.8312 6.775C14.5375 7.11875 14.375 7.55625 14.375 8.0125V9.25C14.375 10.1813 13.6188 10.9375 12.675 10.9438C12.3959 10.9443 12.121 10.8756 11.875 10.7438L9.8375 9.65625C9.50694 9.47808 9.23075 9.21379 9.03819 8.8914C8.84564 8.569 8.7439 8.20052 8.74375 7.825V6.13063C8.59123 6.05041 8.44443 5.95978 8.30437 5.85938C8.27929 6.54827 7.988 7.20058 7.49178 7.67908C6.99556 8.15758 6.3331 8.42497 5.64375 8.425ZM12.7375 14.6875H11.9712C12.2337 14.885 12.6087 15 13.05 15H13.4462C13.3792 14.8791 13.3224 14.7528 13.2763 14.6225C13.0999 14.6658 12.919 14.6876 12.7375 14.6875ZM6.25625 3.41875C5.91 3.41875 5.57625 3.52 5.29375 3.71125L5.29063 3.71375L3.25312 5.07313C3.4425 5.2775 3.575 5.5725 3.575 5.9375H3.6625C3.69055 5.70894 3.77287 5.49041 3.90257 5.30014C4.03228 5.10987 4.20562 4.95339 4.40812 4.84375L6.63625 3.41875H6.25625ZM2.5625 6.825C2.3875 6.825 2.25 6.6875 2.25 6.5125V6.1625C2.25 5.9875 2.3875 5.85 2.5625 5.85C2.7375 5.85 2.875 5.9875 2.875 6.1625V6.50625C2.875 6.68125 2.7375 6.825 2.5625 6.825ZM4.375 5.89375C4.375 6.0625 4.5125 6.20625 4.6875 6.20625C4.8625 6.20625 5 6.0625 5 5.89375V5.46875C5 5.29375 4.8625 5.15625 4.6875 5.15625C4.5125 5.15625 4.375 5.29375 4.375 5.46875V5.89375Z" fill="#F9B233" />
                                </svg>
                                <span>Activité</span>
                            </div>
                        </div>

                        <div className="mt-10">
                            <button className="bg-[#178A3B] text-white px-8 py-2 rounded-md">Commander</button>
                        </div>
                    </div>
                </div>
            </section>
        </AnimatedOnScroll>


           <AnimatedOnScroll>
    <section id="app" className="max-w-6xl mx-auto px-6 mt-12 mb-20">
        <div className="relative p-6 flex flex-col items-center text-center">
            <h3 className="text-2xl font-extrabold text-green-700 relative z-10">Mokine App</h3>
            <p className="mt-4 text-gray-600 max-w-2xl relative z-10">
                Une application simple qui centralise le suivi du troupeau, envoie les alertes et connecte directement aux vétérinaires accessibles partout même en zone rurale.
            </p>

            <div className="mt-8 w-full flex flex-col md:flex-row items-center justify-center gap-6 relative z-10">
                <div className="md:w-1/3 flex flex-col gap-4 items-center md:items-end md:pr-12 md:mt-12">
                    <div className="bg-green-100 rounded-lg p-4 w-full max-w-xs animate-pulse">
                        <p className="font-semibold">Carnet de suivi sanitaire</p>
                    </div>
                    <div className="bg-green-100 rounded-lg p-4 w-full max-w-xs animate-bounce">
                        <p className="font-semibold">Multilingue</p>
                    </div>
                </div>

                <div className="md:w-1/2 flex-shrink-0 md:mt-8 md:mb-8">
                    <img src={appv} alt="Mokine App" className="rounded-xl w-full scale-[1.6] max-w-md mx-auto" />
                </div>

                <div className="md:w-1/3 flex flex-col gap-4 items-center md:items-start md:pl-12">
                    <div className="bg-green-100 rounded-lg p-4 w-full max-w-xs animate-pulse">
                        <p className="font-semibold">Chat avec vétérinaire</p>
                    </div>
                    <div className="bg-green-100 rounded-lg p-4 w-full max-w-xs animate-bounce">
                        <p className="font-semibold">Carte intégrée</p>
                    </div>
                </div>
            </div>

            <div className="mt-12 flex gap-4 relative z-10">
                <a href="#" className="inline-block"><img src={playstore} alt="play" className="h-12 w-full" /></a>
                <a href="#" className="inline-block"><img src={appstore} className="h-10 relative top-1 w-full" alt="appstore" /></a>
            </div>
        </div>
    </section>
</AnimatedOnScroll>

<AnimatedOnScroll>
  <section
    id="ia"
    className="relative max-w-6xl mx-auto px-6 mt-12 overflow-visible"
    style={{ minHeight: '600px' }} // Assure un espace suffisant
  >
    {/* Dégradés verts subtils */}
    <div className="absolute inset-0 bg-gradient-to-tr from-green-50 via-green-100 to-transparent -z-30"></div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center overflow-visible relative">
      {/* Texte */}
      <div className="relative z-20">
        <h3 className="text-2xl font-extrabold text-green-700">Mokine IA</h3>
        <p className="mt-4 text-gray-600">
          Mokine IA analyse en temps réel les données des colliers et les médias
          envoyés par l'éleveur, fournit un prédiagnostic rapide, alerte en cas
          de risque et propose des actions concrètes.
        </p>

        <p className="mt-6 text-gray-600">
          Testez notre IA dès maintenant : gratuite avec la Mokine Box, ou par
          abonnement avec une semaine d'essai offerte.
        </p>

        <div className="mt-6">
          <button
            onClick={() => navigate("/mokinelab")}
            className="bg-[#178A3B] text-white px-4 py-2 rounded-md"
          >
            Tester notre IA
          </button>
        </div>
      </div>

      {/* Image + Ellipses décoratives */}
      <div className="relative flex items-center justify-center overflow-visible min-h-[600px]">
        {/* Ellipses avec z-index plus élevé et position absolue stable */}
        <div 
          className="absolute border-2 border-yellow-400 rounded-full -rotate-12 pointer-events-none"
          style={{
            width: '384px',
            height: '450px',
            zIndex: 1,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%) rotate(-12deg)',
          }}
        ></div>
        
        <div 
          className="absolute border-2 border-yellow-500 rounded-full rotate-6 pointer-events-none"
          style={{
            width: '420px',
            height: '500px',
            zIndex: 2,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%) rotate(6deg)',
          }}
        ></div>
        
        <div 
          className="absolute border-2 border-yellow-300 rounded-full rotate-12 pointer-events-none"
          style={{
            width: '460px',
            height: '550px',
            zIndex: 3,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%) rotate(12deg)',
          }}
        ></div>

        {/* Dégradé vert fixe derrière l'image */}
        <div 
          className="absolute bg-gradient-to-br from-green-100 via-green-100 to-green-200 rounded-xl opacity-30 blur-sm pointer-events-none"
          style={{
            width: '420px',
            height: '520px',
            zIndex: 4,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        ></div>

        {/* Image avec z-index plus élevé */}
        <img
          src={iaimage}
          alt="Mokine App"
          className="relative scale-[1.6] w-full max-w-xl md:max-w-2xl rounded-xl"
          style={{ zIndex: 10 }}
        />
      </div>
    </div>
  </section>
</AnimatedOnScroll>

           <AnimatedOnScroll>
    <section id="demo" className="max-w-6xl mx-auto px-6 mt-12 mb-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="flex flex-col lg:flex-row items-stretch min-h-[400px]">
                {/* Section texte */}
                <div className="lg:w-1/2 flex flex-col justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8 lg:p-12">
                    <div className="space-y-6">
                        <h3 className="font-bold text-3xl lg:text-4xl text-gray-800 leading-tight">
                            Découvrez Mokine en action
                        </h3>
                        <div className="space-y-4 text-gray-600 text-lg">
                            <p>
                                Avec Mokine, l'éleveur surveille ses bêtes en temps réel, reçoit des alertes précises et bénéficie d'un prédiagnostic grâce à l'IA.
                            </p>
                            <p>
                                Découvrez à travers cette démo comment notre solution transforme la santé animale et protège les troupeaux.
                            </p>
                        </div>
                        
                        {/* Bouton CTA optionnel */}
                        <div className="pt-4">
                            <button className="bg-[#178A3B] hover:bg-[#147932] text-white px-6 py-3 rounded-lg font-semibold transition duration-300 shadow-md hover:shadow-lg">
                                Commander maintenant
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Section vidéo */}
                <div className="lg:w-1/2 bg-black flex items-center justify-center min-h-[300px] lg:min-h-[400px]">
                    <div className="relative w-full h-full">
                        <iframe
                            src={VIDEO_YOUTUBE_EMBED}
                            className="w-full h-full"
                            style={{ minHeight: '350px', border: 'none' }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="Démo Mokine"
                        />
                    </div>
                </div>
            </div>
        </div>
    </section>
</AnimatedOnScroll>

            <AnimatedOnScroll>
                <section id="why" className="max-w-6xl mx-auto px-6 mt-24">
                    <h3 className="text-2xl font-extrabold text-center text-green-700 text-3xl">Pourquoi choisir MOKINE ?</h3>
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {[
                            { title: "Suivi en temps réel", text: "Surveillance continue pour chaque animal.", icon: <Clock /> },
                            { title: "Alertes intelligentes", text: "Notifications précoces en cas d'anomalies.", icon: <BellRing /> },
                            { title: "Prédictions par IA", text: "Analyse pour anticiper les maladies.", icon: <Brain /> },
                            { title: "Carnet de santé digital", text: "Historique & traitements.", icon: <FileText /> },
                            { title: "Conseils vétérinaires", text: "Accès à des recommandations pratiques.", icon: <MessageSquare /> },
                            { title: "Statistiques & rapports", text: "Décisions basées sur des données.", icon: <BarChart /> },
                        ].map((c, i) => (
                            <AnimatedOnScroll key={i}>
                                <div className="bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-green-200 text-green-700 mb-4 flex items-center justify-center">
                                        {c.icon}
                                    </div>
                                    <h4 className="font-semibold">{c.title}</h4>
                                    <p className="text-sm text-gray-600 mt-2">{c.text}</p>
                                </div>
                            </AnimatedOnScroll>
                        ))}
                    </div>
                </section>
            </AnimatedOnScroll>

            <AnimatedOnScroll>
                <section id="steps" className="max-w-6xl mx-auto px-6 mt-20">
                    <h3 className="text-center text-4xl font-extrabold text-green-700">Le parcours Mokine en 5 étapes</h3>
                    <div className="relative mt-12 px-2 md:px-12">
                        {/* Vertical line for mobile and desktop */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-green-300 h-full hidden md:block"></div>

                        {steps.map((step, i) => (
                            <div key={i} className={`flex flex-col relative w-full mb-12 md:mb-20`}>
                                {/* Zigzag line connector (desktop only) */}
                                {i > 0 && (
                                    <div className={`absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full hidden md:block z-0 ${i % 2 !== 0 ? 'top-0' : 'top-0'}`}>
                                        <svg className={`absolute ${i % 2 !== 0 ? 'right-0' : 'left-0'} top-1/2 transform -translate-y-1/2 ${i % 2 !== 0 ? 'rotate-180' : ''}`} width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d={`M25,0 L25,50 M25,25 L${i % 2 !== 0 ? '0' : '50'},25`} stroke="#86EFAC" strokeWidth="2" />
                                        </svg>
                                    </div>
                                )}

                                {/* Step content */}
                                <div className={`flex items-center flex-col-reverse md:flex-row ${i % 2 === 0 ? 'md:flex-row-reverse md:pr-[calc(50%-2rem)]' : 'md:flex-row md:pl-[calc(50%-2rem)]'}`}>
                                    {/* Number above card (mobile only) */}
                                    <div className="mb-2 md:hidden flex items-center justify-center w-12 h-12 rounded-full bg-green-600 text-white font-bold text-xl">
                                        {i + 1}
                                    </div>
                                    <AnimatedOnScroll>
                                        <div className="md:w-1/2 w-full">
                                            <div className={`p-4 bg-white rounded-lg shadow-md w-full relative z-10 text-center ${i % 2 === 0 ? "md:text-right md:ml-auto" : "md:text-left md:mr-auto"}`}>
                                                {/* Number on the side (desktop only) */}
                                                <div className={`absolute top-1/2 transform -translate-y-1/2 -mt-6 w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center hidden md:flex ${i % 2 === 0 ? "md:-left-6" : "md:-right-6"}`}>
                                                    <span className="font-bold text-xl">{i + 1}</span>
                                                </div>
                                                <h4 className="text-lg font-semibold">{step.title}</h4>
                                                <p className="text-sm text-gray-600 mt-1">{step.text}</p>
                                            </div>
                                        </div>
                                    </AnimatedOnScroll>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </AnimatedOnScroll>

            <FAQ />

            <AnimatedOnScroll>
                <section id="contact" className="max-w-6xl mx-auto px-4 mt-12 mb-20">
                    <div className="bg-white rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 bg-[#e6f6ea] p-6 rounded-lg">
                            <h4 className="font-bold">Informations</h4>
                            <p className="mt-3 text-sm">Adresse: Garoua - Cameroun</p>
                            <p className="text-sm mt-2">Téléphone: +237 678 758 976</p>
                            <p className="text-sm mt-2">Email: infos@trugroup.cm</p>
                        </div>
                        <div className="md:col-span-2">
                            <h4 className="font-bold">Envoyez-nous un message</h4>
                            <form className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input className="border rounded p-3" placeholder="Nom" />
                                <input className="border rounded p-3" placeholder="Email" />
                                <input className="border rounded p-3 md:col-span-2" placeholder="Sujet" />
                                <textarea className="border rounded p-3 md:col-span-2" placeholder="Votre message" rows={5} />
                                <button className="bg-[#178A3B] text-white px-4 py-3 rounded-md md:col-span-2">Envoyer</button>
                            </form>
                        </div>
                    </div>
                </section>
            </AnimatedOnScroll>
        </>
    );
}

// FAQ component as provided by the user
function FAQ() {
    const items = [
        { q: "Comment fonctionne la Mokine Box ?", a: "Elle collecte les données vitales de vos animaux et les transmet à l’application mobile." },
        { q: "L'IA peut-elle remplacer un vétérinaire ?", a: "Non, elle propose un prédiagnostic et des conseils, mais un vétérinaire reste indispensable." },
        { q: "Puis-je utiliser Mokine hors ligne ?", a: "Oui, certaines fonctionnalités sont disponibles même sans connexion internet." },
        { q: "Quels sont les coûts associés ?", a: "La Mokine Box est disponible à l’achat et l’IA par abonnement flexible." },
    ];

    return (
        <AnimatedOnScroll>
            <section id="faq" className="max-w-6xl mx-auto px-6 mt-20 mb-20">
                <h3 className="text-center text-3xl font-extrabold text-green-700">FAQ</h3>
                <div className="mt-8 space-y-4">
                    {items.map((item, idx) => (
                        <details key={idx} className="border rounded-lg p-4 bg-white shadow-sm">
                            <summary className="cursor-pointer font-semibold text-gray-800">{item.q}</summary>
                            <p className="mt-2 text-gray-600">{item.a}</p>
                        </details>
                    ))}
                </div>
            </section>
        </AnimatedOnScroll>
    );
}

export default function App() {
    return (
        <div className="min-h-screen font-sans text-gray-800 bg-gradient-to-b from-white to-gray-50">
            <HeaderHome />
            <main className="">
                <Hero />
                <MokineVetoBanner />
                <MokineLabBanner />
                <ContentSections />
            </main>
             <GrayStrip />
            <Footer />
        </div>
    );
}