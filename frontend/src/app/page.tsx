import Presentation from "./components/Sections/Presentation";
import AboutMe from "./components/Sections/AboutMe";
import Skills from "./components/Sections/Skills";
import Projects from "./components/Sections/Projects";
import Experience from "./components/Sections/Experience";
import Contact from "./components/Sections/Contact";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center">
     <Presentation/>
     <AboutMe/>
     <Skills/>
     <Projects/>
     <Experience/>
     <Contact/>
     <Footer/>
    </div>
  );
}
