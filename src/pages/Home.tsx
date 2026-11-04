import Navbar from "../components/Navbar";
import Universe from "../components/universe/Universe";
import About from "../components/About";
import Skills from "../components/Skills";
import Projects from "../components/Projects";
import Experience from "../components/Experience";
import BlogTeaser from "../components/BlogTeaser";
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import { seo } from "../content/ui";
import { usePageMeta } from "../hooks/usePageMeta";

export default function Home() {
  usePageMeta(seo.homeTitle, seo.homeDescription);

  return (
    <div id="top">
      <Navbar />
      <main>
        <Universe />
        <About />
        <Skills />
        <Projects />
        <Experience />
        <BlogTeaser />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
