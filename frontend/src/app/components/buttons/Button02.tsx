import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

const Button02 = () => {
  return (
    <button className="w-50 bg-emerald-700 hover:bg-emerald-500 cursor-pointer group/button relative inline-flex items-center justify-center overflow-hidden rounded-[1rem] backdrop-blur-lg px-10 py-2 text-base text-white transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-[0px_0px_3rem_#00ffae7f] border border-white/20 duration-300">
      <span className="text-[12pt]">Enviar</span>
      <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
        <div className="relative h-full w-10 bg-white/20" />
      </div>
      <div className="opacity-0 -translate-x-2 w-0 group-hover/button:w-6 group-hover/button:opacity-100 group-hover/button:translate-x-0 transition-all duration-300">
        <FontAwesomeIcon icon={faPaperPlane} className='w-4'/>
       </div>
    </button>
  );
}

export default Button02;

