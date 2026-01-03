import React from 'react'
import ExperienceCard from '../Experience/ExperienceCard'

export default function Experience() {
  return (
    <section className="w-full h-auto bg-linear-to-b from-transparent to-stone-900 p-5 lg:p-30 flex items-center justify-center">
    <div className="w-full flex flex-col gap-18 justify-between items-center">
      <div className="">
          <h1 className="text-4xl font-semibold bg-linear-to-r to-neutral-900 from-slate-50 bg-clip-text text-transparent">
          Experiência 
          </h1>
          <div className="bg-linear-to-r to-transparent from-stone-400  rounded-full w-30 h-1 relative mt-1"></div>
        </div>
      <div className="flex flex-col w-full lg:w-auto gap-5">
        <ExperienceCard title='Bolsista Tal' date={"2025 - presente"} enterprise='Instituto Federal de Educação, Ciência e Tecnologia do Rio Grande do Norte' description='Orientador de Programação Orientada a Objetos em Java e Programação Estruturada em Python.'/>
        <ExperienceCard title='Desenvolvedor Frontend' date={"2025 - presente"} enterprise='Núcleo de Inovação em Computação - IFRN' description='Liderança na parte de frontend do projeto.'/>
        {/*<ExperienceCard title='Desenvolvedor Full Stack Sênior' date={"2022 - presente"} enterprise='Tech Solutions' description='Liderança técnica de equipe, desenvolvimento de arquiteturas escaláveis e mentoria de desenvolvedores juniores.'/>*/}
      </div>
    </div>
  </section>
  )
}
