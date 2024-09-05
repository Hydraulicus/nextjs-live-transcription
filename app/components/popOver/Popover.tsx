import { useEffect, useRef, useState, ReactNode } from "react";

interface PopoverProps {
    children: ReactNode;
    content: ReactNode;
    trigger?: "click" | "hover";
}

function Popover({ children, content, trigger = "click" }: PopoverProps) {
    const [show, setShow] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    const handleMouseOver = () => {
        if (trigger === "hover") {
            setShow(true);
        }
    };

    const handleMouseLeft = () => {
        if (trigger === "hover") {
            setShow(false);
        }
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShow(false);
            }
        }

        if (show) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }
    }, [show, wrapperRef]);

    return (
        <div
            ref={wrapperRef}
            onMouseEnter={handleMouseOver}
            onMouseLeave={handleMouseLeft}
            className="w-fit h-fit relative inline"
        >
            <div className="inline w-fit" onClick={() => setShow(!show)}>
                {children}
            </div>
            <div hidden={!show} className="popover">
                <div className="popoverBody">
                    {content}
                </div>
            </div>
        </div>
    );
}

export default Popover;
