import React from "react";
import AboutMeCards from "../AboutMe/AboutMeCards";

export default function AboutMe() {
  return (
    <section className="w-full h-auto p-30 flex items-center justify-centers lg:p-32 py-12 px-6">
      <div className="w-full max-w-7xl flex flex-col lg:gap-20 justify-between items-center gap-12">
        <div className="">
          <h1 className="text-4xl font-semibold bg-linear-to-r to-neutral-600 from-slate-50 bg-clip-text text-transparent">
            Sobre Mim
          </h1>
          <div className="bg-linear-to-r to-transparent from-stone-400  rounded-full w-30 h-1"></div>
        </div>

        <div className="flex flex-col lg:flex-row w-full gap-20 items-center">
          <div className="flex flex-col gap-4 w-full">
            <p className="text-[15pt] font-medium">
              Apaixonado por tecnologia desde os 8 anos, o que começou como uma
              fantasia de criança rapidamente se transformou no meu propósito de
              vida.
            </p>

            <p className="text-stone-300 mt-4">
              Inspirado pela biologia, física, astronomia e grandes obras da
              ficção, transformei o hobby da pré-adolescência em uma jornada
              acadêmica e profissional. Cada hora de estudo não é apenas para
              interesse pessoal, mas um investimento para guiar minha geração a
              um futuro promissor, buscando entender profundamente como as
              tecnologias funcionam.
            </p>

            <p className="text-stone-300 mt-4">
              Hoje, aos 19 anos e cursando Sistemas para Internet no IFRN
              Canguaretama, sigo expandindo meus horizontes e liderando futuros
              cientistas. Atualmente, ministro minicursos para jovens que
              desejam ingressar na área, oferecendo o apoio e o incentivo que
              muitas vezes faltam no início da carreira tecnológica.
            </p>
          </div>
          <div className="flex flex-col gap-5 border-amber-300 w-full ">
            <AboutMeCards
              title={"Tecnologias"}
              icon="code"
              description="Trabalhando com tecnologias modernas e métodos atualizados."
            />
            <AboutMeCards
              title={"Experiência"}
              icon="briefcase"
              description="+ de 1 ano contribuindo para projetos da rede do IFRN."
            />
            <AboutMeCards
              title={"Aprendizado"}
              icon="graduation"
              description="Graduando em Sistemas para Internet pelo IFRN e Técnico em Informática para Internet pelo IMD/UFRN"
            />
          </div>
        </div>
        <div className="flex flex-col mt-20 gap-5">
          <p className="text-2xl lg:w-150 w-full">
          &#34;Eu posso não ter ido para onde eu pretendia ir, mas eu acho que
            acabei terminando onde eu pretendia estar.&#34;
          </p>
          <i className="w-full flex justify-end text-stone-400">
            - Douglas Adams, 1998
          </i>
        </div>
      </div>
    </section>
  );
}
