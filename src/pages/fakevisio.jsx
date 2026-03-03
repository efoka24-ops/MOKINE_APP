import "../App.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { MeetingProvider, MeetingConsumer, useMeeting, useParticipant } from "@videosdk.live/react-sdk";
import { authToken, createMeeting } from "../API";
import ReactPlayer from "react-player";

// Icônes
import sortir from '../icones/images/logout.png';
import micro from '../icones/images/micro.png';
import camera from '../icones/images/camera.png';
import docta from '../assets/images/user.png';

// Composant vidéo d’un participant
function ParticipantView({ participantId, isLocal }) {
  const micRef = useRef(null);
  const { webcamStream, micStream, webcamOn, micOn, displayName } = useParticipant(participantId);

  const videoStream = useMemo(() => {
    if (webcamOn && webcamStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      return mediaStream;
    }
  }, [webcamStream, webcamOn]);

  // gestion micro
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

  return (
    <div className={isLocal ? "absolute bottom-20 right-4 w-24 h-32 rounded-lg overflow-hidden shadow-lg border-2 border-white" : "w-full h-full"}>
      <audio ref={micRef} autoPlay muted={isLocal} />
      {webcamOn ? (
        <ReactPlayer
          playsinline
          pip={false}
          controls={false}
          muted={true}
          playing={true}
          url={videoStream}
          width="100%"
          height="100%"
          style={{ objectFit: "cover" }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-300">
          <img src={docta} alt="avatar" className="w-12 h-12 rounded-full" />
        </div>
      )}
    </div>
  );
}

// Contrôles (micro, caméra, quitter, menu)
function Controls({ toggleMenu }) {
  const { leave, toggleMic, toggleWebcam } = useMeeting();

  return (
    <div className="absolute bottom-4 w-full flex justify-center gap-6">
      <button onClick={toggleMic} className="bg-gray-800 text-white p-3 rounded-full shadow-lg">
        <img src={micro} alt="micro" className="w-6 h-6" />
      </button>
      <button onClick={toggleWebcam} className="bg-gray-800 text-white p-3 rounded-full shadow-lg">
        <img src={camera} alt="caméra" className="w-6 h-6" />
      </button>
      <button onClick={leave} className="bg-red-600 text-white p-3 rounded-full shadow-lg">
        <img src={sortir} alt="sortir" className="w-6 h-6" />
      </button>
      <button onClick={toggleMenu} className="bg-gray-800 text-white p-3 rounded-full shadow-lg">
        ...
      </button>
    </div>
  );
}

// Modale générique
function Modal({ title, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl p-6 w-11/12 max-w-sm">
        <h2 className="font-bold text-lg mb-4">{title}</h2>
        <p className="text-gray-600">Contenu de {title} ici...</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">Fermer</button>
      </div>
    </div>
  );
}

function MeetingView({ meetingId, onMeetingLeave }) {
  const { join, participants } = useMeeting({
    onMeetingJoined: () => console.log("Réunion rejointe"),
    onMeetingLeft: onMeetingLeave,
  });

  const [joined, setJoined] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    if (!joined) {
      join();
      setJoined(true);
    }
  }, [join, joined]);

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Vidéo de l’autre participant */}
      {[...participants.keys()].map((id) => (
        <ParticipantView key={id} participantId={id} isLocal={false} />
      ))}
      {/* Mon image en petit */}
      {[...participants.keys()].map((id) => (
        <ParticipantView key={id} participantId={id} isLocal={true} />
      ))}

      {/* Contrôles */}
      <Controls toggleMenu={() => setMenuOpen(!menuOpen)} />

      {/* Menu blanc */}
      {menuOpen && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white rounded-xl p-4 shadow-lg w-11/12 max-w-sm">
          <ul className="flex flex-col gap-3">
            {["Carnet médical", "Ordonnance", "Comptes rendus", "Historique animal", "Suivi vaccins", "Messagerie rapide"].map((item) => (
              <li
                key={item}
                onClick={() => { setActiveModal(item); setMenuOpen(false); }}
                className="cursor-pointer p-2 rounded-lg hover:bg-gray-100"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modale active */}
      {activeModal && <Modal title={activeModal} onClose={() => setActiveModal(null)} />}
    </div>
  );
}

function Priere() {
  const [meetingId, setMeetingId] = useState(null);

  const getMeetingAndToken = async (id) => {
    const newMeetingId = id == null ? await createMeeting({ token: authToken }) : id;
    setMeetingId(newMeetingId);
  };

  return authToken && meetingId ? (
    <MeetingProvider
      config={{ meetingId, micEnabled: true, webcamEnabled: true, name: "Éleveur" }}
      token={authToken}
    >
      <MeetingConsumer>
        {() => <MeetingView meetingId={meetingId} onMeetingLeave={() => setMeetingId(null)} />}
      </MeetingConsumer>
    </MeetingProvider>
  ) : (
    <div className="flex flex-col items-center justify-center h-screen">
      <button
        onClick={() => getMeetingAndToken(null)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Démarrer une visioconférence
      </button>
    </div>
  );
}

export default Priere;
