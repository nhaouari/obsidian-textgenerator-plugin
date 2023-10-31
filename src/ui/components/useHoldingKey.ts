import { useEffect, useState } from "react";

export default function useHoldingKey() {
    const [ctrl, setCtrlIsPressed] = useState(false);
    const [shift, setShiftIsPressed] = useState(false);
    const [alt, setAltIsPressed] = useState(false);
    const [meta, setMetaIsPressed] = useState(false);
    useEffect(() => {
        const lis: (this: Window, ev: KeyboardEvent) => any = (e) => {
            setCtrlIsPressed(e.ctrlKey);
            setShiftIsPressed(e.shiftKey);
            setAltIsPressed(e.altKey);
            setMetaIsPressed(e.metaKey);
        };
        window.addEventListener("keydown", lis);
        window.addEventListener("keyup", lis);

        return () => {
            window.removeEventListener("keydown", lis);
            window.removeEventListener("keyup", lis);
        };
    }, []);

    return {
        ctrl,
        shift,
        alt,
        meta,
    };
}