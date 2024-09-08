import {FaceExpressionLabel} from "@/app/context/FaceApiContextProvider";

export const FACE_EXPRESSION_TIME = 250;

export const emoticonsIcon: { [KEY in FaceExpressionLabel]: string } = Object.freeze({
    'neutral': '😐',
    'happy': '🙂',
    'sad': '🙁',
    'angry': '😠',
    'fearful': '😨',
    'disgusted': '😖',
    'surprised': '😯'
})