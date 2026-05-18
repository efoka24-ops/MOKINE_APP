import "../App.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MeetingProvider,
  MeetingConsumer,
  useMeeting,
  useParticipant,
} from "@videosdk.live/react-sdk";
import { authToken, createMeeting } from "../API";

// Icônes
import sortir from "../icones/images/logout.png";
import micro from "../icones/images/micro.png";
import camera from "../icones/images/camera.png";
import docta from "../assets/images/user.png";

// Composant vidéo d’un participant
// ParticipantView
function ParticipantView({ participantId, isLocal }) {
  const micRef = useRef(null);
  const videoRef = useRef(null);
  const { webcamStream, micStream, webcamOn, micOn, isLocal: localFlag } =
    useParticipant(participantId);

  const videoStream = useMemo(() => {
    if (webcamOn && webcamStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      return mediaStream;
    }
    return null;
  }, [webcamStream, webcamOn]);

  useEffect(() => {
    if (micRef.current) {
      if (micOn && micStream) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(micStream.track);
        micRef.current.srcObject = mediaStream;
        micRef.current.play().catch((err) => console.error("Erreur audio", err));
      } else {
        micRef.current.srcObject = null;
      }
    }
  }, [micStream, micOn]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = videoStream || null;
      if (webcamOn && videoStream) {
        videoRef.current.play().catch((err) => console.error("Erreur vidéo", err));
      }
    }
  }, [videoStream, webcamOn]);

  return (
    <div
      className={
        isLocal
          ? "relative w-full h-full"
          : "relative w-full h-full"
      }
    >
      <audio ref={micRef} autoPlay muted={isLocal} />
      {webcamOn && videoStream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-700 via-slate-800 to-black text-white">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm shadow-2xl">
            <img src={docta} alt="avatar" className="h-14 w-14 rounded-full" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold">{isLocal ? "Votre caméra" : "Caméra du vétérinaire"}</p>
            <p className="text-xs text-white/70">{webcamOn ? "Flux en cours" : "Caméra coupée"}</p>
          </div>
        </div>
      )}

      <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur">
        {isLocal ? "Vous" : "Vétérinaire"}
      </div>
    </div>
  );
}

