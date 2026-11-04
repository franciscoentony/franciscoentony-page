import { useState } from "react";
import { player } from "../../content/ui";
import HoloCard from "../ui/HoloCard";
import Portrait from "./Portrait";

/** Ficha holográfica do Player 1: foto, nome, classe e atributos. */
export default function CharacterCard() {
  const [active, setActive] = useState(false);
  const card = player.card;

  return (
    <HoloCard
      className="mx-auto aspect-5/7 w-[min(380px,100%)]"
      innerClassName="flex flex-col p-5.5"
      onActiveChange={setActive}
    >
      <div className="flex items-baseline justify-between font-mono text-[11px] tracking-[0.06em] text-secondary">
        <span>{card.header}</span>
        <b className="font-dot text-[22px] font-black tracking-normal text-gold">{card.level}</b>
      </div>

      <Portrait cardActive={active} />

      <p className="text-2xl font-semibold tracking-[-0.03em]">{card.name}</p>
      <p className="mt-0.5 text-[13px] text-secondary">{card.className}</p>

      <dl className="mt-4 grid grid-cols-4 gap-2 border-t border-line pt-3.5">
        {card.attributes.map((attribute) => (
          <div
            key={attribute.label}
            className="flex flex-col-reverse font-mono text-[10px] tracking-[0.04em] text-secondary"
          >
            <dt>{attribute.label}</dt>
            <dd className="font-dot text-xl font-black tracking-normal text-paper">
              {attribute.value}
            </dd>
          </div>
        ))}
      </dl>
    </HoloCard>
  );
}
