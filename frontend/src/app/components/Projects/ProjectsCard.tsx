import React from "react";
import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";

interface Techonologies {
  name: string;
}
interface Project {
  title: string;
  description: string;
  github: string,
  demo: string,
  technologies: Techonologies[];
  image: string;
}

export default function ProjectsCard({
  title,
  description,
  github,
  demo,
  technologies,
  image,
}: Project) {
  return (
    <div className="w-80 lg:w-100 p-[.05rem] hover:scale-105  hover:shadow-[0_0_0_0.1rem_#0ada98] duration-400 ease-in-out  rounded-3xl bg-radial-[at_25%_25%] from-stone-100 to-stone-950 to-100%">
      <div className="w-full h-full rounded-3xl bg-radial-[at_25%_25%] from-stone-800 overflow-hidden to-stone-950 to-100% p-5 flex flex-col justify-end items-center">
        <div className="overflow-hidden rounded-t-3xl relative bottom-6 w-80 lg:w-100 h-60 flex justify-center items-center">
          <Image
            src={image}
            alt="Foto"
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 100vw, 500px"
          />
        </div>
        <div className="h-[55%] flex flex-col gap-3 justify-between">
          <div className="flex flex-col gap-5">
            <p className="text-[15pt] w-full text-start text-semibold">{title}</p>
            <span className="text-stone-400">{description}</span>
            <ul className="flex flex-wrap gap-x-3 gap-y-3 w-full h-auto">
              {technologies.map((technologie, index) => (
                <li
                  key={index}
                  className="bg-emerald-900 flex cursor-default justify-center items-center h-7 px-4 rounded-full text-[10pt] hover:bg-emerald-700 duration-200 ease-in-out border border-transparent hover:border-emerald-300"
                >
                  {technologie.name}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full flex justify-start gap-5">
            <Link
              href={github}
              target="_blank"
              className="flex gap-1 items-center hover:text-emerald-400 relative duration-300 bottom-0 ease-in-out hover:bottom-1"
            >
              <FontAwesomeIcon icon={faGithub} className="w-5" />
              <p>GitHub</p>
            </Link>
            <Link
              href={demo}
              target="_blank"
              className="flex gap-1 items-center hover:text-emerald-400 relative duration-300 bottom-0 ease-in-out hover:bottom-1"
            >
              <FontAwesomeIcon
                icon={faArrowUpRightFromSquare}
                className="w-5"
              />
              <p>Demo</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
