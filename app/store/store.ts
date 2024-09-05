import { createStore } from 'zustand/vanilla'

export type AppState = {
    loading: boolean // remove ????
    error: boolean
    text: string
}

export type AppActions = {
    setLoading: (v: boolean) => void // remove // ????
    setText: (v: string) => void
}

export type AppStore = AppState & AppActions;

export const defaultInitialState: AppState = {
    loading: true,
    error: false,
    text: ''
}

export const createAppStore = (initState: AppState = defaultInitialState) => {
    return createStore<AppStore>()((set) => ({
        ...initState,
        setLoading: (v: boolean) => set({ loading: v}),
        setText: (v: string) => set({ text: v }),
        })
    )
}

