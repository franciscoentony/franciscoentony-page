import React from 'react'
import ContactCard from '../Contact/ContactCard'


import Button02 from '../buttons/Button02'

export default function Contact() {
  return (
    <section className="w-full h-auto p-5 lg:p-30 flex items-center justify-center">
      <div className="w-full lg:w-250 mt-10 lg:mt-0 flex flex-col gap-18 items-center justify-center">
      <div className="w-auto lg:w-120 flex flex-col justify-center items-center">
          <h1 className=" text-4xl font-semibold bg-linear-to-r to-neutral-600 from-slate-50 bg-clip-text text-transparent w-[90%] text-center">
          Vamos Trabalhar Juntos
          </h1>
          <div className="bg-linear-to-r to-transparent from-stone-400  rounded-full w-50 h-1 mt-2 lg:mr-55"></div>
        </div>
        <div className="flex flex-col gap-5 md:flex-row w-full justify-between">
            <div className="flex flex-col gap-5">
            <ContactCard contact='Email' method='franciscoentonydev@gmail.com'/>
            <ContactCard contact='Localização' method='Natal-RN'/>
            <ContactCard contact='GitHub' method='github.com/franciscoentony'/>
            <ContactCard contact='LinkedIn' method='linkedin.com/in/franciscoentony/'/>
            </div>
            <div className="">
                <form action="https://formsubmit.co/franciscoentonydev@gmail.com" method='POST' className='w-full lg:w-100 p-[.05rem] rounded-3xl bg-radial-[at_25%_25%] from-stone-100 to-stone-950 to-100%'>
                  <div className="w-full rounded-3xl bg-radial-[at_25%_25%] from-stone-800 to-stone-950 to-100% p-5 flex flex-col gap-5 items-center">
                    <div className="w-full flex flex-col gap-2">
                        <label htmlFor="">Nome</label>
                        <input type="text" placeholder='Seu nome completo' className='w-full h-11 p-4 border-2 duration-200 border-transparent hover:border-white rounded-[.5rem] outline-transparent focus:outline-white focus:outline-2 bg-black' required name='name'/>
                    </div>
                    <div className="w-full flex flex-col gap-2">
                        <label htmlFor="">Email</label>
                        <input type="email" placeholder='seu@email.com' className='w-full h-11 p-4 border-2 duration-200 border-transparent hover:border-white rounded-[.5rem] outline-transparent focus:outline-white focus:outline-2 bg-black'required name='email'/>
                    </div>
                    <div className="w-full flex flex-col gap-2">
                        <label htmlFor="">Mensagem</label>
                        <textarea name="message" id="message" placeholder='Sua mensagem...' className='w-full text-start flex justify-start p-4 border-2 duration-200 border-transparent hover:border-white rounded-[.5rem] outline-transparent focus:outline-white focus:outline-2 bg-black' required></textarea>
                    </div>
                    <input type="hidden" name="_subject" value="Novo contato do Portfólio!" />
                    <input type="hidden" name="_captcha" value="false" />
                    <input type="hidden" name="_next" value="http://localhost:3000/thankyou"></input>
                    <Button02/>
                  </div>
                </form>
            </div>
        </div>
      </div>
    </section>
  )
}
