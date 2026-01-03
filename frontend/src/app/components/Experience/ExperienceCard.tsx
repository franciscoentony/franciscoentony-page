import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBriefcase } from '@fortawesome/free-solid-svg-icons'

interface InfoJobs {
    title: string,
    date: string,
    enterprise: string,
    description: string,
}

export default function ExperienceCard({title, date, enterprise, description} : InfoJobs) {
  return (
    <div className="w-full p-[.05rem] hover:scale-105  hover:shadow-[0_0_0_0.1rem_#0ada98] duration-400 ease-in-out shadow-2xl rounded-3xl bg-radial-[at_25%_25%] from-stone-100 to-stone-950 to-100%">
      <div className='flex flex-col lg:flex-row items-center w-full p-10 lg:gap-10 rounded-3xl bg-radial-[at_25%_25%] from-stone-800 to-stone-950 to-100%'>
          <div className="w-10 h-10 p-8 rounded-2xl bg-emerald-800 flex items-center justify-center">
            <FontAwesomeIcon icon={faBriefcase} size='xl'/>
          </div>
          <div className="w-full mt-7 lg:mt-0">
              <div className="flex md:flex-row flex-col mb-4 md:mb-3 justify-between">
                <div className="">
                  <h1 className='text-[15pt] font-semibold'>{title}</h1>
                  <span className='text-emerald-600'>{enterprise}</span>
                </div>
                  <span className='text-stone-300'>{date}</span>
              </div>
              <p>{description}</p>
          </div>
      </div>
    </div>
  )
}
