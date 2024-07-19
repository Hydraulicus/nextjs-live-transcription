"use client";

// import {
//   createClient,
//   LiveClient,
//   LiveConnectionState,
//   LiveTranscriptionEvents,
//   type LiveSchema,
//   type LiveTranscriptionEvent,
// } from "@deepgram/sdk";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  ReactElement,
  FunctionComponent, useEffect, useRef, forwardRef,
} from "react";

import * as faceapi from 'face-api.js';

interface FaceApiContextType {
  // connection: LiveClient | null;
  // connectToDeepgram: (options: LiveSchema, endpoint?: string) => Promise<void>;
  // disconnectFromDeepgram: () => void;
  // connectionState: LiveConnectionState;
  outputCanvas: ReactElement
}

const FaceApiContext = createContext<FaceApiContextType | undefined>(
    undefined
);

interface FaceApiContextProviderProps {
  children: ReactNode;
}

type RefVideo = HTMLVideoElement | undefined;
type RefCanvas = HTMLCanvasElement | undefined;

const VideoBlock = forwardRef<RefVideo, any>(function videoLayout(props, ref) {
      return <video ref={ref} autoPlay muted width="320" height="200" {...props}/>
    }
)
const CanvasBlock = forwardRef<RefCanvas, any>(function canvasLayout(props, ref) {
      return <canvas ref={ref} {...props}/>
    }
)

const FaceApiContextProvider: FunctionComponent<
    FaceApiContextProviderProps
> = ({children}) => {
  const videoRef = useRef<HTMLVideoElement>();
  const canvasRef = useRef();
  const [modelsLoaded, setModelsLoaded] = useState(false);

    useEffect(() => {
        console.log(faceapi.nets)

        // Load models
        const loadModels = async () => {
            const MODEL_URL = '/models';
            await faceapi.loadSsdMobilenetv1Model(MODEL_URL);
            await faceapi.loadFaceLandmarkModel(MODEL_URL);
            await faceapi.loadFaceRecognitionModel(MODEL_URL);
            setModelsLoaded(true);
        };

        loadModels();

        // Access the webcam
        const startVideo = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
                if (videoRef && videoRef.current) { videoRef.current.srcObject = stream; }
            } catch (err) {
                console.error('Error accessing webcam:', err);
            }
        };

          startVideo();
    }, []);

  // const [connection, setConnection] = useState<LiveClient | null>(null);
  // const [connectionState, setConnectionState] = useState<LiveConnectionState>(
  //   LiveConnectionState.CLOSED
  // );

  // const connectToDeepgram = async (options: LiveSchema, endpoint?: string) => {
  //   const key = await getApiKey();
  //   const deepgram = createClient(key);
  //
  //   const conn = deepgram.listen.live(options, endpoint);
  //
  //   conn.addListener(LiveTranscriptionEvents.Open, () => {
  //     setConnectionState(LiveConnectionState.OPEN);
  //   });
  //
  //   conn.addListener(LiveTranscriptionEvents.Close, () => {
  //     setConnectionState(LiveConnectionState.CLOSED);
  //   });
  //
  //   setConnection(conn);
  // };

  // const disconnectFromDeepgram = async () => {
  //   if (connection) {
  //     connection.finish();
  //     setConnection(null);
  //   }
  // };

  // const outputCanvas = videoBlockLayout({videoRef, canvasRef})
  // const outputCanvas = (videoRef ?? <VideoBlockLayout ref={videoRef} />) || <span>videoRef is not ready yet</span>
  const outputCanvas = <div>
      <VideoBlock ref={videoRef} id="outputVideo" />
      <CanvasBlock ref={canvasRef} id="outputCanvas" />
  </div>


  return (
      <FaceApiContext.Provider
          value={{
            // connection,
            // connectToDeepgram,
            // disconnectFromDeepgram,
            // connectionState,
            outputCanvas,
          }}
      >
        {children}
      </FaceApiContext.Provider>
  );
};

function useFaceApi(): FaceApiContextType {
  const context = useContext(FaceApiContext);
  if (context === undefined) {
    throw new Error(
        "useFaceApi must be used within a FaceApiContextProvider"
    );
  }
  return context;
}

export {
  FaceApiContextProvider,
  useFaceApi,
  // LiveConnectionState,
  // LiveTranscriptionEvents,
  // type LiveTranscriptionEvent,
};
