"use client";

import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useAppStore} from "@/app/store/app-store-provider";
import {LiveConnectionState, useDeepgram,} from "../context/DeepgramContextProvider";
import {MicrophoneEvents, MicrophoneState, useMicrophone,} from "../context/MicrophoneContextProvider";
import {FaceExpressionLabel, useFaceApi} from "../context/FaceApiContextProvider"
import {Icon} from "@/app/components/Icon";
import "./index.css";
import {LoadingModal} from "@/app/components/loadingModal/LoadingModal";
import Popover from "@/app/components/popOver/Popover";
import {animateIcon} from "@/app/components/helpers";
import {emoticonsIcon} from "@/app/components/const";
import Visualizer from "@/app/components/visualizer/Visualizer";
import {LiveTranscriptionEvent, LiveTranscriptionEvents} from "@deepgram/sdk";
import * as faceapi from "face-api.js";

type AddEmojyAndText = {
    content: FaceExpressionLabel | string,
    textarea: React.MutableRefObject<HTMLTextAreaElement>
};

const App: () => JSX.Element = () => {

    const {loading, text, setText, setLoading} = useAppStore((state) => state);
    const {connection, connectToDeepgram, connectionState} = useDeepgram();
    const {setupMicrophone, microphone, startMicrophone, microphoneState} = useMicrophone();
    const {
        outputCanvas,
        onModelsLoaded,
        emojy$,
    } = useFaceApi();
    const captionTimeout = useRef<any>();
    const keepAliveInterval = useRef<any>();
    const textarea = useRef<any>();
    const [selection, setSelection] = useState<{ start: number, end: number }>()

    const insertAtCursor = useCallback(({content, textarea}: AddEmojyAndText) => {
            if (!(textarea && textarea.current && content)) {
                return
            }
            let cursorPos = textarea.current.selectionStart;
            let v = textarea.current.value;
            let textBefore = v.substring(0, cursorPos);
            let textAfter = v.substring(cursorPos, v.length);
            setText(textBefore + content + textAfter);

            cursorPos += content.length;
            setSelection({start: cursorPos, end: cursorPos})
        }, [setText]
    );

    const addEmojy = ({content, textarea}: AddEmojyAndText) => {
        if (!content || !((faceapi.FACE_EXPRESSION_LABELS).includes(content)) || content === 'neutral') return;
        insertAtCursor({content: emoticonsIcon[content], textarea});
        animateIcon(content)
    }

    const emojyChangeHandler = useMemo(() =>
            () => emojy$.subscribe((expression: FaceExpressionLabel) => {
                    addEmojy({content: expression, textarea})
                }
            )
        , [emojy$, insertAtCursor])

    useEffect(() => {
        emojyChangeHandler()
    }, [emojyChangeHandler]);

    useEffect(() => {
        setupMicrophone();
    }, []);

    useEffect(() => {
        onModelsLoaded(() => {
            setLoading(false)
        })
    }, [onModelsLoaded, setLoading])

    const onTextInput = useCallback((inp: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(inp.target.value)
    }, [setText]);

    useEffect(() => {
        if (!selection) return;  // prevent running on start
        const {start, end} = selection;
        textarea.current.focus();
        textarea.current.setSelectionRange(start, end);
    }, [selection]);

    useEffect(() => {
        if (microphoneState === MicrophoneState.Ready) {
            connectToDeepgram({
              model: "nova-2",
              interim_results: true,
              smart_format: true,
              filler_words: true,
              utterance_end_ms: 3000,
            });
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
            const {is_final: isFinal, speech_final: speechFinal} = data;
            let thisCaption = data.channel.alternatives[0].transcript;

            if (isFinal && speechFinal) {
                clearTimeout(captionTimeout.current);
                insertAtCursor({content: thisCaption, textarea});
                captionTimeout.current = setTimeout(() => {
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

    const iconOnClick = (e: React.MouseEvent<SVGSVGElement>) => {
        e.preventDefault();
        addEmojy({content: (e.currentTarget as Element).id, textarea});
    }

    return (
        loading ?
            <LoadingModal/>
            :
            <div className="app">
                {microphone && <Visualizer microphone={microphone}/>}
                <div className="topBlock">
                    <div className="bg-cyan-900 relative rounded">{outputCanvas}</div>
                </div>

                <div className="messageBlock">
                    <div className="max-w-3xl h-8 shrink">
                        <Popover trigger="hover" content={<p className="content">Confounded</p>}>
                            <Icon id="disgusted" className="emotionIcon" name="confounded-face" onClick={iconOnClick}/>
                        </Popover>
                        <Popover trigger="hover" content={<p className="content">Fearful</p>}>
                            <Icon id="fearful" className="emotionIcon" name="fearful-face" onClick={iconOnClick}/>
                        </Popover>
                        <Popover trigger="hover" content={<p className="content">Hushed</p>}>
                            <Icon id="surprised" className="emotionIcon" name="hushed-face" onClick={iconOnClick}/>
                        </Popover>
                        <Popover trigger="hover" content={<p className="content">Slightly frowning</p>}>
                            <Icon id="sad" className="emotionIcon" name="slightly-frowning-face" onClick={iconOnClick}/>
                        </Popover>
                        <Popover trigger="hover" content={<p className="content">Slightly smiling</p>}>
                            <Icon id="happy" className="emotionIcon" name="slightly-smiling-face"
                                  onClick={iconOnClick}/>
                        </Popover>

                    </div>
                    <div className="w-full h-full ">
                        <label htmlFor="message"
                               className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                        >
                            Speak or write your thoughts here:
                        </label>
                        <textarea id="message"
                                  ref={textarea}
                                  className="textarea"
                                  placeholder="Your message here..."
                                  value={text}
                                  onChange={onTextInput}
                        >
                        </textarea>
                    </div>
                </div>
            </div>
    );
};

export default App;
