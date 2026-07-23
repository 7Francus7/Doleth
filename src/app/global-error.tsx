"use client";

// Boundary de último recurso: se activa si falla el propio layout raíz, por lo
// que debe traer su propio <html>/<body> y no depende de estilos de la app.
// Sobrio, sin trazas ni detalles técnicos.

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "1.5rem",
          background: "#f7f5f1",
          color: "#303640",
          fontFamily: "'Manrope', system-ui, sans-serif",
        }}
      >
        <main style={{ width: "min(100%, 32rem)", textAlign: "center" }} role="alert">
          <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem", color: "#171a1f", lineHeight: 1.2 }}>
            Doleth no pudo cargar esta pantalla.
          </h1>
          <p style={{ margin: "0 0 1.5rem", fontSize: "1rem", lineHeight: 1.5 }}>
            Tus datos guardados siguen seguros. Podés intentar nuevamente.
          </p>
          <button
            onClick={reset}
            style={{
              minHeight: "3.5rem",
              padding: "0 1.25rem",
              border: "none",
              borderRadius: "1rem",
              background: "#184e47",
              color: "#f7f5f1",
              fontSize: "0.9375rem",
              fontWeight: 520,
              cursor: "pointer",
            }}
            type="button"
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
