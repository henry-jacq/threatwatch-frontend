import { createContext, useContext, useState } from "react";

const ModelContext = createContext();

export function ModelProvider({ children }) {
    const [model, setModel] = useState("ftg-net-v1");

    return (
        <ModelContext.Provider value={{ model, setModel }}>
            {children}
        </ModelContext.Provider>
    );
}

export function useModel() {
    return useContext(ModelContext);
}
