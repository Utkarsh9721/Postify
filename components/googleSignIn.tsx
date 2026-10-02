// components/GoogleSignInButton.tsx
"use client";

import { useEffect, useRef } from "react";

interface Props {
    onSuccess: (credential: string) => void;
}

export default function GoogleSignInButton({ onSuccess }: Props) {
    const buttonRef = useRef<HTMLDivElement>(null);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (initializedRef.current) return;

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;

        script.onload = () => {
            if (!window.google || !buttonRef.current) return;
            window.google.accounts.id.initialize({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
                callback: (response) => onSuccess(response.credential),
            });
            window.google.accounts.id.renderButton(buttonRef.current, {
                theme: "filled_black",
                size: "large",
                shape: "pill",
                width: "100%",
            });
            initializedRef.current = true;
        };

        document.body.appendChild(script);

        return () => {
            if (script.parentNode) script.parentNode.removeChild(script);
        };
    }, [onSuccess]);

    return <div ref={buttonRef} className="flex w-full justify-center" />;
}