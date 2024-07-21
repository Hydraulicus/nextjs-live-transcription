"use client";

import {
    createContext,
    useContext,
    useState,
    ReactNode,
    ReactElement,
    FunctionComponent, useEffect, useRef, forwardRef, SetStateAction, Dispatch, useCallback, useReducer,
} from "react";

import * as faceapi from 'face-api.js';

interface FaceApiContextType {
  // connection: LiveClient | null;
  // connectToDeepgram: (options: LiveSchema, endpoint?: string) => Promise<void>;
  // disconnectFromDeepgram: () => void;
  // connectionState: LiveConnectionState;
  outputCanvas: ReactElement
}

const MODEL_URL = '/models';
const minProbability = 0.25

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
      return <canvas ref={ref} {...props} style={{border: "2px red solid"}}/>
    }
)

type FaceExpressionLabel = (typeof faceapi.FACE_EXPRESSION_LABELS)[number]; // FACE_EXPRESSION_LABELS = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised']

function reducer (curExpr: string, newExpr: string) {
    return curExpr !== newExpr ? newExpr : curExpr
}

const FaceApiContextProvider: FunctionComponent<
    FaceApiContextProviderProps
> = ({children}) => {
  const videoRef = useRef<HTMLVideoElement>();
  const canvasRef = useRef();
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [expression, setExpression]: [FaceExpressionLabel, Dispatch<SetStateAction<FaceExpressionLabel>>] = useReducer<FaceExpressionLabel>(reducer, 'neutral' )

    useEffect(() => {
        console.log(' ====> expression =', expression)
    }, [expression]);

    useEffect(() => {
        // Access the webcam
        const startVideo = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
                if (videoRef && videoRef.current) { videoRef.current.srcObject = stream; }
            } catch (err) {
                console.error('Error accessing webcam:', err);
            }
        };

        Promise.all([
                faceapi.loadSsdMobilenetv1Model(MODEL_URL),
                faceapi.loadFaceLandmarkModel(MODEL_URL),
                faceapi.loadFaceExpressionModel(MODEL_URL),
        ]).then(() => { setModelsLoaded(true); startVideo(); });

    }, []);

    useEffect(() => {
        if (modelsLoaded && videoRef && videoRef.current && canvasRef && canvasRef.current) {
            // Detect faces in the video stream
            const handleVideoPlay = () => {
                const video = videoRef.current;

                const detect = async () => {

                    const detection = await faceapi.detectSingleFace(video)
                        .withFaceLandmarks()
                        // .withFaceDescriptor()
                        .withFaceExpressions()
                    const canvas = canvasRef.current;

                    faceapi.matchDimensions(canvas, {
                        // TODO make responsive scaling
                        width: video.videoWidth / 2,
                        height: video.videoHeight / 2
                    });
                    if (detection) {
                        setExpression(detection.expressions.asSortedArray()[0].expression);

                        // TODO make responsive scaling
                        const resizedDetections = faceapi.resizeResults(detection, {
                            width: video.videoWidth / 2,
                            height: video.videoHeight / 2
                        });

                        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                        faceapi.draw.drawDetections(canvas, resizedDetections);
                        // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
                        faceapi.draw.drawFaceExpressions(canvas, resizedDetections, minProbability)
                    }
                };

                video.addEventListener('play', () => {
                    setInterval(detect, 100);
                });
            };

            handleVideoPlay();
        }
    }, [modelsLoaded]);

  const outputCanvas = <div>
      <VideoBlock ref={videoRef} id="outputVideo" />
      <CanvasBlock ref={canvasRef} id="outputCanvas" width="320px" height="200px"/>
  </div>

    // TODO optimize rerenderings
    console.log(' rerender !!!!!')

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
