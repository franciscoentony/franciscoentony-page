import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Início" },
  { to: "/blog", label: "Blog" },
  { to: "/#contato", label: "Contato" },
];

export default function Navbar() {
  return (
    <nav className="fixed top-5 left-1/2 z-20 -translate-x-1/2 flex gap-1 rounded-full border border-line bg-raised/70 p-1.5 backdrop-blur-md">
      {links.map((link) => (
        <NavLink
          key={link.label}
          to={link.to}
          className={({ isActive }) =>
            `rounded-full px-4 py-2 text-sm transition-colors ${
              isActive
                ? "bg-white/5 text-paper"
                : "text-secondary hover:text-paper hover:bg-white/5"
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
