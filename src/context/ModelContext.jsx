import { createContext, useContext, useEffect, useState } from "react";
import { inferenceAPI } from "../services/api";

const ModelContext = createContext();

export function ModelProvider({ children }) {
    const [models, setModels] = useState({});
    const [activeModel, setActiveModel] = useState(null);
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        async function init() {
            try {
                const res = await inferenceAPI.models();

                setModels(res);

                // restore from localStorage or fallback to backend active
                const stored = localStorage.getItem("active_model");
                const active =
                    stored && res[stored]
                        ? stored
                        : Object.entries(res).find(([_, m]) => m.active)?.[0];

                if (active) {
                    setActiveModel(active);
                    localStorage.setItem("active_model", active);
                }
            } catch (e) {
                console.error("Model init failed", e);
            }
        }

        init();
    }, []);

    async function switchModel(modelId) {
        if (!modelId || modelId === activeModel || isLocked) return;

        await inferenceAPI.switchModel(modelId);

        setModels((prev) =>
            Object.fromEntries(
                Object.entries(prev).map(([id, m]) => [
                    id,
                    { ...m, active: id === modelId },
                ])
            )
        );

        setActiveModel(modelId);
        localStorage.setItem("active_model", modelId);
    }

    return (
        <ModelContext.Provider
            value={{
                models,
                activeModel,
                switchModel,
                isLocked,
                setIsLocked, // inference pages can lock switching
            }}
        >
            {children}
        </ModelContext.Provider>
    );
}

export function useModel() {
    return useContext(ModelContext);
}
