import React from "react";

interface Skill {
  name: string;
  level: number;
}

interface SkillCardProps {
  title: string;
  skills: Skill[];
}

export default function SkillCard({ title, skills }: SkillCardProps) {
  return (
    <div className="w-80 p-[.05rem] hover:scale-105  hover:shadow-[0_0_0_0.1rem_#0ada98] duration-400 ease-in-out  rounded-3xl bg-radial-[at_25%_25%] from-stone-100 to-stone-950 to-100%">
      <div className="w-full h-full rounded-3xl bg-radial-[at_25%_25%] from-stone-800 to-stone-950 to-100% p-5 flex flex-col items-center gap-5">
        <h1 className="text-[17pt] font-semibold text-start w-full text-stone-300">{title}</h1>
        <ul className="w-full flex flex-col gap-2">
          {skills.map((skill, index) => (
            <li key={index} className="">
              <div className="flex justify-between bg-linear-to-r to-transparent from-emerald-800  to-90% h-10 p-4 rounded-full items-center">
                <p>{skill.name}</p>
                {/*<span className="text-emerald-300">{skill.level}%</span>*/}
              </div>
              <div className="relative w-full">
                {/*<div className="bg-stone-800 w-[full] h-2 rounded-full absolute top-0 left-0"></div>*/}
                {/*<div
                  className="bg-linear-to-r from-[#022229f] to-emerald-500 h-2 rounded-full absolute top-0 left-0 transition-all duration-500"
                  style={{ width: `${skill.level}%` }}
                ></div>*/}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
