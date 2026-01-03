"use client"
import React, { useRef, useEffect, useState } from "react";
import ProjectsCard from "../Projects/ProjectsCard";
import {
  animate,
  motion,
  MotionValue,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
} from "motion/react";

const left = "0%";
const right = "100%";
const leftInset = "10%";
const rightInset = "90%";
const transparent = "#00000027";
const opaque = "#000000";

function useScrollOverflowMask(scrollXProgress: MotionValue<number>) {
  const maskImage = useMotionValue(
    `linear-gradient(90deg, ${opaque}, ${opaque} ${left}, ${opaque} ${rightInset}, ${transparent})`
  );

  useMotionValueEvent(scrollXProgress, "change", (value) => {
    if (value === 0) {
      animate(maskImage, `linear-gradient(90deg, ${opaque}, ${opaque} ${left}, ${opaque} ${rightInset}, ${transparent})`);
    } else if (value === 1) {
      animate(maskImage, `linear-gradient(90deg, ${transparent}, ${opaque} ${leftInset}, ${opaque} ${right}, ${opaque})`);
    } else {
      animate(maskImage, `linear-gradient(90deg, ${transparent}, ${opaque} ${leftInset}, ${opaque} ${rightInset}, ${transparent})`);
    }
  });

  return maskImage;
}

function StyleSheet() {
  return (
    <style>{`
          #projects-container {
            width: 100%;
            position: relative;
          }

          #projects-container > ul {
              display: flex;
              list-style: none;
              height: auto;
              overflow-x: auto;
              padding: 40px 0;
              margin: 0 auto;
              gap: 1rem; 
              scrollbar-width: thin;
              scrollbar-color: var(--accent, #10b981) #00000033;
              scroll-snap-type: x mandatory;
              /* Padding lateral no ul ajuda o primeiro e último card a não colarem na borda */
              padding-left: 20px;
              padding-right: 20px;
          }

          #projects-container > ul > li {
            flex: 0 0;
            max-width: 400px;
            height: auto;
            background: transparent;
            scroll-snap-align: center;
            display: flex;
            justify-content: start;
          }

          @media (min-width: 1024px) {
            #projects-container > ul {
              overflow-x: visible;
              flex-wrap: wrap;
              justify-content: center;
              mask-image: none !important;
              -webkit-mask-image: none !important;
              scroll-snap-type: none;
              padding-left: 0;
              padding-right: 0;
              /* No desktop podemos aumentar o gap para dar mais ar ao layout */
              gap: 48px;
            }
            
            #projects-container > ul > li {
              flex: 0 1 auto;
              width: 100%;
              max-width: 400px;
            }
          }

          #projects-container > ul::-webkit-scrollbar { height: 6px; background: #fff1; }
          #projects-container > ul::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
  `}</style>
  );
}

export default function Projects() {
  const ref = useRef(null);
  const { scrollXProgress } = useScroll({ container: ref });
  const maskImage = useScrollOverflowMask(scrollXProgress);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkSize = () => setIsDesktop(window.innerWidth >= 1024);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const technologiesProject1 = [{name: "React"}, {name: "Javascript"}, {name: "Next.JS"}, {name: "Tailwindcss"}];
  const technologiesProject2 = [{name: "React"}, {name: "Next.JS"}, {name: "Node.JS"}, {name: "TypeScript"}, {name: "MySQL"}, {name: "Tailwindcss"}];
  const technologiesProject3 = [{name: "HTML"}, {name: "CSS"}, {name: "Javascript"}];

  return (
    <section className="w-full h-auto py-20 px-0 lg:py-30 overflow-hidden flex items-center justify-center bg-stone-950">
      <StyleSheet />
      <div className="w-full max-w-7xl flex flex-col gap-12 lg:gap-18 items-center">
        <div className="relative text-center">
          <h1 className="text-4xl font-semibold bg-linear-to-r to-neutral-900 from-slate-50 bg-clip-text text-transparent">
            Projetos
          </h1>
          <div className="bg-linear-to-r to-transparent from-stone-400  rounded-full w-30 h-1 relative mt-1"></div>
        </div>

        <div id="projects-container" className="w-full">
          <motion.ul 
            ref={ref} 
            style={{ maskImage: isDesktop ? "none" : maskImage }}
          >
            <li>
              <ProjectsCard title="Sistema de Gerenciamento de Eventos Insitucionais do IFRN" image="./images/SEI.png" description="Frontend da plataforma de gerenciamento de eventos da rede do IFRN com Dashboard, Tela de Cadastro/Login, Cadastro e Monitoramento de eventos." github="github.com" demo="" technologies={technologiesProject1}/>
            </li>
            <li>
              <ProjectsCard title="The Heroe's Journey" image="./images/the-heroes-journey.png" description="Plataforma de gameficação de skills e metas pessoas para evolução pessoal." github="https://github.com/franciscoentony/the-heroes-journey" demo="" technologies={technologiesProject2}/>
            </li>
            <li>
             <ProjectsCard title="Apresentação do Sistema Solar" image="./images/solar-system.png" description="Desenvolvido para estudo, esta aplicação frontend apresenta informações sobre o sistema solar." github="github.com" demo="" technologies={technologiesProject3}/> 
            </li>
          </motion.ul>
        </div>
      </div>
    </section>
  );
}