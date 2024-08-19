"use client";

import {
    createContext,
    useContext,
    useState,
    ReactNode,
    ReactElement,
    FunctionComponent,
    useEffect,
    useRef,
    forwardRef,
    Dispatch,
    useReducer,
    useCallback,
} from "react";

import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';
const minProbability = 0.5
const FPS = 10;
const tik = 1000 / FPS;
const defSize = {
    width: 320,
    height: 200
}

type OnExpressionChange = (arg0: string) => void
type OnModelsLoaded = () => void

interface FaceApiContextType {
    outputCanvas: ReactElement
    modelsLoaded: boolean
    onModelsLoaded: (callback: OnModelsLoaded) => void
    onExpressionChange: (callback: OnExpressionChange) => void;
}

interface FaceApiContextProviderProps {
    children: ReactNode;
}

type RefVideo = HTMLVideoElement | undefined;
type RefCanvas = HTMLCanvasElement | undefined;
type FaceExpressionLabel = (typeof faceapi.FACE_EXPRESSION_LABELS)[number]; // FACE_EXPRESSION_LABELS = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised']

const FaceApiContext = createContext<FaceApiContextType | undefined>(undefined);

const VideoBlock = forwardRef<RefVideo, any>(function videoLayout(props, ref) {
        // TODO refine size settings
        return <video ref={ref} autoPlay muted width="320" height="200" {...props}/>
    }
)
const CanvasBlock = forwardRef<RefCanvas, any>(function canvasLayout(props, ref) {
        // TODO take styles away
        return <canvas ref={ref} {...props}/>
    }
)

function reducer (curExpr: FaceExpressionLabel, newExpr: FaceExpressionLabel) {
    return curExpr !== newExpr ? newExpr : curExpr
}

const FaceApiContextProvider: FunctionComponent<FaceApiContextProviderProps> = ({children}) => {
    const videoRef = useRef<HTMLVideoElement>();
    const canvasRef = useRef<HTMLCanvasElement>();

    const onModelsLoadedRef = useRef<OnModelsLoaded | null>(null);
    const onExpressionChangRef = useRef<OnExpressionChange | null>(null);
    const onModelsLoaded = useCallback(
        (callback: OnModelsLoaded) => {
            onModelsLoadedRef.current = callback
        }, []
    ) ;

    const onExpressionChange = useCallback(
        (callback: OnExpressionChange) => {
            onExpressionChangRef.current = callback
        }, []
    ) ;

    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [expression, setExpression]: [FaceExpressionLabel, Dispatch<FaceExpressionLabel>] = useReducer(reducer, 'neutral' )

    useEffect(() => {
        onExpressionChangRef.current && onExpressionChangRef.current(expression);
    }, [expression]);

    useEffect(() => {
        // Access the webcam
        const startVideo = async () => {

            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            const deviceId = videoDevices[videoDevices.length-1]?.deviceId;

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: {deviceId} });
                if (videoRef && videoRef.current) { videoRef.current.srcObject = stream; }
            } catch (err) {
                console.error('Error accessing webcam:', err);
            }
        };

        Promise.all([
            faceapi.loadSsdMobilenetv1Model(MODEL_URL),
            faceapi.loadFaceLandmarkModel(MODEL_URL),
            faceapi.loadFaceExpressionModel(MODEL_URL),
        ]).then(() => {
            setModelsLoaded(true);
            onModelsLoadedRef.current && onModelsLoadedRef.current();
            startVideo();
        });

    }, []);

    useEffect(() => {
        if (modelsLoaded && videoRef && canvasRef) {
            // Detect faces in the video stream
            const handleVideoPlay = () => {
                const video = videoRef.current;
                if (!video) {return}

                const detect = async () => {

                    if (!videoRef || !videoRef.current) { return }
                    const size = {
                        width: (video.videoWidth / 2),
                        height: (video.videoHeight / 2)
                    } || defSize;

                    const detection = await faceapi.detectSingleFace(video, new faceapi.SsdMobilenetv1Options({minConfidence: 0.9}))
                    // const detection = await faceapi.detectSingleFace(video)
                        .withFaceLandmarks()
                        .withFaceExpressions()
                    const canvas = canvasRef.current;
                    if (!canvas) {return}

                    faceapi.matchDimensions(canvas, {...size});
                    if (detection && canvas) {
                        setExpression(detection.expressions.asSortedArray()[0].expression);

                        const resizedDetections = faceapi.resizeResults(detection, {...size});

                        const context = canvas.getContext('2d');
                        if (context == null) throw new Error('Could not get context');
                        context.clearRect(0, 0, canvas.width, canvas.height);

                        faceapi.draw.drawDetections(canvas, resizedDetections);
                        faceapi.draw.drawFaceExpressions(canvas, resizedDetections, minProbability)
                    }
                };

                video.addEventListener('play', () => {
                    setInterval(detect, tik);
                    // requestAnimationFrame(detect)
                });
            };

            handleVideoPlay();
        }
    }, [modelsLoaded]);

    const outputCanvas = <div>
        <VideoBlock ref={videoRef} id="outputVideo" />
        <CanvasBlock ref={canvasRef} id="outputCanvas" width="320px" height="200px" style={{ position: "absolute", top: 0, left: 0}} />
    </div>

    return (
        <FaceApiContext.Provider
            value={{
                outputCanvas,
                modelsLoaded,
                onModelsLoaded,
                onExpressionChange,
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
    type FaceExpressionLabel
};
