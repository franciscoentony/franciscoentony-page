import React from 'react';
import Link from 'next/link';

const GoBack = () => {
  return (
    <Link href={"/"} className="bg-white shadow-[0_0_2rem_0_#ffffff8a] text-center w-30 cursor-pointer flex justify-center items-center rounded-2xl h-10 relative text-black font-semibold group" type="button">
      <div className="bg-emerald-600 shadow-[0_0_5rem_0_#07b469] rounded-xl h-9 w-1/4 flex items-center justify-center absolute left-1 top-[2px] group-hover:w-28 z-10 duration-500">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" height="20px" width="20px">
          <path d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z" fill="white" />
          <path d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z" fill="white" />
        </svg>
      </div>
      <p className="translate-x-2">Voltar</p>
    </Link>
  );
}

export default GoBack;
