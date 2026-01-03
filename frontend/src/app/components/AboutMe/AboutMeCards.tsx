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
    <div className="w-full lg:w-auto hover:scale-105  hover:shadow-[0_0_0_0.1rem_#0ada98] duration-400 ease-in-out p-[.05rem] rounded-3xl bg-radial-[at_25%_25%] from-stone-100 to-stone-950 to-100%">
        <div className="w-full lg:w-auto h-30 rounded-3xl bg-radial-[at_25%_25%] from-stone-800 to-stone-950 to-100% lg:p-5 px-5 py-20 flex items-center gap-5">
            <div className="w-30 h-13 lg:w-16 lg:h-16 flex justify-center items-center rounded-2xl bg-[#003024]">
                <FontAwesomeIcon icon={selectedIcon} className="p-1 w-5 h-5 text-emerald-500" size="xl"/>
            </div>
            <div className="w-auto max-w-60 lg:max-w-115 flex flex-col gap-1">
                <h1 className="text-[15pt] font-semibold">{title}</h1>
                <p className="text-stone-400 w-full lg:w-auto h-auto">
                    {description}
                </p>
            </div>
        </div>
    </div>
  );
}
