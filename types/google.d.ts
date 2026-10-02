// types/google.d.ts

export {};

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
