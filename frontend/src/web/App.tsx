import { useRef, useEffect, useState } from "react";
import "./App.css";
import image from "../../assets/ocean-cleaner.png";

export const App = () => {
    const upButtonRef = useRef<HTMLButtonElement>(null);
    const leftButtonRef = useRef<HTMLButtonElement>(null);
    const rightButtonRef = useRef<HTMLButtonElement>(null);
    const downButtonRef = useRef<HTMLButtonElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const [activeKeys, setActiveKeys] = useState<string[]>([]);
    const [imgUrl, setImgUrl] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const keyPressStartTime = useRef<{ [key: string]: number }>({});
    const intervalRef = useRef<number | null>(null);
    const buttonIntervalRef = useRef<{ [key: string]: number | null }>({
        up: null,
        left: null,
        right: null,
        down: null,
    });

    // WebSocket接続用のuseEffect
    useEffect(() => {
        let reconnectTimeout: number;

        const connectWebSocket = () => {
            // WebSocketサーバーに接続
            const ws = new WebSocket("ws://localhost:8765");
            ws.binaryType = "arraybuffer";

            ws.onmessage = (event) => {
                const blob = new Blob([event.data], { type: "image/jpeg" });
                const url = URL.createObjectURL(blob);
                setImgUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return url;
                });
            };

            // 接続が切れた場合の処理
            ws.onclose = (event) => {
                console.log(
                    "WebSocket接続が切断されました",
                    event.code,
                    event.reason
                );
                setImgUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return null;
                });

                // 正常な切断（コード1000）でない場合のみ再接続を試行
                if (event.code !== 1000) {
                    // 3秒後に再接続を試行
                    reconnectTimeout = window.setTimeout(() => {
                        console.log("WebSocket再接続を試行中...");
                        connectWebSocket();
                    }, 3000);
                }
            };

            // エラーが発生した場合の処理
            ws.onerror = (error) => {
                console.error("WebSocketエラー:", error);
                setImgUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return null;
                });
                // エラーが発生した場合は接続を閉じて再接続を試行
                ws.close();
            };

            wsRef.current = ws;
        };

        connectWebSocket();

        return () => {
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
            setImgUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
        };
    }, []);

    useEffect(() => {
        const handleKeyAction = (keys: string[]) => {
            // 最後に押されたキーを優先
            const lastKey = keys[keys.length - 1];
            if (!lastKey) return;

            try {
                switch (lastKey) {
                    case "w":
                        upButtonRef.current?.click();
                        console.log("up");
                        // Electronオブジェクトの存在チェック
                        if (window.Electron && window.Electron.ipcRenderer) {
                            window.Electron.ipcRenderer.send("key-input", "up");
                        }
                        break;
                    case "a":
                        leftButtonRef.current?.click();
                        console.log("left");
                        if (window.Electron && window.Electron.ipcRenderer) {
                            window.Electron.ipcRenderer.send(
                                "key-input",
                                "left"
                            );
                        }
                        break;
                    case "s":
                        downButtonRef.current?.click();
                        console.log("down");
                        if (window.Electron && window.Electron.ipcRenderer) {
                            window.Electron.ipcRenderer.send(
                                "key-input",
                                "down"
                            );
                        }
                        break;
                    case "d":
                        rightButtonRef.current?.click();
                        console.log("right");
                        if (window.Electron && window.Electron.ipcRenderer) {
                            window.Electron.ipcRenderer.send(
                                "key-input",
                                "right"
                            );
                        }
                        break;
                    default:
                        break;
                }
            } catch (error) {
                console.error(
                    "キーアクション処理中にエラーが発生しました:",
                    error
                );
            }
        };
        const startInterval = (keys: string[]) => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            intervalRef.current = window.setInterval(() => {
                handleKeyAction(keys);
            }, 100); // 100msごとに処理を実行
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();
            if (!["w", "a", "s", "d"].includes(key)) return;

            setActiveKeys((prevKeys) => {
                if (!prevKeys.includes(key)) {
                    keyPressStartTime.current[key] = Date.now();
                    const newKeys = [...prevKeys, key];
                    handleKeyAction(newKeys);
                    startInterval(newKeys);
                    return newKeys;
                }
                return prevKeys;
            });
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();
            if (!["w", "a", "s", "d"].includes(key)) return;

            setActiveKeys((prevKeys) => {
                const newKeys = prevKeys.filter((k) => k !== key);
                delete keyPressStartTime.current[key];
                if (newKeys.length === 0) {
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                } else {
                    startInterval(newKeys);
                }
                handleKeyAction(newKeys);
                return newKeys;
            });
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);
    return (
        <div>
            {/* <p className="title">操作画面</p> */}
            {/* <div>
                <img src={image} alt="icon" className="image-icon" />
            </div> */}
            <div>
                {imgUrl ? (
                    <img
                        src={imgUrl}
                        alt="UDP受信画像"
                        style={{
                            maxWidth: "80vw",
                            maxHeight: "50vh",
                            border: "1px solid #ccc",
                        }}
                    />
                ) : (
                    <img
                        src={image}
                        alt="icon"
                        className="image-icon"
                        ref={imageRef}
                    />
                )}
            </div>
            <div className="control-panel">
                <div className="control-container-top">
                    <div className="control-up-container">
                        <button
                            type="button"
                            className={`control-button control-up ${
                                activeKeys.includes("w") ? "active" : ""
                            }`}
                        >
                            ↑
                        </button>
                    </div>
                </div>
                <div className="control-container-middle">
                    <div className="control-left-right-container">
                        <button
                            type="button"
                            className={`control-button control-left ${
                                activeKeys.includes("a") ? "active" : ""
                            }`}
                        >
                            ←
                        </button>
                        <button
                            type="button"
                            className={`control-button control-right ${
                                activeKeys.includes("d") ? "active" : ""
                            }`}
                        >
                            →
                        </button>
                    </div>
                </div>
                <div className="control-container-bottom">
                    <div className="control-down-container">
                        <button
                            type="button"
                            className={`control-button control-down ${
                                activeKeys.includes("s") ? "active" : ""
                            }`}
                        >
                            ↓
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
