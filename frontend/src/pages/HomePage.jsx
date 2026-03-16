import { useState } from 'react'

const siteData = {
  hero: {
    bgImage: import.meta.env.BASE_URL + 'teaching-2.jpg',
    title: 'Scott McBride Smith',
    subtitle:
      'Study piano online with Dr. Smith. Award-winning, nationally certified, and internationally respected. Personalized lessons from anywhere.',
    tagline: 'Cordelia Brown Murphy Professor of Piano Pedagogy',
    primaryAction: { label: 'My Work', href: '#my-work' },
    secondaryAction: { label: 'Lessons', href: '#lessons' },
  },
}

export function HomePage() {
  const [loaded, setLoaded] = useState(false)

  const fadeUp = (delay = 0) =>
    `transition-all duration-700 ease-out ${loaded ? `opacity-100 translate-y-0` : 'opacity-0 translate-y-4'}`

  const { hero } = siteData

  return (
    <div className="flex-1 flex flex-col">
      <img
        src={hero.bgImage}
        alt=""
        onLoad={() => setLoaded(true)}
        className={`fixed inset-0 -z-10 w-full h-[100dvh] object-cover brightness-60 object-[center_50%] md:object-[center_20%] transition-opacity duration-1000 ease-out ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div className="fixed inset-0 -z-[9] bg-gradient-to-b from-black/20 via-black/70 to-black pointer-events-none" />
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 py-10 md:py-16">
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center">
          <h1
            className={`font-serif text-3xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight text-white mb-4 ${fadeUp(
              0,
            )}`}
          >
            {hero.title}
          </h1>
          <div className={`mb-6 md:mb-8 text-center ${fadeUp(80)}`}>
            <p className="text-xs md:text-base tracking-[0.25em] uppercase text-amber-300/90">
              {hero.tagline}
            </p>
            <div className="mt-3 h-px w-32 md:w-40 mx-auto bg-amber-400/70" />
          </div>
          <p
            className={`max-w-xl text-xs md:text-sm lg:text-base text-neutral-100/90 leading-relaxed text-center px-1 md:px-2 ${fadeUp(
              120,
            )}`}
          >
            {hero.subtitle}
          </p>
          <div
            className={`mt-6 md:mt-8 w-full flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 ${fadeUp(
              180,
            )}`}
          >
            <a
              href={hero.primaryAction.href}
              className="w-[200px] md:w-auto min-w-[160px] px-5 py-2.5 border border-amber-400/80 text-amber-100 text-xs md:text-sm tracking-[0.25em] uppercase text-center bg-transparent transition hover:bg-amber-400/10 active:scale-[0.98]"
            >
              {hero.primaryAction.label}
            </a>
            <a
              href={hero.secondaryAction.href}
              className="w-[200px] md:w-auto min-w-[160px] px-5 py-2.5 border border-amber-400/40 text-amber-100/90 text-xs md:text-sm tracking-[0.25em] uppercase text-center bg-transparent transition hover:bg-white/5 active:scale-[0.98]"
            >
              {hero.secondaryAction.label}
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
