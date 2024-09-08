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