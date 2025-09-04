declare global {
    interface Window {
        Electron?: {
            ipcRenderer: {
                send(channel: string, ...args: any[]): void;
                on(channel: string, func: (...args: any[]) => void): void;
                once(channel: string, func: (...args: any[]) => void): void;
                removeListener(
                    channel: string,
                    func: (...args: any[]) => void
                ): void;
            };
        };
    }
}

export {};
