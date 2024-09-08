import {FaceExpressionLabel} from "@/app/context/FaceApiContextProvider";

export const inputDebounce = (func: (...args: any[]) => void, timeout: number = 200) => {
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

export const animateIcon = (expression: FaceExpressionLabel) => {
    const icon = document.getElementById(expression)

    icon?.animate(
        [
            { transform: 'scale(3)'},
            { transform: 'scale(1)'}
        ], {
            duration: 500,
            iterations: 1
        }
    );

}