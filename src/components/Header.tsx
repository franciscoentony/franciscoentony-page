import React from "react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="absolute top-5 w-full h-auto flex justify-center items-center">
      <nav className="h-20 py-5 px-5">
        <ul className="flex h-full justify-between items-center">
          <li className="hover:scale-110 duration-300 ease-in-out">
            <Link to="/" className="h-full duration-300 ease-in-out hover:bg-stone-800 border-2 border-transparent hover:border-stone-700 rounded-full py-3 px-5 hover:shadow-[0_0_1rem_0_#ffffff2a] text-lg">Início</Link>
          </li>
        <li className="hover:scale-110 duration-300 ease-in-out">
            <Link to="/blog" className="h-full duration-300 ease-in-out hover:bg-stone-800 border-2 border-transparent hover:border-stone-700 rounded-full py-3 px-5 hover:shadow-[0_0_1rem_0_#ffffff2a] text-lg">Blog</Link>
          </li>
          <li className="hover:scale-110 duration-300 ease-in-out">
            <Link to="#contato" className="h-full duration-300 ease-in-out hover:bg-stone-800 border-2 border-transparent hover:border-stone-700 rounded-full py-3 px-5 hover:shadow-[0_0_1rem_0_#ffffff2a] text-lg">Contato</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
