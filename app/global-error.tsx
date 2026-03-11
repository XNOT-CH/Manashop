"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: Readonly<{
    error: Error & { digest?: string };
    reset: () => void;
}>) {
    useEffect(() => {
        console.error("[global-error]", error);
    }, [error]);

    return (
        <html lang="th">
            <body
                style={{
                    margin: 0,
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "sans-serif",
                    background: "#0f0f0f",
                    color: "#f5f5f5",
                }}
            >
                <div style={{ textAlign: "center", padding: "2rem" }}>
                    <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                        เกิดข้อผิดพลาดร้ายแรง
                    </h1>
                    <p style={{ color: "#a1a1aa", marginBottom: "1.5rem" }}>
                        {error.message || "ระบบเกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง"}
                    </p>
                    {error.digest && (
                        <p
                            style={{
                                fontSize: "0.75rem",
                                color: "#71717a",
                                fontFamily: "monospace",
                                marginBottom: "1.5rem",
                            }}
                        >
                            รหัสข้อผิดพลาด: {error.digest}
                        </p>
                    )}
                    <button
                        onClick={reset}
                        style={{
                            padding: "0.5rem 1.5rem",
                            background: "#7c3aed",
                            color: "#fff",
                            border: "none",
                            borderRadius: "0.5rem",
                            cursor: "pointer",
                            fontSize: "1rem",
                        }}
                    >
                        ลองใหม่
                    </button>
                </div>
            </body>
        </html>
    );
}
