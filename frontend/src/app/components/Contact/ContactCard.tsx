import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faLocationDot, } from '@fortawesome/free-solid-svg-icons'
import { faGit, faGithub, faLinkedinIn } from '@fortawesome/free-brands-svg-icons'

interface ContactProps {
    contact: string,
    method: string,
}

const ICON_MAP: Record<string, any> = {
    Email: faEnvelope,
    Localização: faLocationDot,
    GitHub: faGithub,
    LinkedIn: faLinkedinIn,
}

export default function ContactCard({contact, method} : ContactProps) {
    const icon = ICON_MAP[contact] || faEnvelope
  return (
    <div className="w-100 p-[.05rem] rounded-[1.5rem] bg-radial-[at_25%_25%] from-stone-100 to-stone-950 to-100%">
        <div className='w-full h-full rounded-[1.5rem] bg-radial-[at_25%_25%] from-stone-800 to-stone-950 to-100% p-5 flex gap-5 items-center'>
            <div className="w-10 h-10 p-7 rounded-2xl bg-emerald-900 flex items-center justify-center">
                <FontAwesomeIcon icon={icon} className='w-7'/>
            </div>
            <div className="">
                <p className='text-stone-400 text-sm'>{contact}</p>
                <p>{method}</p>
            </div>
        </div>
    </div>
  )
}
