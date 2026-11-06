import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import ProjectPage from "./pages/ProjectPage";
import ScrollToHash from "./components/ScrollToHash";
import Starfield from "./components/layers/Starfield";
import Grain from "./components/layers/Grain";
import { QualityProvider } from "./components/QualityProvider";
import CustomCursor from "./components/layers/CustomCursor";

export default function App() {
  return (
    <BrowserRouter>
      {/* Nível de qualidade e preferência de movimento (Frente B) */}
      <QualityProvider>
        <ScrollToHash />

        {/* Camadas globais: estrelas atrás de tudo e grão por cima */}
        <Starfield />
        <Grain />
        <CustomCursor />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/projetos/:slug" element={<ProjectPage />} />
        </Routes>
      </QualityProvider>
    </BrowserRouter>
  );
}
