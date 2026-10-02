// types/google.d.ts

/**
 * Google Identity Services — global type declaration.
 * Declared once here so every file that uses the GIS script
 * gets the same types without conflicting declarations.
 */
export { };

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string;
                        callback: (response: { credential: string }) => void;
                    }) => void;
                    renderButton: (
                        element: HTMLElement,
                        options: Record<string, string | number>
                    ) => void;
                    disableAutoSelect?: () => void;
                    prompt?: () => void;
                };
            };
        };
    }
}