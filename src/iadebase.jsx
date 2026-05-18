import React, { useState, useEffect, useRef } from "react";
import { Plus, Send, Mic, User, Menu, Loader2, Syringe, HeartPulse, Clipboard, Telescope, Scan } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import logo from '../assets/logo-removebg-preview.png'
import { useNavigate, useParams } from "react-router-dom";
import { Footprints, Mouth, Dermis } from 'lucide-react';

export function Ia() {
  const navigate = useNavigate();

  const [selectedChat, setSelectedChat] = useState(null);
  const [input, setInput] = useState("");
  const [showModels, setShowModels] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [fileToSend, setFileToSend] = useState(null);
  const [loadersend, setLoadersend] = useState(false);
  const [showScrollDownButton, setShowScrollDownButton] = useState(false);
  const [maladie, setMaladie] = useState(null);

  const queryClient = useQueryClient();
  const chatContainerRef = useRef(null);
  const bottomRef = useRef(null);
  const token = "16|lTVdq3XlTdF6roHWQnebtoOMjLfWXMMzO5RTt0vk30b68007";

  // 🔹 Récupération discussions
  const { data: discussions, isLoading: isDiscussionsLoading } = useQuery({
    queryKey: ["discussions"],
    queryFn: async () => {
      const res = await axios.get(`http://18.130.243.234/api/ia/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res?.data;
    },
  });

  // 🔹 Récupération messages
  const { data: messages, isLoading: isMessagesLoading } = useQuery({
    queryKey: ["messages", selectedChat],
    queryFn: async () => {
      if (!selectedChat) return [];
      const res = await axios.get(`http://18.130.243.234/api/ia/request/${selectedChat}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res?.data;
    },
    enabled: !!selectedChat,
  });

  // 🔹 Envoi message
  const mutation = useMutation({
    mutationFn: async (formData) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const res = await axios.post("http://18.130.243.234/api/ia/request/send", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: (data) => {
      setLoadersend(false);
      if (data?.discussion_id) setSelectedChat(data.discussion_id);
      queryClient.invalidateQueries(["messages", data.discussion_id]);
      queryClient.invalidateQueries(["discussions"]);
      setInput("");
      setPreviewImage(null);
      setFileToSend(null);
      setMaladie(null);
    },
    onError: (error) => {
      setLoadersend(false);
      console.error("Erreur de mutation :", error.response ? error.response.data : error.message);
    },
  });

  // 🔹 Upload fichier
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileToSend(file);
    setPreviewImage(URL.createObjectURL(file));
    setShowModels(false);
  };

  // 🔹 Envoi
  const handleSend = () => {
    if (mutation.isLoading) return;
    if (!input.trim() && !fileToSend) return;

    setLoadersend(true);
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
  };

  const plan=useParams().plan;
  

  const user = { name: "Dr. Aboubakar", mode: plan };
  const showSendButton = input.trim() || fileToSend;

  // 🔹 Effets de scroll
  useEffect(() => {
    if (loadersend) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loadersend]);

  useEffect(() => {
    if (!loadersend) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [selectedChat, messages]);

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

  // 🔹 Rendu principal
  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* Navbar mobile */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b shadow-md z-40 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-full hover:bg-gray-100" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={24} />
          </button>
          <img src={logo} className="w-20 h-8" style={{aspectRatio: '1080 / 423', objectFit: 'cover'}} />
          <h1 className="font-bold text-lg relative right-2">MOKINE IA</h1>
        </div>
      </nav>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out z-40 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 lg:flex lg:flex-col`}>
        <div onClick={()=>navigate('/')} className="p-4 border-b flex items-center space-x-2">
          <img src={logo} className="w-20 h-8" style={{aspectRatio: '1080 / 423', objectFit: 'cover'}} />
          <h1 className="font-bold text-lg relative right-4">MOKINE IA</h1>
        </div>
        <button onClick={() => { setSelectedChat(null); setSidebarOpen(false); }} className="flex items-center p-3 space-x-2 hover:bg-gray-100 border-b">
          <Plus size={18} />
          <span>Nouveau chat</span>
        </button>
        <div className="flex-1 overflow-y-auto">
          {isDiscussionsLoading ? (
            <div className="p-3 text-center text-gray-500">Chargement de l'historique...</div>
          ) : (
            discussions?.data?.map((discussion) => (
              <button key={discussion.id} onClick={() => { setSelectedChat(discussion.id); setSidebarOpen(false); }} className={`w-full text-left p-3 hover:bg-gray-100 ${selectedChat === discussion.id ? "bg-gray-200 font-semibold" : ""}`}>
                {discussion.date}
              </button>
            ))
          )}
        </div>
        {/* Nouveau bloc : Bouton de mise à niveau */}
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
        {/* Fin du nouveau bloc */}
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
          {isMessagesLoading ? (
            <p className="text-center text-gray-500">Chargement...</p>
          ) : !messages || !messages?.data || messages?.data.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">Que puis-je faire pour vous ?</div>
          ) : (
            messages?.data?.map((msg, idx) => {
              let iaResponse = msg?.contenu?.message;
              if (iaResponse && typeof iaResponse === "string") {
                try { iaResponse = JSON.parse(iaResponse); } catch { iaResponse = null; }
              }
              let textEntries = [];
              if (iaResponse?.result?.text) {
                const t = iaResponse.result.text;
                textEntries = typeof t === "string" ? [] : Object.entries(t);
              }
              const details = iaResponse?.details || iaResponse?.result || {};

              return (
                <div key={idx} className={`flex ${msg.appartenance === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.appartenance === "user" ? (
                    msg.typeContenu === "fichier" ? (
                      <img src={`http://18.130.243.234/storage/${msg?.contenu?.lien}`} alt="upload" className="max-w-[200px] rounded-lg shadow"/>
                    ) : (
                      <div className="px-4 py-2 rounded-2xl max-w-md bg-green-500 text-white">{msg.contenu?.message}</div>
                    )
                  ) : (
                    <div className="bg-white border rounded-lg shadow p-4 space-y-4 max-w-lg">
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
                  <div ref={bottomRef} />
                </div>
              );
            })
          )}

          {loadersend && (
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader2 size={20} className="animate-spin" />
              <span>Un instant...</span>
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

        {/* Input + menu */}
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
                    { label: "Bouche", value: "bouche", icon:'' },
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
              className="flex-1 px-2 py-1 focus:outline-none"
            />

            <button
              className="rounded-full hover:bg-gray-200"
              onClick={handleSend}
              disabled={mutation.isLoading || (!input.trim() && !fileToSend)}
            >
              {loadersend ? <Loader2 size={20} className="animate-spin text-green-600"/> : showSendButton ? <Send size={20} className="text-green-600"/> : <Mic size={20} className="text-gray-500"/>}
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