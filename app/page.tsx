import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 via-slate-950 to-emerald-900/40 pointer-events-none"></div>
      
      <div className="z-10 text-center space-y-8 max-w-4xl mx-auto">
        <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/50 backdrop-blur-sm text-sm text-slate-300 font-medium">
          ✨ El futuro del diseño web está aquí
        </div>
        
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-400 to-teal-400">
          LandingAI
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
          Describe tu visión y desata el poder de la IA para generar hermosas landing pages de alta conversión en segundos. Sin necesidad de programar.
        </p>
        
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/builder"
            className="group relative inline-flex items-center justify-center gap-2 bg-white text-slate-950 px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)]"
          >
            Empieza a crear ahora
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
          <a href="#features" className="px-8 py-4 rounded-full font-bold text-lg text-slate-300 hover:text-white transition-colors">
            Aprende más
          </a>
        </div>
      </div>

      {/* Decorative floating elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>
    </main>
  );
}
