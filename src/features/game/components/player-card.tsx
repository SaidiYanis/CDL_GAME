import Image from "next/image";

interface PlayerCardProps {
  imageUrl: string;
  score: number;
}

export function PlayerCard({ imageUrl, score }: PlayerCardProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] bg-slate-900">
        <Image
          key={`${imageUrl}-${score}`}
          src={imageUrl}
          alt="Joueur CDL a deviner"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 480px"
          className="object-cover"
          unoptimized
        />
      </div>
    </section>
  );
}
