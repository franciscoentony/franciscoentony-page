import { lazy, Suspense } from "react";
import Navbar from "../components/Navbar";
import Universe from "../components/universe/Universe";
import About from "../components/About";
import Experience from "../components/Experience";
import BlogTeaser from "../components/BlogTeaser";
import Footer from "../components/Footer";
import { seo } from "../content/ui";
import { usePageMeta } from "../hooks/usePageMeta";

// Seções pesadas carregadas em arquivos JS separados (A3): o JS inicial
// fica menor e elas chegam logo depois, sem travar o carregamento.
const Skills = lazy(() => import("../components/Skills"));
const Projects = lazy(() => import("../components/Projects"));
const Contact = lazy(() => import("../components/Contact"));

/** Espaço reservado enquanto uma seção carregada sob demanda não chega. */
function SectionPlaceholder() {
  return <div aria-hidden="true" data-placeholder className="min-h-svh" />;
}

export default function Home() {
  usePageMeta(seo.homeTitle, seo.homeDescription);

  return (
    <div id="top">
      <Navbar />
      <main>
        <Universe />
        <About />
        <Suspense fallback={<SectionPlaceholder />}>
          <Skills />
        </Suspense>
        <Suspense fallback={<SectionPlaceholder />}>
          <Projects />
        </Suspense>
        <Experience />
        <BlogTeaser />
        <Suspense fallback={<SectionPlaceholder />}>
          <Contact />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
