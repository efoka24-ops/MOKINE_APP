import React, { useEffect, useRef, useState } from "react";
import { useI18n } from './i18n/index.js';
import { useSettings } from './hooks/useSettings.js';
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

/* Video source (place in public/video/mokine-demo.mp4) */
const VIDEO_SRC = "/video/mokine-demo.mp4";

/* Helper small components inside file for rapid integration */
function GrayStrip({ items = GRAY_STRIP_ITEMS }) {
    const { t } = useI18n();
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
                                        <p className="text-[10px] text-gray-500 text-center">{t('home.content.partner_label')}</p>
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
    const { t } = useI18n();

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
                                {[t('home.hero.slide1'), t('home.hero.slide2'), t('home.hero.slide3')].map((slide, i) => (
                                    <div key={i}>
                                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight">
                                            {slide}
                                        </h1>
                                        <p className="mt-4 md:mt-6 text-gray-300 max-w-md md:max-w-xl text-lg">
                                            {t('home.hero.subtitle')}
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
                                <button onClick={() => { navigate('/commande') }} className="bg-[#178A3B] hover:bg-[#147932] transition text-white px-7 py-3 rounded-full font-semibold shadow-lg boutonherosection">
                                    {t('home.hero.btn_order')}
                                </button>
                                <button onClick={() => { navigate('/mokinelab') }} className="border border-gray-600 hover:border-gray-400 transition text-white px-7 py-3 rounded-full font-semibold boutonherosection">
                                    {t('home.hero.btn_lab')}
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
    const { t } = useI18n();
    const settings = useSettings();
    const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [contactStatus, setContactStatus] = useState('');

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        setContactStatus('loading');
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactForm),
            });
            await res.json();
            setContactStatus(res.ok ? 'success' : 'error');
            if (res.ok) setContactForm({ name: '', email: '', subject: '', message: '' });
        } catch {
            setContactStatus('error');
        }
    };

    const steps = t('home.content.steps');
    return (
        <>
            <AnimatedOnScroll>
            <section id="about" className="max-w-6xl mx-auto mt-12">
                {/* Titre principal pour la section */}
                <div className="text-center mb-8">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-[#178A3B]">
                        {t('home.content.about_title')}
                    </h2>
                </div>

                <div className="bg-white rounded-xl p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-5 relative -top-3">
                        <img src={apropos} alt="Aboubakar" className="rounded-xl object-cover w-full h-96" />
                    </div>
                    <div className="md:col-span-7">
                        <h3 className="text-2xl font-extrabold mt-2">{t('home.content.about_story_title')}</h3>
                        <p className="mt-4 text-gray-600">{t('home.content.about_story')}</p>

                        <div className="flex flex-col items-start mt-5 gap-y-6">
                            <div className="flex flex-row justify-center items-center gap-x-4">
                                <img src={missionimage} className="h-6 w-6" alt="" />
                                <span><b>{t('home.content.mission_label')}</b> : {t('home.content.mission')}</span>
                            </div>
                            <div className="flex flex-row justify-center items-center gap-x-4">
                                <img src={visionimage} className="h-6 w-6" alt="" />
                                <span><b>{t('home.content.vision_label')}</b> : {t('home.content.vision')}</span>
                            </div>
                            <div className="flex flex-row justify-center items-center gap-x-4">
                                <img src={valeurimage} className="h-6 w-6" alt="" />
                                <span><b>{t('home.content.values_label')}</b> : {t('home.content.values')}</span>
                            </div>
                        </div>

                        <div className="mt-8 w-full flex flex-col justify-center items-center">
                            <button className="bg-[#178A3B] text-white px-8 py-2 rounded-md">{t('home.content.learn_more')}</button>
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
                        {t('home.content.solution_title')}
                    </h2>
                </div>
                <div className="w-full flex flex-row justify-center items-center">
                    <p className="text-center mt-8 text-xl font-bold w-11/12">{t('home.content.solution_text')}</p>
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
                        <p className="mt-4 text-gray-600">{t('home.content.collar_desc')}</p>

                        <div className="flex flex-row flex-wrap justify-start items-start mt-5 gap-x-20 gap-y-6">
                            <div className="flex flex-row justify-center items-center gap-x-2">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M16.9244 3.97402C18.0593 5.16105 18.5087 6.79351 18.2727 8.33332H16.577C16.8315 7.21758 16.5458 5.98976 15.7197 5.12578C14.4971 3.84699 12.5472 3.84699 11.3246 5.12578L10.0003 6.5109L8.67603 5.12574C7.45341 3.84695 5.50353 3.84695 4.28091 5.12574C3.45485 5.98976 3.16907 7.21758 3.42357 8.33332H1.72794C1.49192 6.79351 1.94138 5.16101 3.07622 3.97398C4.81962 2.15054 7.56806 2.0189 9.45649 3.57918C9.60547 3.7024 9.74712 3.83423 9.88071 3.97398L10.0003 4.0991L10.1199 3.97402C10.2555 3.83219 10.3972 3.70058 10.5441 3.57918C12.4326 2.0189 15.181 2.15051 16.9244 3.97402ZM14.0683 11.6667H16.3742L10.0003 18.3333L3.62649 11.6667H5.93231L10.0003 15.9216L14.0683 11.6667ZM7.50032 4.80328L5.31782 9.16668H1.667V10.8333H6.34868L7.50032 8.53L10.0003 13.53L11.3486 10.8333H18.3336V9.16668H12.182L11.2503 7.30328L10.0003 9.8025L7.50032 4.80328Z" fill="#F9B233" /></svg>
                                <span>{t('home.content.heart_rate')}</span>
                            </div>
                            <div className="flex flex-row flex-wrap justify-center items-center gap-x-2">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M16.9244 3.97402C18.0593 5.16105 18.5087 6.79351 18.2727 8.33332H16.577C16.8315 7.21758 16.5458 5.98976 15.7197 5.12578C14.4971 3.84699 12.5472 3.84699 11.3246 5.12578L10.0003 6.5109L8.67603 5.12574C7.45341 3.84695 5.50353 3.84695 4.28091 5.12574C3.45485 5.98976 3.16907 7.21758 3.42357 8.33332H1.72794C1.49192 6.79351 1.94138 5.16101 3.07622 3.97398C4.81962 2.15054 7.56806 2.0189 9.45649 3.57918C9.60547 3.7024 9.74712 3.83423 9.88071 3.97398L10.0003 4.0991L10.1199 3.97402C10.2555 3.83219 10.3972 3.70058 10.5441 3.57918C12.4326 2.0189 15.181 2.15051 16.9244 3.97402ZM14.0683 11.6667H16.3742L10.0003 18.3333L3.62649 11.6667H5.93231L10.0003 15.9216L14.0683 11.6667ZM7.50032 4.80328L5.31782 9.16668H1.667V10.8333H6.34868L7.50032 8.53L10.0003 13.53L11.3486 10.8333H18.3336V9.16668H12.182L11.2503 7.30328L10.0003 9.8025L7.50032 4.80328Z" fill="#F9B233" /></svg>
                                <span>{t('home.content.temperature')}</span>
                            </div>
                        </div>

                        <div className="flex flex-row flex-wrap justify-start gap-x-28 items-start mt-8 gap-y-6">
                            <div className="flex flex-row justify-center items-center gap-x-2">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.6663 8.33341C16.6663 12.4942 12.0505 16.8276 10.5005 18.1659C10.3561 18.2745 10.1803 18.3332 9.99967 18.3332C9.81901 18.3332 9.64324 18.2745 9.49884 18.1659C7.94884 16.8276 3.33301 12.4942 3.33301 8.33341C3.33301 6.5653 4.03539 4.86961 5.28563 3.61937C6.53587 2.36913 8.23156 1.66675 9.99967 1.66675C11.7678 1.66675 13.4635 2.36913 14.7137 3.61937C15.964 4.86961 16.6663 6.5653 16.6663 8.33341Z" stroke="#F9B233" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M10 10.8335C11.3807 10.8335 12.5 9.71421 12.5 8.3335C12.5 6.95278 11.3807 5.8335 10 5.8335C8.61929 5.8335 7.5 6.95278 7.5 8.3335C7.5 9.71421 8.61929 10.8335 10 10.8335Z" stroke="#F9B233" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                <span>{t('home.content.geolocation')}</span>
                            </div>
                            <div className="flex flex-row justify-center items-center gap-x-2">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.9879 7.34367L15.7191 7.61242C15.2601 8.0718 15.0017 8.69426 15.0004 9.34367V9.99992C15.0004 10.5187 15.4191 10.9374 15.9379 10.9374C16.4566 10.9374 16.8754 10.5187 16.8754 9.99992V7.71242C16.8754 7.24992 16.3129 7.01867 15.9879 7.34367Z" fill="#F9B233" /></svg>
                                <span>{t('home.content.activity')}</span>
                            </div>
                        </div>

                        <div className="mt-10">
                            <button onClick={() => navigate('/commande')} className="bg-[#178A3B] text-white px-8 py-2 rounded-md">{t('home.content.order_btn')}</button>
                        </div>
                    </div>
                </div>
            </section>
        </AnimatedOnScroll>


           <AnimatedOnScroll>
    <section id="app" className="max-w-6xl mx-auto px-6 mt-12 mb-20">
        <div className="relative p-6 flex flex-col items-center text-center">
            <h3 className="text-2xl font-extrabold text-green-700 relative z-10">Mokine App</h3>
            <p className="mt-4 text-gray-600 max-w-2xl relative z-10">{t('home.content.app_desc')}</p>

            <div className="mt-8 w-full flex flex-col md:flex-row items-center justify-center gap-6 relative z-10">
                <div className="md:w-1/3 flex flex-col gap-4 items-center md:items-end md:pr-12 md:mt-12">
                    <div className="bg-green-100 rounded-lg p-4 w-full max-w-xs animate-pulse">
                        <p className="font-semibold">{t('home.content.app_feat1')}</p>
                    </div>
                    <div className="bg-green-100 rounded-lg p-4 w-full max-w-xs animate-bounce">
                        <p className="font-semibold">{t('home.content.app_feat2')}</p>
                    </div>
                </div>
                <div className="md:w-1/2 flex-shrink-0 md:mt-8 md:mb-8">
                    <img src={appv} alt="Mokine App" className="rounded-xl w-full scale-[1.6] max-w-md mx-auto" />
                </div>
                <div className="md:w-1/3 flex flex-col gap-4 items-center md:items-start md:pl-12">
                    <div className="bg-green-100 rounded-lg p-4 w-full max-w-xs animate-pulse">
                        <p className="font-semibold">{t('home.content.app_feat3')}</p>
                    </div>
                    <div className="bg-green-100 rounded-lg p-4 w-full max-w-xs animate-bounce">
                        <p className="font-semibold">{t('home.content.app_feat4')}</p>
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
        <p className="mt-4 text-gray-600">{t('home.content.ia_desc1')}</p>
        <p className="mt-6 text-gray-600">{t('home.content.ia_desc2')}</p>
        <div className="mt-6">
          <button onClick={() => navigate("/mokinelab")} className="bg-[#178A3B] text-white px-4 py-2 rounded-md">
            {t('home.content.discover_lab')}
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
                        <h3 className="font-bold text-3xl lg:text-4xl text-gray-800 leading-tight">{t('home.content.demo_title')}</h3>
                        <div className="space-y-4 text-gray-600 text-lg">
                            <p>{t('home.content.demo_p1')}</p>
                            <p>{t('home.content.demo_p2')}</p>
                        </div>
                        <div className="pt-4">
                            <button onClick={() => navigate('/commande')} className="bg-[#178A3B] hover:bg-[#147932] text-white px-6 py-3 rounded-lg font-semibold transition duration-300 shadow-md hover:shadow-lg">
                                {t('home.content.order_now')}
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Section vidéo */}
                <div className="lg:w-1/2 bg-black flex items-center justify-center min-h-[300px] lg:min-h-[400px]">
                    <div className="relative w-full h-full">
                        <video 
                            src={VIDEO_SRC} 
                            controls 
                            className="w-full h-full object-cover" 
                            poster="/path/to/video-thumbnail.jpg" // Optionnel: ajouter une image de preview
                        >
                            Votre navigateur ne supporte pas la lecture vidéo.
                        </video>
                        
                        {/* Overlay décoratif */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</AnimatedOnScroll>

            <AnimatedOnScroll>
                <section id="why" className="max-w-6xl mx-auto px-6 mt-24">
                    <h3 className="text-2xl font-extrabold text-center text-green-700 text-3xl">{t('home.content.why_title')}</h3>
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {(t('home.content.why') || []).map((c, i) => {
                            const icons = [<Clock />, <BellRing />, <Brain />, <FileText />, <MessageSquare />, <BarChart />];
                            return { ...c, icon: icons[i] || null };
                        }).map((c, i) => (
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
                    <h3 className="text-center text-4xl font-extrabold text-green-700">{t('home.content.steps_title')}</h3>
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
                            <h4 className="font-bold">{t('home.contact.title')}</h4>
                            <p className="mt-3 text-sm">{t('home.contact.address_label')}: {settings.business_address}</p>
                            <p className="text-sm mt-2">{t('home.contact.phone_label')}: {settings.business_phone}</p>
                            <p className="text-sm mt-2">{t('home.contact.email_label')}: {settings.business_email}</p>
                        </div>
                        <div className="md:col-span-2">
                            <h4 className="font-bold">{t('home.contact.form_title')}</h4>
                            <form onSubmit={handleContactSubmit} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input className="border rounded p-3" placeholder={t('home.contact.name')} value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} required />
                                <input className="border rounded p-3" placeholder={t('home.contact.email')} type="email" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} required />
                                <input className="border rounded p-3 md:col-span-2" placeholder={t('home.contact.subject')} value={contactForm.subject} onChange={e => setContactForm(f => ({ ...f, subject: e.target.value }))} />
                                <textarea className="border rounded p-3 md:col-span-2" placeholder={t('home.contact.message')} rows={5} value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} required />
                                {contactStatus === 'success' && <p className="md:col-span-2 text-green-600 text-sm">{t('home.contact.success')}</p>}
                                {contactStatus === 'error' && <p className="md:col-span-2 text-red-500 text-sm">{t('home.contact.error')}</p>}
                                <button type="submit" disabled={contactStatus === 'loading'} className="bg-[#178A3B] text-white px-4 py-3 rounded-md md:col-span-2 disabled:opacity-60">
                                    {contactStatus === 'loading' ? t('home.contact.sending') : t('home.contact.send')}
                                </button>
                            </form>
                        </div>
                    </div>
                </section>
            </AnimatedOnScroll>
        </>
    );
}

function FAQ() {
    const { t } = useI18n();
    const items = t('home.content.faq') || [];
    return (
        <AnimatedOnScroll>
            <section id="faq" className="max-w-6xl mx-auto px-6 mt-20 mb-20">
                <h3 className="text-center text-3xl font-extrabold text-green-700">{t('home.content.faq_title')}</h3>
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
                <ContentSections />
            </main>
             <GrayStrip />
            <Footer />
        </div>
    );
}