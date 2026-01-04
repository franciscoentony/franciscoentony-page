"use client";
import React from "react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faLinkedin, faLinkedinIn } from "@fortawesome/free-brands-svg-icons";
import { motion } from "motion/react";
import {
  faEnvelope,
  faFileDownload,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import Loader from "../Loader";

import Button01 from "../buttons/Button01";

export default function Presentation() {
  const [loading, setLoading] = useState(false);

  const handleDownload = () => {
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return (
<section className="w-full h-auto bg-linear-to-bl from-stone-800 to-stone-950 flex items-center justify-center overflow-hidden rounded-b-[3rem] py-12 px-4 md:px-10 lg:p-32">
      <div className="w-full max-w-7xl mt-7 lg:mt-0 flex flex-col lg:flex-row lg:gap-20 justify-between items-center gap-12 ">
        <div className="">
          <div className="w-full max-w-[450px] lg:max-w-none mx-auto md:p-8 lg:p-0 lg:border-none rounded-3xl flex flex-col gap-5 lg:text-left flex-1 order-2 lg:order-1">
            <div className="p-[0.05rem] w-70 lg:w-65 bg-linear-to-t from-blue-950 to-stone-400 rounded-full shadow-2xl">
              <span className="w-full flex items-center px-4 py-2 gap-2 bg-blue-950 rounded-full text-2x md:text-sm whitespace-nowrap">
                <FontAwesomeIcon icon={faStar} className="w-4" />
                Disponível para novos projetos
              </span>
            </div>
            <p className="text-emerald-400">Hello World, eu sou</p>
            <h1 className="text-6xl font-bold">Entony!</h1>
            <h2 className="w-full text-[16pt] text-neutral-400">
              Desenvolvedor de Software & Estudante de Sistemas para Internet no IFRN
            </h2>
            <p className="max-w-lg text-base md:text-[14pt] leading-relaxed text-stone-300">
              Construindo sistemas hoje, projetando o futuro da tecnologia amanhã.
            </p>
            <div className="flex flex-col lg:flex-row justify-center lg:justify-start gap-4 w-full">
              <Button01 Link="#projects"/>
              <Link href={"https://www.linkedin.com/in/franciscoentony/"} target="_blank"
                className="bg-white hover:bg-neutral-300 h-14 lg:h-auto hover:-translate-y-1 group relative duration-200 focus:shadow-[0px_0px_0px_6px_#ffffff5d] text-neutral-900 py-3 px-6 rounded-[0.9rem] flex items-center justify-center gap-2 cursor-pointer font-semibold text-sm md:text-[11pt] transition-all"
                onClick={handleDownload}
              >
                {loading ? (
                  <Loader />
                ) : (
                  <>
                    <div className="opacity-0 -translate-x-2 w-0 group-hover:w-6 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ">
                      <FontAwesomeIcon icon={faLinkedin} size="xl" />
                    </div>
                    <span>Acessar LinkedIn</span>
                  </>
                )}
              </Link>
            </div>
            <div className="w-auto mt-5 lg:mt-0 flex gap-4 items-center justify-start">
              <Link href={"https://github.com/franciscoentony"} target="_blank" className="hover:text-emerald-500 relative bottom-0 hover:bottom-1 duration-200 ease-in-out">
                <FontAwesomeIcon icon={faGithub} size="2xl" />
              </Link>
              <Link href={"https://www.linkedin.com/in/franciscoentony/"} target="_blank" className="hover:text-emerald-500 relative bottom-0 hover:bottom-1 duration-200 ease-in-out">
                <FontAwesomeIcon icon={faLinkedinIn} size="2xl" />
              </Link>
              <Link href={"mailto:francisoentonydev@gmail.com"} target="_blank" className="hover:text-emerald-500 relative bottom-0 hover:bottom-1 duration-200 ease-in-out">
                <FontAwesomeIcon icon={faEnvelope} size="2xl" />
              </Link>
            </div>
          </div>
        </div>
        <motion.div 
        initial={{ right: "-40rem", opacity: 0 }}
        animate={{ right: "0", opacity: 1 }}
        transition={{ duration: 2 }}
        className="relative top-7 w-full max-w-md lg:max-w-lg h-[400px] lg:h-[550px] overflow-hidden rounded-4xl shadow-2xl order-1 lg:order-2">
          <Image
            src="./images/avatar.JPG"
            alt="Foto"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 500px"
          />
        </motion.div>
      </div>
    </section>
  );
}
