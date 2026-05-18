import React, { useState, useEffect, useRef } from "react";
import { Plus, Send, Mic, User, Menu, Loader2, Syringe, HeartPulse, Clipboard, Telescope, Scan } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import logo from '../assets/logo-removebg-preview.png'
import { useNavigate, useParams } from "react-router-dom";
import { Footprints, Mouth, Dermis } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

export function Ia() {
  const navigate = useNavigate();

  // 1. État pour la conversation en cours (gestion locale pour la démo Gemini)
  const [currentChatMessages, setCurrentChatMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [input, setInput] = useState("");
  const [showModels, setShowModels] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [fileToSend, setFileToSend] = useState(null);
  // Renommé le loader général pour plus de clarté
  const [isSendingToBackend, setIsSendingToBackend] = useState(false);
  // Nouveau loader pour la réponse Gemini
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [showScrollDownButton, setShowScrollDownButton] = useState(false);
  const [maladie, setMaladie] = useState(null);

  const queryClient = useQueryClient();
  const chatContainerRef = useRef(null);
  const bottomRef = useRef(null);
  const token = "16|lTVdq3XlTdF6roHWQnebtoOMjLfWXMMzO5RTt0vk30b68007"; // A sécuriser en production

  // 2. Initialisation de l'IA de Google (Clé à sécuriser en production)
  // ATTENTION: Remplacez par votre vraie clé
  const ai = new GoogleGenAI({ apiKey: "AIzaSyBIBNdJ9QQ5vpC8F_Vu4cxiJQDA7m0faU4" });

  // 3. Fonction pour appeler Gemini (MISE À JOUR pour demander du JSON)
  const sendMessageToGemini = async (message) => {
    // Message de l'utilisateur ajouté immédiatement
    const userMessage = {
      appartenance: "user",
      typeContenu: "texte",
      contenu: { message: message },
      id: Date.now() + Math.random(), 
    };
    setCurrentChatMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsGeminiLoading(true);

    // Prompt pour forcer la structure JSON
    const systemInstruction = `
      Vous êtes une intelligence artificielle de pré-diagnostic.
      Analysez la requête de l'utilisateur (qui est un symptôme ou une question médicale générale, hors image) et fournissez une réponse structurée en JSON.
      Le format JSON DOIT être le suivant:
      {
        "titre": "Un titre accrocheur pour le pré-diagnostic (Ex: Pré-diagnostic : Carence, Parasites ou Douleur)",
        "conclusion": "Une phrase finale cruciale (Ex: Il est crucial de consulter un vétérinaire rapidement...)",
        "causes": [
          {"symptome": "Cause 1", "description": "Description concise de la cause 1."},
          {"symptome": "Cause 2", "description": "Description concise de la cause 2."},
          {"symptome": "Cause 3", "description": "Description concise de la cause 3."}
        ]
      }
      Vous ne devez retourner QUE le JSON.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", 
        contents: message,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json", // Demande un retour en JSON
        },
      });

      // La réponse.text est maintenant le JSON structuré
      const aiResponseJson = JSON.parse(response.text);

      // Ajouter la réponse structurée de l'IA à l'état local
      const aiMessage = {
        appartenance: "ai",
        typeContenu: "struct_text", // Nouveau type pour différencier les réponses structurées
        contenu: { message: aiResponseJson }, 
        id: Date.now() + Math.random() + 1,
      };
      setCurrentChatMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("Erreur Gemini :", error);
      const errorMessage = {
        appartenance: "ai",
        typeContenu: "texte",
        contenu: { message: "❌ Erreur de connexion avec l'IA ou format de réponse incorrect." },
        id: Date.now() + Math.random() + 1,
      };
      setCurrentChatMessages(prev => [...prev, errorMessage]);

    } finally {
      setIsGeminiLoading(false);
    }
  };


  // 🔹 Récupération discussions (Inchangement)
  const { data: discussions, isLoading: isDiscussionsLoading } = useQuery({
    queryKey: ["discussions"],
    queryFn: async () => {
      const res = await axios.get(`http://18.130.243.234/api/ia/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res?.data;
    },
  });

  // 🔹 Récupération messages (Léger changement : utilise l'état local si pas de chat sélectionné)
  const { data: messagesFromApi, isLoading: isMessagesLoading } = useQuery({
    queryKey: ["messages", selectedChat],
    queryFn: async () => {
      if (!selectedChat) return { data: [] }; // Retourne un objet vide pour ne pas casser la structure
      const res = await axios.get(`http://18.130.243.234/api/ia/request/${selectedChat}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res?.data;
    },
    enabled: !!selectedChat,
  });

  // Affiche les messages de l'API s'il y a un chat sélectionné, sinon affiche les messages locaux
  const messagesToDisplay = selectedChat ? (messagesFromApi?.data || []) : currentChatMessages;


  // 🔹 Envoi message vers le backend (Inchangement)
  const mutation = useMutation({
    mutationFn: async (formData) => {
      const res = await axios.post("http://18.130.243.234/api/ia/request/send", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: (data) => {
      setIsSendingToBackend(false);
      if (data?.discussion_id) setSelectedChat(data.discussion_id);
      queryClient.invalidateQueries(["messages", data.discussion_id]);
      queryClient.invalidateQueries(["discussions"]);
      setInput("");
      setPreviewImage(null);
      setFileToSend(null);
      setMaladie(null);
    },
    onError: (error) => {
      setIsSendingToBackend(false);
      console.error("Erreur de mutation :", error.response ? error.response.data : error.message);
    },
  });

  // 🔹 Upload fichier (Inchangement)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileToSend(file);
    setPreviewImage(URL.createObjectURL(file));
    setShowModels(false);
  };

  // 🔹 Envoi (Logique inchangée)
  const handleSend = () => {
    if (mutation.isLoading || isSendingToBackend || isGeminiLoading) return;
    if (!input.trim() && !fileToSend) return;

    if (fileToSend || maladie) {
      setIsSendingToBackend(true);
      const formData = new FormData();
      if (fileToSend) {
        formData.append("file", fileToSend);
        formData.append("typeContenu", "fichier");
      } else if (input.trim()) {
        formData.append("message", input);
        formData.append("typeContenu", "texte");
      }

      if (selectedChat) formData.append("listediscussioniaid", selectedChat);
      if (maladie) formData.append("maladie", maladie);

      mutation.mutate(formData);
      return; 
    }

    if (input.trim()) {
      sendMessageToGemini(input.trim());
    }
  };
  
  const plan=useParams().plan;
  const user = { name: "Dr. Aboubakar", mode: plan };
  const showSendButton = input.trim() || fileToSend;

  // 🔹 Effets de scroll
  useEffect(() => {
    if (isSendingToBackend || isGeminiLoading) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [isSendingToBackend, isGeminiLoading]);

  useEffect(() => {
    if (!isSendingToBackend && !isGeminiLoading) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messagesToDisplay]); 

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [selectedChat, messagesToDisplay]); 

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      setShowScrollDownButton(container.scrollTop < container.scrollHeight - container.clientHeight - 100);
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  useEffect(() => { scrollToBottom() }, []);


  // 🔹 Fonction pour gérer le changement de chat
  const handleSelectChat = (id) => {
    setSelectedChat(id);
    setCurrentChatMessages([]); 
    setSidebarOpen(false);
  }

  // 🔹 Fonction pour le nouveau chat
  const handleNewChat = () => {
    setSelectedChat(null); 
    setCurrentChatMessages([]); 
    setSidebarOpen(false);
  }

  // 🔹 Rendu principal
  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* Navbar mobile (Inchangement) */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b shadow-md z-40 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-full hover:bg-gray-100" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={24} />
          </button>
          <img src={logo} className="w-20 h-8" style={{aspectRatio: '1080 / 423', objectFit: 'cover'}} />
          <h1 className="font-bold text-lg relative right-2">MOKINE IA</h1>
        </div>
      </nav>

      {/* Sidebar (Inchangement) */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out z-40 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 lg:flex lg:flex-col`}>
        <div onClick={()=>navigate('/')} className="p-4 border-b flex items-center space-x-2">
          <img src={logo} className="w-20 h-8" style={{aspectRatio: '1080 / 423', objectFit: 'cover'}} />
          <h1 className="font-bold text-lg relative right-4">MOKINE IA</h1>
        </div>
        <button onClick={handleNewChat} className="flex items-center p-3 space-x-2 hover:bg-gray-100 border-b">
          <Plus size={18} />
          <span>Nouveau chat</span>
        </button>
        <div className="flex-1 overflow-y-auto">
          {isDiscussionsLoading ? (
            <div className="p-3 text-center text-gray-500">Chargement de l'historique...</div>
          ) : (
            discussions?.data?.map((discussion) => (
              <button key={discussion.id} onClick={() => handleSelectChat(discussion.id)} className={`w-full text-left p-3 hover:bg-gray-100 ${selectedChat === discussion.id ? "bg-gray-200 font-semibold" : ""}`}>
                {discussion.date}
              </button>
            ))
          )}
        </div>
        {user.mode === "gratuit" && (
          <div className="p-4 border-t">
            <button
              onClick={() => { navigate('/abonnement') }}
              className="w-full bg-green-700 text-white font-bold py-2 px-4 rounded-full hover:bg-green-600 transition-colors"
            >
              Mettre à niveau
            </button>
          </div>
        )}
        <div className="p-4 border-t flex items-center space-x-2">
          <User size={28} className="text-gray-500" />
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-gray-500">{user.mode}</p>
          </div>
        </div>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Zone chat */}
      <div className="flex-1 flex flex-col relative">
        <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-4 lg:mt-0 mt-16">
          {(isMessagesLoading && selectedChat) ? ( 
            <p className="text-center text-gray-500">Chargement...</p>
          ) : !messagesToDisplay || messagesToDisplay.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">Que puis-je faire pour vous ?</div>
          ) : (
            messagesToDisplay.map((msg, idx) => {
              const isUser = msg.appartenance === "user";
              
              let iaResponse = msg?.contenu?.message;
              const isStructuredGeminiResponse = msg.typeContenu === "struct_text" && !selectedChat;
              
              if (!isUser && !isStructuredGeminiResponse && iaResponse && typeof iaResponse === "string" && selectedChat) {
                try { iaResponse = JSON.parse(iaResponse); } catch { iaResponse = null; }
              } else if (isStructuredGeminiResponse) {
                iaResponse = msg?.contenu?.message; // Le contenu est déjà l'objet JSON
              }

              const details = iaResponse?.details || iaResponse?.result || {};
              let textEntries = [];
              if (iaResponse?.result?.text) {
                const t = iaResponse.result.text;
                textEntries = typeof t === "string" ? [] : Object.entries(t);
              }
              
              return (
                <div key={msg.id || idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  {isUser ? (
                    // Style Utilisateur : à droite, texte noir, background vert
                    msg.typeContenu === "fichier" ? (
                      <img 
                        src={selectedChat ? `http://18.130.243.234/storage/${msg?.contenu?.lien}` : previewImage} 
                        alt="upload" 
                        className="max-w-[200px] rounded-lg shadow border border-green-500"
                      />
                    ) : (
                      <div className="px-4 py-2 rounded-2xl max-w-md bg-green-500 text-black shadow-md">
                        {msg.contenu?.message}
                      </div>
                    )
                  ) : (
                    // Style IA : à gauche, texte noir, background gris
                    <div className="max-w-lg">
                      
                      {/* 8. NOUVEAU RENDU pour la réponse structurée Gemini (typeContenu: "struct_text") */}
                      {isStructuredGeminiResponse ? (
                         <div className="bg-gray-100 border rounded-lg shadow p-4 space-y-3 max-w-lg">
                            {iaResponse.titre && <h3 className="font-bold text-lg text-green-700">{iaResponse.titre}</h3>}
                            
                            {iaResponse.causes && (
                              <div className="space-y-2">
                                <p className="font-semibold text-gray-800">Causes les plus probables :</p>
                                {iaResponse.causes.map((cause, i) => (
                                  <div key={i} className="flex items-start space-x-2 p-2 bg-white rounded-md shadow-sm border border-gray-200">
                                    <input type="checkbox" checked className="mt-1.5 h-4 w-4 bg-green-700 text-green-600 border-gray-300 rounded focus:ring-green-500"/>
                                    <p className="text-sm text-gray-700">
                                      {/* Mise en gras demandée par l'utilisateur */}
                                      <strong>{cause.symptome} :</strong> {cause.description}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {iaResponse.conclusion && (
                              <p className="text-sm text-red-600 font-semibold pt-2 border-t mt-3">
                                {iaResponse.conclusion}
                              </p>
                            )}
                        </div>
                      ) : (
                        // Rendu existant pour les réponses de l'API backend
                        <div className="bg-white border rounded-lg shadow p-4 space-y-4">
                            {/* Rendu des modèles pieds, peau, bouche, etc. */}
                            {/* ... (votre code de rendu pour les autres modèles reste ici) ... */}

                             {/* Affichage du texte si c'est une réponse simple de l'API sans modèle */}
                            {msg.typeContenu === "texte" && !iaResponse?.modele && (
                                <div className="px-4 py-2 rounded-2xl bg-gray-200 text-black shadow-md">
                                    {msg.contenu?.message}
                                </div>
                            )}

                            {/* Modèle "pieds" */}
                            {iaResponse?.modele === "pieds" && (
                            <>
                                {iaResponse?.result?.title && <h3 className="font-bold text-red-600">{iaResponse.result.title}</h3>}
                                {iaResponse?.result?.confidence && <span className="inline-block bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full w-fit">{iaResponse.result.confidence}</span>}
                                {textEntries.length > 0 && textEntries.map(([label, value]) => (
                                <div key={label} className="flex items-start space-x-2">
                                    <input type="checkbox" className="mt-1"/>
                                    <p><strong>{label} :</strong> {value}</p>
                                </div>
                                ))}
                            </>
                            )}

                            {/* Modèle "peau" */}
                            {iaResponse?.modele === "peau" && (
                                <>
                                <h3 className={`font-bold flex items-center gap-2 ${iaResponse?.explanation?.message?.includes("bon état") ? "text-green-600" : "text-red-600"}`}>
                                    <Syringe size={20} />
                                    {iaResponse?.explanation?.message}
                                </h3>
                                {iaResponse?.explanation?.reassurance && (
                                    <span className="inline-block bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1 rounded-full w-fit">
                                    {iaResponse?.explanation?.reassurance}
                                    </span>
                                )}
                                <ul className="space-y-2 mt-2">
                                    {iaResponse?.explanation?.care_tips && (
                                    <li className="flex items-start space-x-2">
                                        <input type="checkbox" className="mt-1" />
                                        <p className="text-gray-700">
                                        <strong>Conseils :</strong> {iaResponse?.explanation?.care_tips}
                                        </p>
                                    </li>
                                    )}
                                </ul>
                                {iaResponse.confidence_percent && (
                                    <span className="inline-block bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full w-fit">
                                    Confiance : {iaResponse?.confidence_percent}%
                                    </span>
                                )}
                                </>
                            )}

                            {/* Modèle "bouche" */}
                            {iaResponse?.modele === "bouche" && (
                                <>
                                {details.diagnostic && <h3 className="font-bold text-red-600">{details.diagnostic}</h3>}
                                {details.causes && (
                                    <>
                                    <p><strong>Causes :</strong></p>
                                    <ul className="list-disc list-inside">{details.causes.map((c,i) => <li key={i}>{c}</li>)}</ul>
                                    </>
                                )}
                                {details.conseils && <p className="italic">Conseils : {details.conseils}</p>}
                                {details.prevention && (
                                    <>
                                    <p><strong>Prévention :</strong></p>
                                    <ul className="list-disc list-inside">{details.prevention.map((p,i) => <li key={i}>{p}</li>)}</ul>
                                    </>
                                )}
                                {details.confidence && <span className="inline-block bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full w-fit">Confiance : {details.confidence}%</span>}
                                </>
                            )}
                        </div>
                      )}
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              );
            })
          )}

          {/* 9. Affichage du Loader */}
          {(isSendingToBackend || isGeminiLoading) && (
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader2 size={20} className="animate-spin" />
              <span>{isGeminiLoading ? "Gemini réfléchit..." : "Un instant..."}</span>
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {showScrollDownButton && (
          <button onClick={scrollToBottom} className="absolute right-4 bottom-24 p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-500 z-50">⬇</button>
        )}

        {previewImage && (
          <div className="p-2 flex justify-end">
            <img src={previewImage} alt="preview" className="max-w-[150px] rounded-lg shadow"/>
          </div>
        )}

        {/* Input + menu (Inchangement) */}
        <div className="p-4 border-t bg-white">
          <div className="flex items-center space-x-2 border rounded-full px-3 py-2">
            <div className="relative">
              <button onClick={() => setShowModels(!showModels)} className="p-2 rounded-full hover:bg-gray-100">
                <Plus size={20} />
              </button>

              {showModels && (
                <div className="absolute bottom-12 left-0 bg-white border shadow-lg rounded-lg w-56 p-3 z-50 space-y-3">
                  <p className="font-semibold text-sm mb-2">Choisir un modèle</p>
                  {[
                    { label: "Pieds", value: "pieds", icon: '' },
                    { label: "Peau", value: "peau", icon: '' },
                    { label: "Bouche", value: "bouche", icon: '' },
                  ].map((model) => (
                    <label key={model.value} className="flex items-center space-x-2 cursor-pointer text-sm p-2 hover:bg-gray-100 rounded">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          handleFileChange(e);
                          setMaladie(model.value);
                        }}
                      />
                      <span className="flex flex-row justify-center items-center gap-x-1">{model.icon} {model.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <input
              type="text"
              placeholder="Écrire un message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 px-2 py-1 focus:outline-none"
              disabled={isSendingToBackend || isGeminiLoading}
            />

            <button
              className="rounded-full hover:bg-gray-200"
              onClick={handleSend}
              disabled={isSendingToBackend || isGeminiLoading || (!input.trim() && !fileToSend)}
            >
              {(isSendingToBackend || isGeminiLoading) ? (
                <Loader2 size={20} className="animate-spin text-green-600"/> 
              ) : showSendButton ? (
                <Send size={20} className="text-green-600"/>
              ) : (
                <Mic size={20} className="text-gray-500"/>
              )}
            </button>
          </div>

            <p className="text-center text-xs text-gray-500 mt-2">
              MOKINE IA peut faire des erreurs. Envisagez de vérifier les informations importantes chez un professionnel de santé agréé.
            </p>

        </div>
      </div>
    </div>
  );
}