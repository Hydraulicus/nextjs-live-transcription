"use client";

import {ReactNode, useEffect, useRef, useState} from "react";
import {useAppStore} from "@/app/store/app-store-provider";
import {
  LiveConnectionState,
  LiveTranscriptionEvent,
  LiveTranscriptionEvents,
  useDeepgram,
} from "../context/DeepgramContextProvider";
import {
  MicrophoneEvents,
  MicrophoneState,
  useMicrophone,
} from "../context/MicrophoneContextProvider";
import {FaceExpressionLabel, useFaceApi} from "../context/FaceApiContextProvider"
import Visualizer from "./Visualizer";
import {Icon} from "@/app/components/Icon";
import "./index.css";

const FACE_EXPRESSION_TIME = 250;

const emoticonsName: {[KEY in FaceExpressionLabel]: string} = Object.freeze({
  'neutral': 'neutral',
  'happy': 'slightly-smiling-face',
  'sad': 'slightly-frowning-face',
  'angry': 'angry',
  'fearful': 'fearful-face',
  'disgusted': 'confounded-face',
  'surprised': 'hushed-face'
})

const inputDebounce = (func: (...args: any[]) => void, timeout: number = 200) => {
  let timer: number | undefined;

  return (...args: any[]) => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = window.setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
};

