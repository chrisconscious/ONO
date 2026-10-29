"use client";

/**
 * Last-resort boundary used when the root layout itself fails. It must render
 * its own html and body and cannot rely on the application stylesheet.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f7f8fa",
          color: "#1f2430",
          fontFamily: "system-ui, sans-serif",
          padding: "1.5rem",
        }}
      >
        <main
          role="alert"
          style={{
            maxWidth: "32rem",
            border: "1px solid #dfe3ea",
            borderRadius: "0.75rem",
            background: "#ffffff",
            padding: "1.5rem",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "1.1rem" }}>
            ONO could not start this page
          </h1>
          <p style={{ margin: "0.6rem 0 1rem", fontSize: "0.9rem" }}>
            An unexpected application error occurred. Try again. If the problem
            continues, contact your administrator.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              border: 0,
              borderRadius: "0.5rem",
              background: "#4f46e5",
              color: "#ffffff",
              padding: "0.55rem 0.9rem",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