// MeetingView
function MeetingView({ meetingId, onMeetingLeave }) {
  const { join, participants, localParticipant } = useMeeting({
    onMeetingJoined: () => console.log("Réunion rejointe"),
    onMeetingLeft: onMeetingLeave,
  });

  const [joined, setJoined] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [mediaPermissions, setMediaPermissions] = useState({
    camera: "unknown",
    microphone: "unknown",
  });
  const [localMediaState, setLocalMediaState] = useState({
    micOn: true,
    webcamOn: true,
  });
  const [recordingState, setRecordingState] = useState({
    isRecording: false,
    message: "",
  });
  const mediaRecorderRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const recordedChunksRef = useRef([]);

  useEffect(() => {
    if (!joined) {
      join();
      setJoined(true);
    }
  }, [join, joined]);

  useEffect(() => {
    let cancelled = false;

    const checkPermissions = async () => {
      if (!navigator.permissions?.query) return;

      try {
        const [cameraPermission, microphonePermission] = await Promise.all([
          navigator.permissions.query({ name: "camera" }),
          navigator.permissions.query({ name: "microphone" }),
        ]);

        if (!cancelled) {
          setMediaPermissions({
            camera: cameraPermission.state,
            microphone: microphonePermission.state,
          });
        }
      } catch (error) {
        console.warn("Impossible de lire les permissions média", error);
      }
    };

    checkPermissions();

    return () => {
      cancelled = true;
    };
  }, []);

  // Récupérer ID du local
  const localId = localParticipant?.id;

  // Trouver l'autre (le premier qui n’est pas local)
  const remoteId = [...participants.keys()].find((id) => id !== localId);

  const stopLocalRecording = async () => {
    const recorder = mediaRecorderRef.current;
    const stream = recordingStreamRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
    }
  };

  const startLocalRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        setRecordingState({ isRecording: false, message: "L'enregistrement local n'est pas supporté par ce navigateur." });
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      recordedChunksRef.current = [];
      recordingStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const safeMeetingId = meetingId || "teleconsultation";
        link.href = url;
        link.download = `teleconsultation-${safeMeetingId}.webm`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        recordedChunksRef.current = [];
        mediaRecorderRef.current = null;
        setRecordingState({ isRecording: false, message: "Enregistrement téléchargé sur l'appareil." });
      };

      recorder.start();
      setRecordingState({ isRecording: true, message: "Enregistrement local en cours..." });

      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (mediaRecorderRef.current?.state === "recording") {
          stopLocalRecording();
        }
      });
    } catch (error) {
      console.error("Erreur d'enregistrement local", error);
      setRecordingState({ isRecording: false, message: "Impossible de démarrer l'enregistrement local." });
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full overflow-y-auto bg-[radial-gradient(circle_at_top,_#1f2937_0%,_#111827_45%,_#050816_100%)] text-white">
      {(mediaPermissions.camera === "denied" || mediaPermissions.microphone === "denied") && (
        <div className="absolute left-1/2 top-4 z-50 w-[min(92vw,900px)] -translate-x-1/2 rounded-2xl border border-amber-300/40 bg-amber-100/95 px-4 py-3 text-sm font-medium text-amber-950 shadow-2xl backdrop-blur">
          Caméra ou micro refusés par le navigateur. Autorise-les pour voir les vidéos en direct comme sur Teams ou Google Meet.
        </div>
      )}

      <div className="flex min-h-[100dvh] flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-black/30 px-4 py-2 backdrop-blur md:px-6 md:py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 text-sm font-bold text-black shadow-lg">
              TV
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Téléconsultation vidéo</p>
              <p className="text-xs text-white/65">Salle {meetingId}</p>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
              {participants.size || 1} participant{participants.size > 1 ? "s" : ""}
            </div>
            <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
              En ligne
            </div>
          </div>
        </header>

        <main className="relative flex-1 p-3 md:p-5">
          <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="relative min-h-[320px] overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-[0_30px_120px_rgba(0,0,0,0.45)] md:min-h-[420px] lg:min-h-[520px]">
              {remoteId ? (
                <ParticipantView participantId={remoteId} isLocal={false} />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-black px-6 text-center">
                  <div className="max-w-md space-y-4">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/10 backdrop-blur">
                      <img src={docta} alt="avatar" className="h-12 w-12 rounded-full" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-white">En attente du vétérinaire</h2>
                      <p className="mt-2 text-sm text-white/70">
                        Partagez le lien et gardez la caméra activée pour un appel vidéo en direct.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 to-transparent" />

              {localId && (
                <div className="absolute bottom-4 right-4 h-40 w-28 overflow-hidden rounded-2xl border border-white/20 bg-white/5 shadow-2xl ring-1 ring-white/10 backdrop-blur-sm md:h-52 md:w-36">
                  <ParticipantView participantId={localId} isLocal={true} />
                </div>
              )}

              {localId && (
                <LocalMediaStateBridge
                  participantId={localId}
                  onStateChange={setLocalMediaState}
                />
              )}
            </section>

            <aside className="flex min-h-0 flex-col gap-3 rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-lg md:gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/50">Statut</p>
                <h3 className="mt-1 text-lg font-semibold text-white">Communication active</h3>
                <p className="mt-2 text-sm text-white/70">
                  Les vidéos ne s’affichent que si la caméra est autorisée dans le navigateur.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-white/45">Caméra</p>
                  <p className={`mt-1 font-semibold ${mediaPermissions.camera === "denied" ? "text-amber-300" : "text-emerald-300"}`}>
                    {mediaPermissions.camera === "denied" ? "Bloquée" : "Prête"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-white/45">Micro</p>
                  <p className={`mt-1 font-semibold ${mediaPermissions.microphone === "denied" ? "text-amber-300" : "text-emerald-300"}`}>
                    {mediaPermissions.microphone === "denied" ? "Bloqué" : "Prêt"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">Raccourcis</p>
                <ul className="mt-3 space-y-2 text-sm text-white/70">
                  <li>• Bouton micro pour couper/rétablir l’audio</li>
                  <li>• Bouton caméra pour afficher le flux vidéo</li>
                  <li>• Bouton ... pour les documents de consultation</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-4">
                <p className="text-sm font-semibold text-white">Réunion</p>
                <p className="mt-1 text-xs text-white/60">Lien: {meetingId}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">Enregistrement local</p>
                <p className="mt-1 text-xs text-white/60">
                  {recordingState.message || "Enregistre la visioconférence sur ce device."}
                </p>
                <button
                  type="button"
                  onClick={recordingState.isRecording ? stopLocalRecording : startLocalRecording}
                  className={`mt-3 w-full rounded-xl px-4 py-2 text-sm font-semibold transition ${recordingState.isRecording ? "bg-red-500 text-white hover:bg-red-400" : "bg-emerald-500 text-black hover:bg-emerald-400"}`}
                >
                  {recordingState.isRecording ? "Arrêter et télécharger" : "Enregistrer l'appel"}
                </button>
              </div>
            </aside>
          </div>
        </main>

        <div className="sticky bottom-0 border-t border-white/10 bg-black/55 px-4 py-3 backdrop-blur md:px-6 md:py-4">
          <Controls
            toggleMenu={() => setMenuOpen(!menuOpen)}
            micOn={localMediaState.micOn}
            webcamOn={localMediaState.webcamOn}
            isRecording={recordingState.isRecording}
          />
        </div>
      </div>

      {menuOpen && (
        <div className="absolute bottom-28 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 rounded-[1.5rem] border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Outils de consultation</p>
              <p className="text-xs text-white/55">Accès rapide aux pièces médicales</p>
            </div>
            <button onClick={() => setMenuOpen(false)} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 hover:bg-white/15">
              Fermer
            </button>
          </div>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              "Carnet médical",
              "Ordonnance",
              "Comptes rendus",
              "Historique animal",
              "Suivi vaccins",
              "Messagerie rapide",
            ].map((item) => (
              <li
                key={item}
                onClick={() => {
                  setActiveModal(item);
                  setMenuOpen(false);
                }}
                className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeModal && (
        <Modal title={activeModal} onClose={() => setActiveModal(null)} />
      )}
    </div>
  );
}


// Contrôles (micro, caméra, quitter, menu)
function Controls({ toggleMenu, micOn, webcamOn, isRecording }) {
  const { leave, toggleMic, toggleWebcam } = useMeeting();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-center gap-3 md:gap-4">
      {isRecording && (
        <div className="order-first mr-2 flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          REC
        </div>
      )}
      <MediaActionButton
        label="Audio"
        activeLabel="ON"
        inactiveLabel="OFF"
        isActive={micOn}
        onClick={() => toggleMic()}
        icon={micro}
      />
      <MediaActionButton
        label="Caméra"
        activeLabel="ON"
        inactiveLabel="OFF"
        isActive={webcamOn}
        onClick={() => toggleWebcam()}
        icon={camera}
      />
      <button
        onClick={() => leave()}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:scale-105 hover:bg-red-500"
        title="Quitter"
      >
        <img src={sortir} alt="sortir" className="h-6 w-6" />
      </button>
      <button
        onClick={() => toggleMenu()}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-lg transition hover:scale-105 hover:bg-white/15"
        title="Outils"
      >
        ...
      </button>
    </div>
  );
}

function MediaActionButton({ label, activeLabel, inactiveLabel, isActive, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={isActive}
      className={`flex min-w-24 flex-col items-center gap-1 rounded-2xl border px-4 py-2 text-white shadow-lg transition hover:scale-[1.03] ${isActive ? "border-emerald-400/30 bg-emerald-500/10" : "border-white/10 bg-white/10"}`}
      title={`${label} ${isActive ? activeLabel : inactiveLabel}`}
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isActive ? "bg-emerald-500/20" : "bg-white/10"}`}>
        <img src={icon} alt={label.toLowerCase()} className="h-6 w-6" />
      </div>
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
        {label}
      </span>
      <span className={`text-[10px] font-bold ${isActive ? "text-emerald-300" : "text-amber-300"}`}>
        {isActive ? activeLabel : inactiveLabel}
      </span>
    </button>
  );
}

function LocalMediaStateBridge({ participantId, onStateChange }) {
  const { micOn, webcamOn } = useParticipant(participantId);

  useEffect(() => {
    onStateChange({ micOn: Boolean(micOn), webcamOn: Boolean(webcamOn) });
  }, [micOn, webcamOn, onStateChange]);

  return null;
}

// Modale générique
function Modal({ title, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[1.5rem] border border-white/10 bg-slate-950 p-6 text-white shadow-2xl">
        <h2 className="mb-2 text-lg font-bold">{title}</h2>
        <p className="text-sm text-white/65">Contenu de {title} ici...</p>
        <button
          onClick={onClose}
          className="mt-5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}



function Priere() {
  const [meetingId, setMeetingId] = useState(null);
  const [inputId, setInputId] = useState("");
  const normalizedInputId = inputId || "";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('roomId') || params.get('meetingId');
    if (roomId) {
      setInputId(roomId.trim());
    }
  }, []);

  // Génération automatique d'un lien au lancement
  useEffect(() => {
    const initMeeting = async () => {
      const newMeetingId = await createMeeting({ token: authToken });
      setMeetingId(newMeetingId);
    };
    if (authToken && !meetingId && !normalizedInputId) {
      initMeeting();
    }
  }, [meetingId, normalizedInputId]);

  const copyToClipboard = () => {
    if (meetingId) {
      navigator.clipboard.writeText(meetingId);
      alert("Lien copié !");
    }
  };

  return authToken && normalizedInputId ? (
    <MeetingProvider
      config={{
        meetingId: normalizedInputId,
        micEnabled: true,
        webcamEnabled: true,
        name: "Éleveur",
      }}
      token={authToken}
    >
      <MeetingConsumer>
        {() => (
          <MeetingView
            meetingId={normalizedInputId}
            onMeetingLeave={() => setInputId("")}
          />
        )}
      </MeetingConsumer>
    </MeetingProvider>
  ) : (
    <div className="flex h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#1f2937_0%,_#111827_55%,_#050816_100%)] px-4 text-white">
      <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-4">
            <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
              Téléconsultation vidéo
            </span>
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">
              Ouvrez un appel vidéo entre l’éleveur et le vétérinaire.
            </h1>
            <p className="max-w-xl text-sm leading-6 text-white/70 md:text-base">
              Lancez une salle, copiez le lien et rejoignez la consultation avec votre caméra et votre micro. L’interface affiche les statuts, les participants et les outils comme dans une vraie visio.
            </p>

            {meetingId && (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Lien généré</p>
                <p className="mt-2 break-all text-sm font-medium text-white">{meetingId}</p>
              </div>
            )}
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-black/25 p-5 shadow-xl">
            <label className="mb-2 block text-sm font-medium text-white/75">Coller le lien de réunion</label>
            <input
              type="text"
              value={normalizedInputId}
              onChange={(e) => setInputId(e.target.value)}
              placeholder="Collez le lien ici"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-emerald-400/50 focus:bg-white/8"
            />
            <button
              onClick={() => setInputId((normalizedInputId.split("/").pop() || "").trim())}
              className="mt-4 w-full rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-black transition hover:bg-emerald-400"
            >
              Rejoindre la réunion
            </button>
            <p className="mt-3 text-xs text-white/50">
              Astuce: autorise caméra et micro dans ton navigateur pour afficher les vraies vidéos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Priere;
