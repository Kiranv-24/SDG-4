// @ts-nocheck
import { useParticipant } from "@videosdk.live/react-sdk";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { Controls } from "./Controls";

export function ParticipantView(props) {
  const micRef = useRef(null);
  const videoContainerRef = useRef(null);
  const [isParticipantFullScreen, setIsParticipantFullScreen] = useState(false);
  
  const { webcamStream, micStream, webcamOn, micOn, isLocal, displayName } =
    useParticipant(props.participantId);

  const videoStream = useMemo(() => {
    if (webcamOn && webcamStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      return mediaStream;
    }
  }, [webcamStream, webcamOn]);

  useEffect(() => {
    if (micRef.current) {
      if (micOn && micStream) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(micStream.track);

        micRef.current.srcObject = mediaStream;
        micRef.current
          .play()
          .catch((error) =>
            console.error("videoElem.current.play() failed", error)
          );
      } else {
        micRef.current.srcObject = null;
      }
    }
  }, [micStream, micOn]);

  const toggleParticipantFullScreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen();
      setIsParticipantFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsParticipantFullScreen(false);
      }
    }
  };

  return (
    <div 
      ref={videoContainerRef}
      className={`relative rounded-lg overflow-hidden bg-gray-900 ${
        props.isFullScreen ? 'h-full' : 'h-[300px]'
      } ${isParticipantFullScreen ? 'fixed inset-0 z-50' : ''}`}
    >
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
        <p className="text-white font-medium">
          {displayName} {isLocal ? "(You)" : ""}
        </p>
        <div className="flex gap-2 text-sm text-gray-300">
          <span>{webcamOn ? "Camera ON" : "Camera OFF"}</span>
          <span>•</span>
          <span>{micOn ? "Mic ON" : "Mic OFF"}</span>
        </div>
      </div>

      <audio ref={micRef} autoPlay playsInline muted={isLocal} />
      
      {webcamOn && (
        <div className="h-full">
          <ReactPlayer
            url={videoStream}
            playing={true}
            playsinline
            pip={false}
            light={false}
            controls={false}
            muted={true}
            width="100%"
            height="100%"
            style={{ objectFit: "cover" }}
            onError={(err) => {
              console.log(err, "participant video error");
            }}
          />
          <div className="absolute bottom-4 right-4 z-10">
            <button
              onClick={toggleParticipantFullScreen}
              className="bg-gray-800/80 hover:bg-gray-700/80 text-white p-2 rounded-lg transition-colors duration-300"
            >
              {isParticipantFullScreen ? (
                <span>Exit Fullscreen</span>
              ) : (
                <span>Fullscreen</span>
              )}
            </button>
          </div>
          <div className="absolute bottom-4 left-4 z-10">
            <Controls />
          </div>
        </div>
      )}
    </div>
  );
}
