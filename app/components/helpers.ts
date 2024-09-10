import {FaceExpressionLabel} from "@/app/context/FaceApiContextProvider";

export const animateIcon = (expression: FaceExpressionLabel) => {
    const icon = document.getElementById(expression)

    icon?.animate(
        [
            { transform: 'scale(3)'},
            { transform: 'scale(1)'}
        ], {
            duration: 600,
            iterations: 1
        }
    );

}