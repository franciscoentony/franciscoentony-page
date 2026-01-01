import React from "react";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCode, faBriefcase, faGraduationCap } from "@fortawesome/free-solid-svg-icons";

const iconMap: Record<string, IconDefinition> = {
    code: faCode,
    briefcase: faBriefcase,
    graduation: faGraduationCap,
  };
  
  interface AboutMeProps {
    title: string;
    description: string;
    icon: string;
  }

export default function AboutMeCards({ title, description, icon }: AboutMeProps) {
    const selectedIcon = iconMap[icon] || faCode;

  return (
    <div className="w-full lg:w-auto hover:scale-105 duration-400 p-[.05rem] rounded-[1.5rem] bg-radial-[at_25%_25%] from-stone-100 to-stone-950 to-100%">
        <div className="w-full lg:w-auto h-30 rounded-[1.5rem] bg-radial-[at_25%_25%] from-stone-800 to-stone-950 to-100% p-5 flex items-center gap-5">
            <div className="w-[4rem] h-[4rem] flex justify-center items-center rounded-2xl bg-[#003024]">
                <FontAwesomeIcon icon={selectedIcon} className="p-1 w-5 h-5 text-emerald-500" size="xl"/>
            </div>
            <div className="w-auto flex flex-col gap-1">
                <h1 className="text-[15pt] font-semibold">{title}</h1>
                <p className="text-stone-400 w-full lg:w-auto h-auto">
                    {description}
                </p>
            </div>
        </div>
    </div>
  );
}
