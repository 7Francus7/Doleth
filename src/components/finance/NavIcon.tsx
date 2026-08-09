import type { NavIconName } from "./navModel";

const paths: Record<NavIconName, React.ReactNode> = {
  home: <><path d="m4 10 8-6 8 6v9H4z" /><path d="M9 19v-6h6v6" /></>,
  activity: <><path d="M4 18V9M10 18V5M16 18v-7M22 18V7" /><path d="M3 18h19" /></>,
  calendar: <><rect height="16" rx="2" width="18" x="3" y="5" /><path d="M7 3v4M17 3v4M3 10h18" /></>,
  wallet: <><path d="M4 7h15a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13" /><path d="M16 12h5v4h-5a2 2 0 0 1 0-4Z" /></>,
  more: <><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></>,
  changes: <><path d="M4 15l5-5 4 4 7-7" /><path d="M20 7h-4M20 7v4" /></>,
  progress: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /></>,
  reality: <><circle cx="12" cy="12" r="8" /><path d="m15 9-2.5 5.5L7 17l2.5-5.5z" /></>,
  act: <><path d="M13 3 5 13h6l-1 8 8-10h-6z" /></>,
  investments: <><path d="M12 4a8 8 0 1 0 8 8h-8z" /><path d="M12 4v8h8" /></>,
  // Dos sentidos de cambio. Geométrico y sin relleno, como el resto: el ícono
  // orienta, no explica —eso lo hace la etiqueta "Moneda" que va al lado—.
  currency: <><path d="M4 9h13" /><path d="m14 6 3 3-3 3" /><path d="M20 15H7" /><path d="m10 12-3 3 3 3" /></>,
  // Algo que entra y se apoya: una flecha hacia abajo sobre una bandeja.
  import: <><path d="M12 4v10" /><path d="m8 11 4 4 4-4" /><path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" /></>,
  // Proporciones de un todo: tres barras de distinto peso, que es exactamente
  // lo que muestra la pantalla.
  spending: <><path d="M4 7h16" /><path d="M4 12h10" /><path d="M4 17h6" /></>,
  // Dos piezas que encajan: lo de afuera conectándose con lo de adentro.
  integrations: <><path d="M9 4v6a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V4" /><path d="M12 13v7" /><path d="M7 4h4M13 4h4" /></>,
};

export function NavIcon({ name }: { name: NavIconName }) {
  return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">{paths[name]}</svg>;
}
