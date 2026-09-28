// app/ErrorBoundary.tsx
"use client";

import { Component, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: any) {
        console.error("Boundary caught:", error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback ?? (
                    <div className="flex h-full items-center justify-center text-neutral-600">
                        Something went wrong loading this section.
                    </div>
                )
            );
        }
        return this.props.children;
    }
}