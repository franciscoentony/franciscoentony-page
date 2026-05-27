import React, { useState, useEffect } from "react";
import styled from "styled-components";
import SkillCard from "../Skills/SkillCard";

const HorizontalList = styled.ul`
  display: flex;
  list-style: none;
  height: auto;
  overflow-x: scroll;
  padding: 20px 0;
  margin: 0 auto;
  gap: 1rem;
  scrollbar-width: thin;
  scrollbar-color: var(--accent, #10b981) #00000033;
  mask-image: linear-gradient(to right, transparent, white 8%, white 92%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, white 8%, white 92%, transparent);

  &::-webkit-scrollbar {
    height: 5px;
    background: #fff3;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--accent, #10b981);
    border-radius: 1ex;
  }

  li * {
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }

  @media (min-width: 1024px) {
    overflow-x: visible;
    flex-wrap: wrap;
    justify-content: center;
    mask-image: none !important;
    -webkit-mask-image: none !important;

    li {
      flex: 0 1 auto;
      width: 100%;
      max-width: 400px;
    }
  }
`;

const frontendSkills = [
  { name: "React", level: 95 },
  { name: "TypeScript", level: 76 },
  { name: "Next.JS", level: 88 },
  { name: "Tailwindcss", level: 98 },
];

const backendSkills = [
  { name: "Node.JS", level: 87 },
  { name: "Python", level: 56 },
];

const othersSkills = [
  { name: "MySQL", level: 87 },
  { name: "Git e GitHub", level: 75 },
  { name: "Bibliotecas", level: 56 },
  { name: "Frameworks", level: 56 },
];

export default function Skills() {
  return (
    <section className="w-full h-auto overflow-hidden py-20 lg:py-30 flex items-center justify-center bg-linear-to-t from-stone-950 via-stone-900 to-stone-950 px-4">
      <div className="w-full max-w-7xl flex flex-col gap-12 lg:gap-18 items-center justify-center">
        <div>
          <h1 className="text-3xl lg:text-4xl font-semibold bg-linear-to-r to-neutral-600 from-slate-50 bg-clip-text text-transparent text-center">
            Habilidades
          </h1>
          <div className="bg-linear-to-r to-transparent from-stone-400 rounded-full w-30 h-1 relative mt-1"></div>
        </div>

        <div id="example" className="w-full relative">
          <HorizontalList>
            <li>
              <SkillCard title="Frontend" skills={frontendSkills} />
            </li>
            <li>
              <SkillCard title="Backend" skills={backendSkills} />
            </li>
            <li>
              <SkillCard title="Outros" skills={othersSkills} />
            </li>
          </HorizontalList>
        </div>
      </div>
    </section>
  );
}