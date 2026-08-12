import { ArrowRight, Bell, Building2, CalendarDays, ChevronRight, FileCheck2, HelpCircle, Landmark, LogIn, MapPin, Newspaper, Search, ShieldCheck, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'

const noticias = [
  {
    fecha: '12 agosto 2026',
    categoria: 'Servicios en línea',
    titulo: 'Solicita tus certificados de la Dirección de Obras en línea',
    texto: 'Ahora puedes iniciar tu solicitud, adjuntar antecedentes y consultar el estado de tu trámite desde cualquier lugar.',
    icon: FileCheck2,
  },
  {
    fecha: '08 agosto 2026',
    categoria: 'Información DOM',
    titulo: 'Nuevos canales para consultar el estado de tus solicitudes',
    texto: 'Mantente informado sobre el avance de tus trámites y recibe notificaciones en tu correo electrónico.',
    icon: Bell,
  },
  {
    fecha: '01 agosto 2026',
    categoria: 'Atención a vecinos',
    titulo: 'Información y orientación para trámites de la DOM',
    texto: 'Revisa requisitos, antecedentes y canales de atención antes de ingresar una solicitud.',
    icon: HelpCircle,
  },
]

export function PortalCiudadanoPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-dom-navy text-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="h-[82px] flex items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                <Landmark size={26} />
              </div>
              <div className="leading-tight">
                <div className="text-xs sm:text-sm tracking-wide text-blue-100">I. MUNICIPALIDAD DE DOÑIHUE</div>
                <div className="font-bold text-base sm:text-lg">DIRECCIÓN DE OBRAS</div>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <a href="#inicio" className="px-4 py-2 rounded-lg bg-white/10">Inicio</a>
              <a href="#tramites" className="px-4 py-2 rounded-lg hover:bg-white/10">Trámites</a>
              <a href="#noticias" className="px-4 py-2 rounded-lg hover:bg-white/10">Noticias</a>
              <a href="#ayuda" className="px-4 py-2 rounded-lg hover:bg-white/10">Ayuda</a>
            </nav>
            <Link to="/profesionales" className="shrink-0 flex items-center gap-2 rounded-lg border border-white/30 px-3 sm:px-4 py-2 text-sm font-semibold hover:bg-white/10">
              <UserRound size={17} />
              <span className="hidden sm:inline">Profesionales DOM</span>
              <span className="sm:hidden">Acceso DOM</span>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section id="inicio" className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-slate-100 border-b border-blue-100">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 lg:py-20 grid lg:grid-cols-[1.08fr_.92fr] gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 text-dom-navy px-3 py-1.5 text-sm font-semibold mb-5">
                <Building2 size={16} /> Portal Ciudadano · Dirección de Obras
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-dom-navy leading-tight">Trámites de la Dirección de Obras, <span className="text-blue-600">más simples y en línea.</span></h1>
              <p className="mt-5 text-lg text-slate-600 max-w-2xl leading-relaxed">Realiza tus solicitudes, consulta el estado de tus trámites y encuentra información útil de la Dirección de Obras Municipales de Doñihue.</p>
              <div id="tramites" className="mt-8 grid sm:grid-cols-2 gap-4 max-w-2xl">
                <Link to="/certificados-web" className="group bg-dom-navy text-white rounded-2xl p-5 shadow-lg shadow-blue-900/10 hover:-translate-y-0.5 transition">
                  <div className="flex items-start justify-between"><FileCheck2 size={28}/><ArrowRight size={20} className="opacity-70 group-hover:translate-x-1 transition"/></div>
                  <div className="mt-6 text-xl font-bold">Solicitar certificado</div>
                  <p className="mt-1 text-sm text-blue-100">Ingresa una nueva solicitud de certificado en línea.</p>
                </Link>
                <Link to="/consultar-solicitud" className="group bg-white border border-blue-200 text-dom-navy rounded-2xl p-5 shadow-sm hover:-translate-y-0.5 transition">
                  <div className="flex items-start justify-between"><Search size={28}/><ArrowRight size={20} className="opacity-50 group-hover:translate-x-1 transition"/></div>
                  <div className="mt-6 text-xl font-bold">Consultar solicitud</div>
                  <p className="mt-1 text-sm text-slate-500">Revisa el estado usando tu folio y RUT.</p>
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                <span className="flex items-center gap-2"><ShieldCheck size={17} className="text-green-600"/> Datos protegidos</span>
                <span className="flex items-center gap-2"><FileCheck2 size={17} className="text-blue-600"/> Seguimiento en línea</span>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -inset-8 bg-blue-200/30 blur-3xl rounded-full" />
              <div className="relative rounded-[2rem] bg-white border border-blue-100 shadow-xl p-7 max-w-xl ml-auto">
                <div className="flex items-center justify-between border-b pb-5">
                  <div><div className="text-sm text-slate-500">Portal Ciudadano</div><div className="text-xl font-bold text-dom-navy">Dirección de Obras</div></div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center"><Landmark size={27}/></div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <MiniCard icon={FileCheck2} title="Solicitar" text="Certificados en línea" />
                  <MiniCard icon={Search} title="Consultar" text="Estado de solicitud" />
                  <MiniCard icon={Newspaper} title="Noticias" text="Información DOM" />
                  <MiniCard icon={HelpCircle} title="Ayuda" text="Orientación al vecino" />
                </div>
                <div className="mt-5 rounded-xl bg-slate-50 border p-4 flex items-center gap-3 text-sm"><MapPin size={20} className="text-blue-700"/><span><b>Municipalidad de Doñihue</b><br/>Dirección de Obras Municipales</span></div>
              </div>
            </div>
          </div>
        </section>

        <section id="noticias" className="max-w-7xl mx-auto px-5 sm:px-8 py-14 lg:py-16">
          <div className="flex items-end justify-between gap-4 mb-7">
            <div><div className="text-sm font-bold uppercase tracking-wider text-blue-700">Mantente informado</div><h2 className="text-3xl font-bold text-dom-navy mt-1">Noticias de la Dirección de Obras</h2></div>
            <button className="hidden sm:flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900">Ver todas <ChevronRight size={17}/></button>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {noticias.map(({ fecha, categoria, titulo, texto, icon: Icon }) => (
              <article key={titulo} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition">
                <div className="h-2 bg-blue-700" />
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3 text-xs text-slate-500"><span className="font-semibold text-blue-700">{categoria}</span><span className="flex items-center gap-1"><CalendarDays size={13}/>{fecha}</span></div>
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mt-5"><Icon size={22}/></div>
                  <h3 className="text-lg font-bold text-dom-navy mt-4 leading-snug">{titulo}</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{texto}</p>
                  <button className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-blue-700">Leer noticia <ArrowRight size={16}/></button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="ayuda" className="bg-white border-y">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 grid md:grid-cols-3 gap-5">
            <InfoBlock icon={FileCheck2} title="Antes de solicitar" text="Revisa los antecedentes que necesitas y prepara tus documentos digitales." />
            <InfoBlock icon={Search} title="Seguimiento" text="Conserva tu folio de solicitud. Lo necesitarás junto con tu RUT para consultar." />
            <InfoBlock icon={HelpCircle} title="¿Necesitas ayuda?" text="Encuentra orientación sobre los trámites y canales de atención de la Dirección de Obras." />
          </div>
        </section>
      </main>

      <footer className="bg-dom-navy text-white mt-0">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 grid md:grid-cols-3 gap-8">
          <div><div className="font-bold text-lg">Dirección de Obras</div><div className="text-sm text-blue-100 mt-2">I. Municipalidad de Doñihue</div></div>
          <div><div className="font-semibold">Portal Ciudadano</div><div className="mt-2 space-y-1 text-sm text-blue-100"><Link className="block hover:text-white" to="/certificados-web">Solicitar certificado</Link><Link className="block hover:text-white" to="/consultar-solicitud">Consultar solicitud</Link></div></div>
          <div><div className="font-semibold">Acceso institucional</div><Link to="/profesionales" className="mt-2 inline-flex items-center gap-2 text-sm text-blue-100 hover:text-white"><LogIn size={16}/> Profesionales DOM</Link></div>
        </div>
        <div className="border-t border-white/10 text-center text-xs text-blue-200 py-4">Dirección de Obras Municipales · Municipalidad de Doñihue</div>
      </footer>
    </div>
  )
}

function MiniCard({ icon: Icon, title, text }: { icon: typeof FileCheck2; title: string; text: string }) {
  return <div className="rounded-xl border bg-slate-50 p-4"><Icon size={21} className="text-blue-700"/><div className="font-bold text-dom-navy mt-3">{title}</div><div className="text-xs text-slate-500 mt-1">{text}</div></div>
}

function InfoBlock({ icon: Icon, title, text }: { icon: typeof FileCheck2; title: string; text: string }) {
  return <div className="rounded-2xl border bg-slate-50 p-5 flex gap-4"><div className="w-11 h-11 rounded-xl bg-white border flex items-center justify-center text-blue-700 shrink-0"><Icon size={21}/></div><div><h3 className="font-bold text-dom-navy">{title}</h3><p className="text-sm text-slate-600 mt-1 leading-relaxed">{text}</p></div></div>
}
