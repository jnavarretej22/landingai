import Link from 'next/link';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';

const WS_NUMBER = "5930939667369"
const WS_MESSAGE = encodeURIComponent("Hola! Me interesa que diseñen mi página web profesional 🚀")
const WS_URL = `https://wa.me/${WS_NUMBER}?text=${WS_MESSAGE}`

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center text-white p-4 relative overflow-x-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 via-slate-950 to-emerald-900/40 pointer-events-none"></div>
      
      {/* Hero Content Wrapper */}
      <div className="flex-grow flex flex-col items-center justify-center z-10 text-center space-y-10 max-w-4xl mx-auto py-20 px-4">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-400 to-teal-400 leading-[1.1]">
          Crea la página web de tu negocio en minutos
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
          Solo cuéntanos de tu negocio. MiNegocioDigital genera el diseño con IA.
        </p>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <p className="relative text-white font-black tracking-widest uppercase text-base bg-slate-900 px-6 py-3 rounded-lg border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            CREAR Y OBTENER TU PROPIO SITIO WEB ES <span className="text-emerald-400">GRATIS</span>
          </p>
        </div>
        
        <div className="pt-4 w-full flex flex-col items-center gap-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-2xl">
            <Link 
              href="/builder"
              className="w-full md:w-auto group relative inline-flex items-center justify-center gap-2 bg-white text-slate-950 px-10 py-5 rounded-full font-bold text-xl hover:scale-105 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
            >
              Empieza a crear ahora
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>

            <a href={WS_URL} target="_blank" rel="noopener" className="w-full md:w-auto ws-pro-btn flex items-center justify-center gap-2 px-10 py-5 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all font-bold text-lg">
              <WhatsAppIcon size={24} />
              Nosotros Diseñamos por Ti
            </a>
          </div>
          <span className="text-slate-500 text-sm font-medium">Diseños manuales y avanzados disponibles por WhatsApp</span>
        </div>
      </div>

      {/* Decorative floating elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Footer */}
      <footer className="w-full text-center py-10 z-10 text-slate-500 text-sm font-medium border-t border-slate-900/50 mt-10">
        MiNegocioDigital · Powered by IA · {new Date().getFullYear()}
      </footer>
    </main>
  );
}
