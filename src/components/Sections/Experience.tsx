import React from 'react'
import ExperienceCard from '../Experience/ExperienceCard'

export default function Experience() {
  return (
    <section className="w-full h-auto bg-linear-to-b from-transparent to-stone-900 p-5 lg:p-30 flex items-center justify-center">
    <div className="w-full flex flex-col gap-18 justify-between items-center">
      <div className="">
          <h1 className="text-4xl font-semibold bg-linear-to-r to-neutral-600 from-slate-50 bg-clip-text text-transparent">
          Experiência 
          </h1>
          <div className="bg-linear-to-r to-transparent from-stone-400  rounded-full w-30 h-1 relative mt-1"></div>
        </div>
      <div className="flex flex-col w-full lg:w-auto lg:max-w-260 gap-5">
        <ExperienceCard title='Bolsa de Tutoria e Aprendizagem em Laboratório (TAL)' date={"2025 - 2026"} enterprise='Instituto Federal de Educação, Ciência e Tecnologia do Rio Grande do Norte' description='Orientador de Programação Orientada a Objetos em Java e Programação Estruturada em Python.'/>
        <ExperienceCard title='Engenheiro de Software FullStack' date={"2025 - presente"} enterprise='Núcleo de Inovação em Computação do IFRN (NIC)' description='Atuando como Engenheiro de Software nos projetos de maneira prática. Projetando, desenvolvendo e manténdo softwares, utilizo ferramentas como Python com o Framework Django e React.js para aplicações Back-End e Front-End.'/>
        {/*<ExperienceCard title='Desenvolvedor Full Stack Sênior' date={"2022 - presente"} enterprise='Tech Solutions' description='Liderança técnica de equipe, desenvolvimento de arquiteturas escaláveis e mentoria de desenvolvedores juniores.'/>*/}
      </div>
    </div>
  </section>
  )
}
