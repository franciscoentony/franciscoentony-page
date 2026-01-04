import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck } from '@fortawesome/free-solid-svg-icons'

import GoBack from '../components/buttons/GoBack'

export default function page() {
  return (
    <div className='w-screen h-screen flex justify-center items-center bg-linear-to-bl from-stone-800 to-stone-950 '>
        <div className='rounded-3xl p-[0.1rem] bg-radial-[at_25%_25%] from-stone-100 to-stone-950 to-100%'>
            <div className="w-100 h-auto rounded-3xl flex flex-col items-center justify-between bg-radial-[at_25%_25%] from-stone-800 to-stone-950 to-100% p-5">
                <div className='w-10 h-10 p-1 rounded-full flex items-center justify-center bg-emerald-600 shadow-[0_0_2rem_0_#07b46995] '>
                    <FontAwesomeIcon icon={faCheck} className='w-5'/>
                </div>
                <div className="w-full flex flex-col m-10 items-center justify-center">
                    <h1 className='text-3xl font-bold'>Agradeço pelo contato!</h1>
                    <p>Mensagem enviada com sucesso.</p>
                </div>
                <GoBack/>
            </div>
        </div>
    </div>
  )
}
