"use client";
import React, { useRef, useEffect, useState } from "react";
import SkillCard from "../Skills/SkillCard";
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
          #example {
            width: 100%;
            position: relative;
          }

          #example ul {
              display: flex;
              list-style: none;
              height: auto;
              overflow-x: scroll;
              padding: 20px 0;
              margin: 0 auto;
              gap: 1rem;
              scrollbar-width: thin;
              scrollbar-color: var(--accent, #10b981) #00000033;
          }

          #example li {
            
            height: auto;
          }

          /* COMPORTAMENTO LG (DESKTOP) */
          @media (min-width: 1024px) {
            #example ul {
              overflow-x: visible;
              flex-wrap: wrap;
              justify-content: center;
              mask-image: none !important;
              -webkit-mask-image: none !important;
            }
            
            #example li {
              flex: 0 1 auto; /* Permite que o card respire */
              width: 100%;
              max-width: 400px;
            }
          }

          #example li * { scrollbar-width: none; }
          #example li *::-webkit-scrollbar { display: none; }

          #example ::-webkit-scrollbar { height: 5px; background: #fff3; }
          #example ::-webkit-scrollbar-thumb { background: var(--accent, #10b981); border-radius: 1ex; }
  `}</style>
  );
}

export default function Skills() {
  const ref = useRef(null);
  const { scrollXProgress } = useScroll({ container: ref });
  const maskImage = useScrollOverflowMask(scrollXProgress);
  
  // Estado para detectar se é desktop e remover a maskImage do Framer Motion
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkSize = () => setIsDesktop(window.innerWidth >= 1024);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const frontendSkills = [
    { name: "React", level: 95 },
    { name: "TypeScript", level: 76 },
    { name: "Next.JS", level: 88 },
    { name: "Tailwindcss", level: 98 },
  ];
  const backendSkills = [
    { name: "Node.JS", level: 87 },
    { name: "Python", level: 56 },
    //{ name: "Java", level: 75 },
  ];
  const othersSkills = [
    { name: "MySQL", level: 87 },
    { name: "Git e GitHub", level: 75 },
    { name: "Bibliotecas", level: 56 },
    { name: "Frameworks", level: 56 },
  ];

  return (
    <section className="w-full h-auto overflow-hidden py-20 lg:py-30 flex items-center justify-center bg-linear-to-t from-stone-950 via-stone-900 to-stone-950 px-4">
      <StyleSheet />
      <div className="w-full max-w-7xl flex flex-col gap-12 lg:gap-18 items-center justify-center">
        <div>
          <h1 className="text-3xl lg:text-4xl font-semibold bg-linear-to-r to-neutral-600 from-slate-50 bg-clip-text text-transparent text-center">
            Habilidades
          </h1>
          <div className="bg-linear-to-r to-transparent from-stone-400  rounded-full w-30 h-1 relative mt-1"></div>
        </div>

        <div id="example">
          <motion.ul 
            ref={ref} 
            style={{ maskImage: isDesktop ? "none" : maskImage }}
          >
            <li>
              <SkillCard title="Frontend" skills={frontendSkills} />
            </li>
            <li>
              <SkillCard title="Backend" skills={backendSkills} />
            </li>
            <li>
              <SkillCard title="Outros" skills={othersSkills} />
            </li>
          </motion.ul>
        </div>
      </div>
    </section>
  );
}