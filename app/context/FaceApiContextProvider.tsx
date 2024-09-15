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
    useMemo,
} from "react";

import * as faceapi from 'face-api.js';
import {FaceExpressions} from "face-api.js/build/commonjs/faceExpressionNet/FaceExpressions";
import {debounceTime, Observable} from "rxjs";

const MODEL_URL = '/models';
const minProbability = 0.75
const defSize = {
    width: 320,
    height: 240
};
const THRESHOLD_TIME = 600;

type OnExpressionChange = (arg0: string) => void
type OnModelsLoaded = () => void
type RefVideo = HTMLVideoElement | undefined;
type RefCanvas = HTMLCanvasElement | undefined;
type FaceExpressionLabel = (typeof faceapi.FACE_EXPRESSION_LABELS)[number]; // FACE_EXPRESSION_LABELS = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised']

type Sorted = ReturnType<FaceExpressions["asSortedArray"]>

interface FaceApiContextType {
    outputCanvas: ReactElement
    modelsLoaded: boolean
    onModelsLoaded: (callback: OnModelsLoaded) => void
    onExpressionChange: (callback: OnExpressionChange) => void;
    emojy$: Observable<FaceExpressionLabel>;
}

interface FaceApiContextProviderProps {
    children: ReactNode;
}

const FaceApiContext = createContext<FaceApiContextType | undefined>(undefined);

const VideoBlock = forwardRef<RefVideo, any>(function videoLayout(props, ref) {
        return <video ref={ref} autoPlay muted width="100%" {...props}/>
    }
)
const CanvasBlock = forwardRef<RefCanvas, any>(function canvasLayout(props, ref) {
        return <canvas ref={ref} {...props}/>
    }
)

function reducer(curExpr: FaceExpressionLabel, newExpr: FaceExpressionLabel | null) {
    return (newExpr && (curExpr !== newExpr)) ? newExpr : curExpr
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
    );

    const onExpressionChange = useCallback(
        (callback: OnExpressionChange) => {
            onExpressionChangRef.current = callback
        }, []
    );

    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [expression, setExpression]: [FaceExpressionLabel, Dispatch<FaceExpressionLabel>] = useReducer(reducer, '')

    useEffect(() => {
        onExpressionChangRef.current && onExpressionChangRef.current(expression);
    }, [expression]);

    useEffect(() => {
        // Access the webcam
        const startVideo = async () => {

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
                if (videoRef && videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
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

    function maxExceedingThreshold(arr: Sorted, threshold: number): boolean | null {
        const thresholdValue = arr[1].probability + arr[1].probability * threshold;
        return (arr[0].probability > thresholdValue) ? true : null;
    }

    useEffect(() => {
        if (modelsLoaded && videoRef && canvasRef) {
            // Detect faces in the video stream
            const handleVideoPlay = () => {
                const video = videoRef.current;
                if (!video) {
                    return
                }

                const detect = async () => {

                    if (!videoRef || !videoRef.current) {
                        return
                    }
                    const size = {
                        width: (video.clientWidth || defSize.width),
                        height: (video.clientHeight || defSize.height)
                    };

                    const detection = await faceapi.detectSingleFace(video, new faceapi.SsdMobilenetv1Options({
                        minConfidence: 0.8,
                        maxResults: 1
                    }))
                        .withFaceLandmarks()
                        .withFaceExpressions()
                    const canvas = canvasRef.current;
                    if (!canvas) {
                        return
                    }

                    faceapi.matchDimensions(canvas, {...size});
                    if (detection && canvas) {
                        const sorted: Sorted = detection.expressions.asSortedArray();
                        if (maxExceedingThreshold(sorted, 0.6)) {
                            setExpression(detection.expressions.asSortedArray()[0].expression);
                        }

                        const resizedDetections = faceapi.resizeResults(detection, {...size});

                        const context = canvas.getContext('2d');
                        if (context == null) throw new Error('Could not get context');
                        context.clearRect(0, 0, canvas.width, canvas.height);

                        faceapi.draw.drawDetections(canvas, resizedDetections);
                        faceapi.draw.drawFaceExpressions(canvas, resizedDetections, minProbability)
                    }

                    requestAnimationFrame(detect)
                };

                video.addEventListener('play', () => {
                    requestAnimationFrame(detect)
                });
            };

            handleVideoPlay();
        }
    }, [modelsLoaded]);

    const outputCanvas = <div id="outputCanvas" style={{width: "100%", aspectRatio: "4/3"}}>
        {/* TODO remove in product - onClick and pointerEvents */}
        <VideoBlock ref={videoRef} id="outputVideo" width="100%" height="100%" />
        <CanvasBlock
            ref={canvasRef} id="outputCanvas"
            width="100%" height="100%"
            style={{position: "absolute", top: 0, left: 0, pointerEvents: "none"}}
        />
    </div>

    const emojy$ = useMemo(() => new Observable<FaceExpressionLabel>((observer) => {
            onExpressionChange((expression: FaceExpressionLabel) => { observer.next(expression); });
        })
            .pipe(
                debounceTime(THRESHOLD_TIME)
            )
        , [])

    return (
        <FaceApiContext.Provider
            value={{
                outputCanvas,
                modelsLoaded,
                onModelsLoaded,
                onExpressionChange,
                emojy$,
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
