import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import ScrollToHash from "./components/ScrollToHash";
import Starfield from "./components/layers/Starfield";
import Grain from "./components/layers/Grain";
import { ToastProvider } from "./components/layers/Toast";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ScrollToHash />

        {/* Camadas globais: estrelas atrás de tudo e grão por cima */}
        <Starfield />
        <Grain />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