const App: () => JSX.Element = () => {

  // TODO remove. Save  caption by setText of useAppStore.
  const [caption, setCaption] = useState<string | undefined>('::happy::');
  const [markup, setMarkup] = useState<ReactNode>();


  const {loading, text, setText} = useAppStore((state) => state);
  const { connection, connectToDeepgram, connectionState } = useDeepgram();
  const { setupMicrophone, microphone, startMicrophone, microphoneState } = useMicrophone();
  const {outputCanvas, modelsLoaded,
    onModelsLoaded,
    onExpressionChange,
  } = useFaceApi();
  const captionTimeout = useRef<any>();
  const keepAliveInterval = useRef<any>();

  useEffect(() => {
    setupMicrophone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onModelsLoaded( () => { console.log(' Models loaded');})
  }, [onModelsLoaded])

  function parsedText({ text }: { text: string }): ReactNode {
    const cloneEmoIcon = (emotion: FaceExpressionLabel, key: string): ReactNode => <Icon className="emotion icon" name={emoticonsName[emotion]} key={key}/>
    return text.split(/(::.*?::)/g).map((elem, i) => {
      // console.log(' elem:', elem);
      if (!elem
          // don't show icon of "neutral"
          && elem !== '::neutral::'
      ) return null;
      const emotion = elem.replace(/^::+|::+$/g, '')
      // console.log(' emotion:', emotion);
      if (emoticonsName[emotion as FaceExpressionLabel]) {
        return cloneEmoIcon(emotion, `${emotion}-${i}`);
      }
      return <span key={`${elem}-${i}`}>{elem}</span>;
    });
  }

    onExpressionChange((expression: FaceExpressionLabel) => {
      const onChange = ({text, expression}: {text: string, expression: FaceExpressionLabel}) => {
        setText(text + `::${expression}:: `);
        setMarkup(parsedText({text}))
      }
      console.log(' onExpression is called from App', expression);
      inputDebounce((expression: FaceExpressionLabel) => onChange({text, expression}), FACE_EXPRESSION_TIME)(expression);
    })

  useEffect(() => {
    if (microphoneState === MicrophoneState.Ready) {
      // TODO. Uncommit for production. Disable connection to Deepgram for prevent wasting of funds
      // connectToDeepgram({
      //   model: "nova-2",
      //   interim_results: true,
      //   smart_format: true,
      //   filler_words: true,
      //   utterance_end_ms: 3000,
      // });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microphoneState]);

  useEffect(() => {
    if (!microphone || !connection) return;

    const onData = (e: BlobEvent) => {
      // iOS SAFARI FIX:
      // Prevent packetZero from being sent. If sent at size 0, the connection will close. 
      if (e.data.size > 0) {
        connection?.send(e.data);
      }
    };

    const onTranscript = (data: LiveTranscriptionEvent) => {
      const { is_final: isFinal, speech_final: speechFinal } = data;
      let thisCaption = data.channel.alternatives[0].transcript;

      console.log("thisCaption", thisCaption);
      if (thisCaption !== "") {
        console.log('thisCaption !== ""', thisCaption);
        setCaption(thisCaption);
      }

      if (isFinal && speechFinal) {
        clearTimeout(captionTimeout.current);
        captionTimeout.current = setTimeout(() => {
          setCaption(undefined);
          clearTimeout(captionTimeout.current);
        }, 3000);
      }
    };

    if (connectionState === LiveConnectionState.OPEN) {
      connection.addListener(LiveTranscriptionEvents.Transcript, onTranscript);
      microphone.addEventListener(MicrophoneEvents.DataAvailable, onData);

      startMicrophone();
    }

    return () => {
      // prettier-ignore
      connection.removeListener(LiveTranscriptionEvents.Transcript, onTranscript);
      microphone.removeEventListener(MicrophoneEvents.DataAvailable, onData);
      clearTimeout(captionTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState]);

  useEffect(() => {
    if (!connection) return;

    if (
      microphoneState !== MicrophoneState.Open &&
      connectionState === LiveConnectionState.OPEN
    ) {
      connection.keepAlive();

      keepAliveInterval.current = setInterval(() => {
        connection.keepAlive();
      }, 10000);
    } else {
      clearInterval(keepAliveInterval.current);
    }

    return () => {
      clearInterval(keepAliveInterval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microphoneState, connectionState]);

  // @ts-ignore
  // @ts-ignore
  return (
      <div className="main">

        <div className="flex flex-1 items-center justify-center bg-pink-500 p-2 max-w-md w-full">
          <div className="bg-emerald-600 relative">{outputCanvas}</div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center bg-green-500 p-2 max-w-md w-full">
          <div className="max-w-3xl h-15">
            {/*<svg className="inline self-center w-[3em] h-[3em]">*/}
            {/*  <use href={`sprite_flat.svg#confounded-face`}/>*/}
            {/*</svg>*/}
            <Icon className="h-[2em] w-[2em] hover:animate-spin" name="confounded-face" />
            <Icon className="h-[3em] w-[2em] hover:animate-bounce" name="fearful-face" />
            <Icon className="h-[2em] w-[2em] hover:animate-pulse" name="hushed-face" />
            <Icon className="h-[2em] w-[2em] hover:animate-[wiggle_1s_ease-in-out_infinite]" name="slightly-frowning-face" />
            <Icon className="h-[2em] w-[2em] transform transition duration-500 hover:scale-150" name="slightly-smiling-face" />
            {/*<Icon className="h-[2em] w-[2em] animate-in fade-in zoom-in-150 slide-in-from-top duration-1000" name="slightly-frowning-face" />*/}


          </div>
          <div className="bottom-[8rem] inset-x-0 max-w-4xl mx-auto text-center bg-cyan-600">
            {markup}
          </div>
          <div className="w-full">
            <label htmlFor="message" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your
              message</label>
            <textarea id="message"
                      rows={4}
                      className="textarea"
                      placeholder="Write your thoughts here..."></textarea>

          </div>
        </div>

      </div>


      // <>
      //   <div className="flex h-full antialiased">
      //     <div className="flex flex-row h-full w-full overflow-x-hidden">
      //       <div className="flex flex-col flex-auto h-full bg-cyan-900 ">
      //         {/* height 100% minus 8rem */}
      //         <div className="relative w-full h-screen justify-center items-center ">
      //           <div className="max-w-3xl bg-emerald-600">here camera output</div>
      //           <div className="max-w-3xl bg-amber-700 h-5">strip of miles are here </div>
      //           <div className="max-w-3xl bg-cyan-600 h-5">{caption} </div>
      //           {/*{microphone && <Visualizer microphone={microphone} />}*/}
      //           <div className="absolute bottom-[8rem] inset-x-0 max-w-4xl mx-auto text-center">
      //             {caption && <span className="bg-black/70 p-8">{caption}</span>}
      //           </div>
      //         </div>
      //       </div>
      //     </div>
      //   </div>
      // </>
  );
};

export default App;
