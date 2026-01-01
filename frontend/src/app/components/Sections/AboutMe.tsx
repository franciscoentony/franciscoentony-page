import React from 'react'
import AboutMeCards from '../AboutMe/AboutMeCards'

export default function AboutMe() {
  return (
    <section className='w-full h-auto p-30 flex items-center justify-centers lg:p-32 py-12 px-6'>
        <div className="w-full max-w-7xl flex flex-col lg:gap-20 justify-between items-center gap-12">
            <div className="">
                <h1 className='text-4xl font-semibold bg-linear-to-r to-neutral-900 from-slate-50 bg-clip-text text-transparent'>Sobre Mim</h1>
                <div className="bg-linear-to-r to-transparent from-stone-400  rounded-full w-30 h-1"></div>
            </div>
            
            <div className="flex flex-col lg:flex-row w-full gap-20 items-center">
                <div className="flex flex-col gap-4 w-full">
                    <p className='text-[15pt]'>Sou um desenvolvedor de software com mais de 5 anos de experiência em construir aplicações web modernas e escaláveis. Minha paixão é transformar ideias complexas em soluções digitais elegantes e eficientes.</p>
                    <p className='text-stone-400'>Trabalho com tecnologias de ponta como React, TypeScript, Node.js e cloud computing. Acredito em código limpo, boas práticas e desenvolvimento ágil para entregar produtos de alta qualidade.</p>
                    <p className='text-stone-400'>Quando não estou programando, gosto de contribuir para projetos open source, aprender novas tecnologias e compartilhar conhecimento com a comunidade de desenvolvedores.</p>
                </div>
                <div className="flex flex-col gap-5 border-amber-300 w-full ">
                    <AboutMeCards title={"Clean Code"} icon="code" description='Código limpo, bem documentado e seguindo as melhores práticas de desenvolvimento.'/>
                    <AboutMeCards title={"Experiência"} icon="briefcase" description='5+ anos desenvolvendo soluções web para empresas de diversos segmentos.'/>
                    <AboutMeCards title={"Aprendizado"} icon="graduation" description='Sempre atualizado com as últimas tecnologias e tendências do mercado.'/>
                </div>
            </div>
        </div>
    </section>
  )
}
