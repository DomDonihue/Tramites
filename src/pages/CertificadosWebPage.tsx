import { useEffect, useMemo, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Home,
  Lock,
  Search,
  ShieldCheck,
  Upload,
  X
} from 'lucide-react'
import { TIPO_CERT_LABELS, TipoCertificado } from '../types'

const SUBMIT_URL =
  import.meta.env.VITE_CERTIFICADOS_WEB_SUBMIT_URL as string | undefined

const QUERY_URL =
  import.meta.env.VITE_CERTIFICADOS_WEB_QUERY_URL as string | undefined

const CATALOGO_URL =
  import.meta.env.VITE_CERTIFICADOS_WEB_CATALOGO_URL as string | undefined

type Mode = 'solicitar' | 'consultar'

type CatalogoCertificado = {
  tipo: TipoCertificado
  nombre: string
  descripcion: string
  valor: number | null
  plazo: string
  activo: boolean
  orden: number
}

type FormState = {
  certificados: TipoCertificado[]
  otrosDescripcion: string
  nombre: string
  rut: string
  email: string
  telefono: string
  rolAvaluo: string
  propietario: string
  direccion: string
  numeroDomicilio: string
  localidad: string
  urbanoRural: 'URBANO' | 'RURAL'
  observaciones: string
  aceptaDatos: boolean
  archivos: File[]
}

function money(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(value)
}

function emptyForm(): FormState {
  return {
    certificados: [],
    otrosDescripcion: '',
    nombre: '',
    rut: '',
    email: '',
    telefono: '',
    rolAvaluo: '',
    propietario: '',
    direccion: '',
    numeroDomicilio: '',
    localidad: '',
    urbanoRural: 'URBANO',
    observaciones: '',
    aceptaDatos: false,
    archivos: []
  }
}

function formatRut(value: string) {
  const raw = value
    .replace(/[^0-9kK]/g, '')
    .toUpperCase()

  if (raw.length < 2) {
    return raw
  }

  const cuerpo = raw
    .slice(0, -1)
    .replace(/\D/g, '')

  const dv = raw.slice(-1)

  return `${cuerpo.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    '.'
  )}-${dv}`
}

async function fileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      resolve(
        String(reader.result).split(',')[1] ?? ''
      )
    }

    reader.onerror = reject

    reader.readAsDataURL(file)
  })
}

/*
============================================================
PÁGINA PRINCIPAL
============================================================
*/

export function CertificadosWebPage() {
  const location = useLocation()

  const mode: Mode =
    location.pathname.includes('consultar-solicitud')
      ? 'consultar'
      : 'solicitar'

  const [step, setStep] = useState(1)

  const [form, setForm] =
    useState<FormState>(emptyForm())

  /*
  ============================================================
  CATÁLOGO DE CERTIFICADOS
  ============================================================
  */

  const [catalogo, setCatalogo] =
    useState<CatalogoCertificado[]>([])

  const [loadingCatalogo, setLoadingCatalogo] =
    useState(false)

  /*
  ============================================================
  CONSULTA
  ============================================================
  */

  const [folio, setFolio] = useState('')

  const [rutConsulta, setRutConsulta] =
    useState('')

  const [consulta, setConsulta] =
    useState<any | null>(null)

  /*
  ============================================================
  ESTADOS GENERALES
  ============================================================
  */

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState(false)

  /*
  ============================================================
  CARGAR CATÁLOGO DESDE SHAREPOINT
  ============================================================
  */

  useEffect(() => {
    if (mode !== 'solicitar') {
      return
    }

    const cargarCatalogo = async () => {
      setLoadingCatalogo(true)
      setError('')

      if (!CATALOGO_URL) {
        setError(
          'Falta configurar VITE_CERTIFICADOS_WEB_CATALOGO_URL en el archivo .env.'
        )

        setLoadingCatalogo(false)
        return
      }

      try {
        const response = await fetch(
          CATALOGO_URL,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json'
            }
          }
        )

        if (!response.ok) {
          throw new Error(
            'No fue posible obtener el catálogo de certificados desde SharePoint.'
          )
        }

        const data =
          await response.json()

        /*
        Permite que Power Automate devuelva:

        [
          {...},
          {...}
        ]

        o:

        {
          "value": [...]
        }

        o:

        {
          "items": [...]
        }

        o:

        {
          "certificados": [...]
        }
        */

        const items = Array.isArray(data)
          ? data
          : data?.certificados ??
            data?.items ??
            data?.value ??
            []

        const certificados: CatalogoCertificado[] =
          items
            .map((item: any) => {
              const valorRaw =
                item.valor ??
                item.Valor ??
                item.precio ??
                item.Precio ??
                null

              let valor: number | null = null

              if (
                valorRaw !== null &&
                valorRaw !== undefined &&
                valorRaw !== ''
              ) {
                if (
                  typeof valorRaw ===
                  'number'
                ) {
                  valor = valorRaw
                } else {
                  const numero = Number(
                    String(valorRaw)
                      .replace(/\$/g, '')
                      .replace(/\./g, '')
                      .replace(',', '.')
                      .trim()
                  )

                  valor = Number.isNaN(
                    numero
                  )
                    ? null
                    : numero
                }
              }

              const activoRaw =
                item.activo ??
                item.Activo ??
                true

              const activo =
                activoRaw === true ||
                String(
                  activoRaw
                ).toLowerCase() ===
                  'true' ||
                String(
                  activoRaw
                ).toLowerCase() ===
                  'sí' ||
                String(
                  activoRaw
                ).toLowerCase() ===
                  'si'

              const ordenRaw =
                item.orden ??
                item.Orden ??
                9999

              const orden =
                Number(ordenRaw)

              return {
                tipo:
                  item.tipo ??
                  item.Tipo ??
                  item.TipoCertificado,

                nombre:
                  item.nombre ??
                  item.Nombre ??
                  item.Titulo ??
                  item.Título ??
                  item.Title ??
                  '',

                descripcion:
                  item.descripcion ??
                  item.Descripcion ??
                  item.Descripción ??
                  '',

                valor,

                plazo:
                  item.plazo ??
                  item.Plazo ??
                  '',

                activo,

                orden: Number.isNaN(
                  orden
                )
                  ? 9999
                  : orden
              }
            })
            .filter(
              (
                item: CatalogoCertificado
              ) =>
                item.tipo &&
                item.activo
            )
            .sort(
              (
                a: CatalogoCertificado,
                b: CatalogoCertificado
              ) =>
                a.orden - b.orden
            )

        setCatalogo(certificados)
      } catch (e: any) {
        setError(
          e?.message ??
            'No fue posible cargar los certificados disponibles.'
        )
      } finally {
        setLoadingCatalogo(false)
      }
    }

    cargarCatalogo()
  }, [mode])

  /*
  ============================================================
  CERTIFICADOS SELECCIONADOS
  ============================================================
  */

  const certificadosSeleccionados =
    useMemo(() => {
      return catalogo.filter(cert =>
        form.certificados.includes(
          cert.tipo
        )
      )
    }, [
      catalogo,
      form.certificados
    ])

  /*
  ============================================================
  CALCULAR TOTAL
  ============================================================
  */

  const total = useMemo(() => {
    return form.certificados.reduce(
      (sum, tipo) => {
        const certificado =
          catalogo.find(
            cert =>
              cert.tipo === tipo
          )

        return (
          sum +
          (certificado?.valor ?? 0)
        )
      },
      0
    )
  }, [
    form.certificados,
    catalogo
  ])

  /*
  ============================================================
  SELECCIONAR CERTIFICADO
  ============================================================
  */

  const toggleCert = (
    tipo: TipoCertificado
  ) => {
    setForm(current => ({
      ...current,

      certificados:
        current.certificados.includes(
          tipo
        )
          ? current.certificados.filter(
              x => x !== tipo
            )
          : [
              ...current.certificados,
              tipo
            ]
    }))
  }

  /*
  ============================================================
  ENVIAR SOLICITUD
  ============================================================
  */

  const submit = async () => {
    setError('')

    if (!SUBMIT_URL) {
      setError(
        'El portal ciudadano está listo, pero falta configurar VITE_CERTIFICADOS_WEB_SUBMIT_URL.'
      )

      return
    }

    if (!form.aceptaDatos) {
      setError(
        'Debe autorizar el tratamiento de sus datos personales.'
      )

      return
    }

    setLoading(true)

    try {
      /*
      Convertir archivos
      */

      const archivos =
        await Promise.all(
          form.archivos.map(
            async file => ({
              nombre: file.name,
              tipo: file.type,
              tamano: file.size,
              contenidoBase64:
                await fileAsBase64(
                  file
                )
            })
          )
        )

      /*
      Detalle completo del catálogo
      */

      const certificadosDetalle =
        certificadosSeleccionados.map(
          cert => ({
            tipo: cert.tipo,

            nombre:
              cert.nombre ||
              TIPO_CERT_LABELS[
                cert.tipo
              ] ||
              cert.tipo,

            descripcion:
              cert.descripcion,

            valor: cert.valor,

            plazo: cert.plazo,

            orden: cert.orden
          })
        )

      /*
      Payload final
      */

      const payload = {
        ...form,

        certificados:
          form.certificados,

        certificadosDetalle,

        total,

        archivos,

        fechaIngreso:
          new Date().toISOString(),

        aceptaDatos: true
      }

      const response =
        await fetch(
          SUBMIT_URL,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify(
              payload
            )
          }
        )

      if (!response.ok) {
        throw new Error(
          'No fue posible registrar la solicitud.'
        )
      }

      const data =
        await response
          .json()
          .catch(() => ({}))

      setFolio(
        data.folioSolicitud ??
          data.folio ??
          ''
      )

      setSuccess(true)

      setStep(6)
    } catch (e: any) {
      setError(
        e?.message ??
          'Ocurrió un error al enviar la solicitud.'
      )
    } finally {
      setLoading(false)
    }
  }

  /*
  ============================================================
  CONSULTAR SOLICITUD
  ============================================================
  */

  const consultar = async () => {
    setError('')

    setConsulta(null)

    if (!QUERY_URL) {
      setError(
        'Falta configurar VITE_CERTIFICADOS_WEB_QUERY_URL.'
      )

      return
    }

    if (
      !folio.trim() ||
      !rutConsulta.trim()
    ) {
      setError(
        'Ingresa el número de solicitud y el RUT.'
      )

      return
    }

    setLoading(true)

    try {
      const response =
        await fetch(
          `${QUERY_URL}?folio=${encodeURIComponent(
            folio.trim()
          )}&rut=${encodeURIComponent(
            rutConsulta.trim()
          )}`,
          {
            headers: {
              Accept:
                'application/json'
            }
          }
        )

      if (!response.ok) {
        throw new Error(
          'No encontramos una solicitud con esos datos.'
        )
      }

      setConsulta(
        await response.json()
      )
    } catch (e: any) {
      setError(
        e?.message ??
          'No fue posible consultar la solicitud.'
      )
    } finally {
      setLoading(false)
    }
  }

  /*
  ============================================================
  MODO CONSULTAR
  ============================================================
  */

  if (mode === 'consultar') {
    return (
      <CitizenShell active="consultar">

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

          <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-3xl border border-blue-100 p-8 mb-8">

            <div className="flex items-center gap-3 text-dom-navy mb-3">

              <Search size={28} />

              <h1 className="text-3xl font-bold">
                Consultar estado de solicitud
              </h1>

            </div>

            <p className="text-slate-600">
              Ingrese el número de solicitud y su RUT para conocer el estado de su trámite.
            </p>

          </div>

          <div className="grid lg:grid-cols-[420px_1fr] gap-8">

            <div className="bg-white border rounded-2xl p-7 shadow-sm">

              <h2 className="text-xl font-bold text-dom-navy mb-6">
                1. Ingrese los datos de su solicitud
              </h2>

              <label className="block text-sm font-semibold mb-2">
                Número de solicitud *
              </label>

              <input
                value={folio}
                onChange={e =>
                  setFolio(
                    e.target.value.toUpperCase()
                  )
                }
                placeholder="Ej: CERT-WEB-2026-000589"
                className="w-full border rounded-xl px-4 py-3 mb-5 outline-none focus:ring-2 focus:ring-blue-200"
              />

              <label className="block text-sm font-semibold mb-2">
                RUT del solicitante *
              </label>

              <input
                value={rutConsulta}
                onChange={e =>
                  setRutConsulta(
                    formatRut(
                      e.target.value
                    )
                  )
                }
                placeholder="Ej: 12.345.678-9"
                className="w-full border rounded-xl px-4 py-3 mb-5 outline-none focus:ring-2 focus:ring-blue-200"
              />

              <button
                disabled={loading}
                onClick={consultar}
                className="w-full bg-dom-navy text-white rounded-xl py-3.5 font-semibold flex justify-center gap-2 items-center disabled:opacity-50"
              >
                <Search size={18} />

                {loading
                  ? 'Consultando...'
                  : 'Consultar solicitud'}
              </button>

              {error && (
                <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-xl p-3">
                  {error}
                </p>
              )}

              <div className="mt-6 text-xs text-slate-500 flex gap-2">
                <Lock size={15} />

                Tus datos están protegidos y se utilizan solo para identificar tu solicitud.
              </div>

            </div>

            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden min-h-[360px]">

              {!consulta ? (
                <div className="h-full flex items-center justify-center text-slate-400 p-10 text-center">

                  <div>

                    <FileText
                      size={44}
                      className="mx-auto mb-3 opacity-50"
                    />

                    <p>
                      Ingresa tus datos para consultar el estado.
                    </p>

                  </div>

                </div>
              ) : (
                <StatusCard data={consulta} />
              )}

            </div>

          </div>

        </section>

      </CitizenShell>
    )
  }

  /*
  ============================================================
  MODO SOLICITAR
  ============================================================
  */

  return (
    <CitizenShell active="solicitar">

      <section className="bg-gradient-to-r from-blue-50 via-slate-50 to-white border-b">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-between gap-8">

          <div>

            <h1 className="text-3xl font-bold text-dom-navy">
              Solicitud de Certificados en Línea
            </h1>

            <p className="mt-2 text-slate-600 max-w-2xl">
              Seleccione el certificado que necesita, complete el formulario, adjunte los documentos requeridos y realice su solicitud.
            </p>

          </div>

          <div className="hidden md:flex gap-5 text-sm text-slate-600">

            <div className="flex gap-2 items-center">

              <Lock
                size={20}
                className="text-dom-navy"
              />

              Trámite 100% en línea

            </div>

            <div className="flex gap-2 items-center">

              <ShieldCheck
                size={20}
                className="text-dom-navy"
              />

              Seguro y confiable

            </div>

          </div>

        </div>

      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        <div className="grid xl:grid-cols-[1fr_560px] gap-8">

          <div>

            <h2 className="text-xl font-bold text-dom-navy mb-5">
              1. Seleccione el certificado que desea solicitar
            </h2>

            {loadingCatalogo && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-blue-800 mb-5">
                Cargando certificados disponibles...
              </div>
            )}

            {!loadingCatalogo &&
              catalogo.length === 0 &&
              !error && (
                <div className="bg-slate-50 border rounded-2xl p-6 text-slate-600">
                  No hay certificados disponibles en este momento.
                </div>
              )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {catalogo.map(
                cert => {

                  const seleccionado =
                    form.certificados.includes(
                      cert.tipo
                    )

                  const nombre =
                    cert.nombre ||
                    TIPO_CERT_LABELS[
                      cert.tipo
                    ] ||
                    cert.tipo

                  return (
                    <button
                      key={cert.tipo}
                      type="button"
                      onClick={() =>
                        toggleCert(
                          cert.tipo
                        )
                      }
                      className={`text-left bg-white border rounded-2xl p-5 transition shadow-sm hover:shadow-md ${
                        seleccionado
                          ? 'border-green-500 ring-2 ring-green-100'
                          : 'border-slate-200'
                      }`}
                    >

                      <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-dom-navy mb-3">
                        <Home size={21} />
                      </div>

                      <h3 className="font-bold text-slate-900 leading-tight">
                        Certificado de {nombre}
                      </h3>

                      <p className="text-sm text-slate-600 mt-2 min-h-[56px]">
                        {cert.descripcion ||
                          'Certificado emitido por la Dirección de Obras Municipales.'}
                      </p>

                      <div className="mt-3 font-bold text-green-700">

                        {cert.valor === null
                          ? 'Valor: Según solicitud'
                          : `Valor: ${money(
                              cert.valor
                            )}`}

                      </div>

                      <div className="mt-2 text-xs text-slate-500">

                        <strong>
                          Plazo:
                        </strong>{' '}

                        {cert.plazo ||
                          'Según tramitación'}

                      </div>

                      <div
                        className={`mt-3 text-center rounded-lg py-2 text-sm font-semibold ${
                          seleccionado
                            ? 'bg-green-600 text-white'
                            : 'bg-dom-navy text-white'
                        }`}
                      >
                        {seleccionado
                          ? 'Seleccionado ✓'
                          : 'Seleccionar'}
                      </div>

                    </button>
                  )
                }
              )}

            </div>

            {form.certificados.includes(
              'OTROS'
            ) && (
              <input
                value={
                  form.otrosDescripcion
                }
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    otrosDescripcion:
                      e.target.value
                  }))
                }
                placeholder="Indique qué certificado necesita"
                className="mt-4 w-full border rounded-xl px-4 py-3"
              />
            )}

          </div>

          <div className="bg-white border rounded-2xl shadow-sm p-6 xl:sticky xl:top-4 h-fit">

            <StepBar
              step={
                success
                  ? 6
                  : step
              }
            />

            {success ? (
              <Success folio={folio} />
            ) : (
              <>

                {step === 1 && (
                  <SelectionSummary
                    selected={
                      form.certificados
                    }
                    selectedCatalogo={
                      certificadosSeleccionados
                    }
                    total={total}
                    onNext={() => {

                      if (
                        !form.certificados.length
                      ) {
                        setError(
                          'Seleccione al menos un certificado.'
                        )

                        return
                      }

                      setError('')
                      setStep(2)
                    }}
                  />
                )}

                {step === 2 && (
                  <ApplicantStep
                    form={form}
                    setForm={setForm}
                    onBack={() =>
                      setStep(1)
                    }
                    onNext={() =>
                      setStep(3)
                    }
                  />
                )}

                {step === 3 && (
                  <PropertyStep
                    form={form}
                    setForm={setForm}
                    onBack={() =>
                      setStep(2)
                    }
                    onNext={() =>
                      setStep(4)
                    }
                  />
                )}

                {step === 4 && (
                  <DocumentsStep
                    form={form}
                    setForm={setForm}
                    onBack={() =>
                      setStep(3)
                    }
                    onNext={() =>
                      setStep(5)
                    }
                  />
                )}

                {step === 5 && (
                  <ReviewStep
                    form={form}
                    setForm={setForm}
                    selectedCatalogo={
                      certificadosSeleccionados
                    }
                    total={total}
                    onBack={() =>
                      setStep(4)
                    }
                    onSubmit={submit}
                    loading={loading}
                  />
                )}

              </>
            )}

            {error &&
              !success && (
                <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-xl p-3">
                  {error}
                </p>
              )}

          </div>

        </div>

      </section>

    </CitizenShell>
  )
}

/*
============================================================
CABECERA Y PIE
============================================================
*/

function CitizenShell({
  children,
  active
}: {
  children: ReactNode
  active:
    | 'solicitar'
    | 'consultar'
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900">

      <header className="bg-dom-navy text-white shadow-sm">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-6">

          <Link
            to="/certificados-web"
            className="font-bold text-lg leading-tight"
          >
            I. MUNICIPALIDAD DE DOÑIHUE
            <br />

            <span className="text-base">
              DIRECCIÓN DE OBRAS
            </span>

          </Link>

          <nav className="hidden md:flex items-center gap-2 text-sm">

            <Link
              className={`px-4 py-2 rounded-lg ${
                active === 'solicitar'
                  ? 'bg-white/10'
                  : 'hover:bg-white/10'
              }`}
              to="/certificados-web"
            >
              Solicitar certificado
            </Link>

            <Link
              className={`px-4 py-2 rounded-lg ${
                active === 'consultar'
                  ? 'bg-white/10'
                  : 'hover:bg-white/10'
              }`}
              to="/consultar-solicitud"
            >
              Consultar solicitud
            </Link>

            <a
              className="px-4 py-2 rounded-lg hover:bg-white/10"
              href="mailto:dom@mdonihue.cl"
            >
              Ayuda
            </a>

          </nav>

        </div>

      </header>

      {children}

      <footer className="border-t bg-slate-50 py-6 text-center text-xs text-slate-500">
        Dirección de Obras Municipales de Doñihue · Trámites de certificados en línea
      </footer>

    </div>
  )
}

/*
============================================================
BARRA DE PASOS
============================================================
*/

function StepBar({
  step
}: {
  step: number
}) {
  const labels = [
    'Seleccionar',
    'Datos solicitante',
    'Propiedad',
    'Documentos',
    'Resumen',
    'Confirmar'
  ]

  return (
    <div className="mb-7 overflow-x-auto">

      <div className="flex min-w-[520px] items-center">

        {labels.map(
          (label, index) => {

            const number =
              index + 1

            return (
              <div
                key={label}
                className="flex items-center flex-1 last:flex-none"
              >

                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    number < step
                      ? 'bg-green-600 text-white'
                      : number === step
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >

                  {number < step ? (
                    <Check size={15} />
                  ) : (
                    number
                  )}

                </div>

                {index <
                  labels.length -
                    1 && (
                  <div
                    className={`h-0.5 flex-1 mx-1 ${
                      number < step
                        ? 'bg-green-500'
                        : 'bg-slate-200'
                    }`}
                  />
                )}

              </div>
            )
          }
        )}

      </div>

      <div className="min-w-[520px] flex justify-between mt-2 text-[11px] text-slate-500">

        {labels.map(label => (
          <span key={label}>
            {label}
          </span>
        ))}

      </div>

    </div>
  )
}

/*
============================================================
PASO 1
============================================================
*/

function SelectionSummary({
  selected,
  selectedCatalogo,
  total,
  onNext
}: {
  selected: TipoCertificado[]
  selectedCatalogo: CatalogoCertificado[]
  total: number
  onNext: () => void
}) {
  return (
    <div>

      <h2 className="text-lg font-bold text-dom-navy">
        Paso 1 de 6: Selección del certificado
      </h2>

      <div className="mt-4 rounded-xl bg-blue-50 border border-blue-100 p-3 text-sm text-blue-900">
        Puede seleccionar uno o más certificados en la misma solicitud.
      </div>

      <div className="mt-5 divide-y border rounded-xl">

        {selectedCatalogo.map(
          cert => (

            <div
              key={cert.tipo}
              className="p-3 text-sm"
            >

              <div className="flex justify-between gap-3">

                <span className="font-medium">
                  {cert.nombre ||
                    TIPO_CERT_LABELS[
                      cert.tipo
                    ] ||
                    cert.tipo}
                </span>

                <b>
                  {cert.valor ===
                  null
                    ? 'Según solicitud'
                    : money(
                        cert.valor
                      )}
                </b>

              </div>

              <div className="text-xs text-slate-500 mt-1">

                Plazo:{' '}

                {cert.plazo ||
                  'Según tramitación'}

              </div>

            </div>

          )
        )}

        <div className="p-3 flex justify-between font-bold">

          <span>
            Total certificados seleccionados:{' '}
            {selected.length}
          </span>

          <span className="text-green-700">

            {total > 0
              ? money(total)
              : 'Según solicitud'}

          </span>

        </div>

      </div>

      <button
        type="button"
        onClick={onNext}
        className="mt-5 ml-auto bg-dom-navy text-white px-5 py-3 rounded-xl flex gap-2 items-center"
      >
        Siguiente
        <ArrowRight size={17} />
      </button>

    </div>
  )
}

/*
============================================================
PASO 2
============================================================
*/

function ApplicantStep({
  form,
  setForm,
  onBack,
  onNext
}: {
  form: FormState
  setForm: Dispatch<
    SetStateAction<FormState>
  >
  onBack: () => void
  onNext: () => void
}) {
  const set = (
    key: keyof FormState,
    value: any
  ) => {
    setForm(current => ({
      ...current,
      [key]: value
    }))
  }

  return (
    <div>

      <h2 className="text-lg font-bold text-dom-navy">
        Paso 2 de 6: Datos del solicitante
      </h2>

      <div className="grid sm:grid-cols-2 gap-4 mt-5">

        <label className="text-sm font-semibold">

          Nombre completo *

          <input
            required
            value={form.nombre}
            onChange={e =>
              set(
                'nombre',
                e.target.value
              )
            }
            placeholder="Ej: Juan Pérez"
            className="mt-2 w-full border rounded-xl px-3 py-2.5 font-normal"
          />

        </label>

        <label className="text-sm font-semibold">

          Correo electrónico *

          <input
            required
            type="email"
            value={form.email}
            onChange={e =>
              set(
                'email',
                e.target.value
              )
            }
            placeholder="correo@ejemplo.cl"
            className="mt-2 w-full border rounded-xl px-3 py-2.5 font-normal"
          />

        </label>

        <label className="text-sm font-semibold">

          Teléfono

          <input
            value={form.telefono}
            onChange={e =>
              set(
                'telefono',
                e.target.value
              )
            }
            placeholder="+56 9 1234 5678"
            className="mt-2 w-full border rounded-xl px-3 py-2.5 font-normal"
          />

        </label>

        <label className="text-sm font-semibold">

          RUT *

          <input
            value={form.rut}
            onChange={e =>
              set(
                'rut',
                formatRut(
                  e.target.value
                )
              )
            }
            placeholder="12.345.678-9"
            className="mt-2 w-full border rounded-xl px-3 py-2.5 font-normal"
          />

        </label>

      </div>

      <NavButtons
        onBack={onBack}
        onNext={() => {

          if (
            !form.nombre ||
            !form.rut ||
            !form.email
          ) {
            return
          }

          onNext()
        }}
      />

    </div>
  )
}

/*
============================================================
PASO 3
============================================================
*/

function PropertyStep({
  form,
  setForm,
  onBack,
  onNext
}: {
  form: FormState
  setForm: Dispatch<
    SetStateAction<FormState>
  >
  onBack: () => void
  onNext: () => void
}) {
  const set = (
    key: keyof FormState,
    value: any
  ) => {
    setForm(current => ({
      ...current,
      [key]: value
    }))
  }

  return (
    <div>

      <h2 className="text-lg font-bold text-dom-navy">
        Paso 3 de 6: Datos de la propiedad
      </h2>

      <div className="grid sm:grid-cols-2 gap-4 mt-5">

        <Field
          label="ROL de avalúo *"
          value={form.rolAvaluo}
          onChange={value =>
            set(
              'rolAvaluo',
              value
            )
          }
          placeholder="Ej: 123-45"
        />

        <Field
          label="Propietario"
          value={form.propietario}
          onChange={value =>
            set(
              'propietario',
              value
            )
          }
        />

        <Field
          label="Dirección *"
          value={form.direccion}
          onChange={value =>
            set(
              'direccion',
              value
            )
          }
        />

        <Field
          label="Número"
          value={
            form.numeroDomicilio
          }
          onChange={value =>
            set(
              'numeroDomicilio',
              value
            )
          }
        />

        <Field
          label="Localidad"
          value={form.localidad}
          onChange={value =>
            set(
              'localidad',
              value
            )
          }
        />

        <label className="text-sm font-semibold">

          Área

          <select
            value={
              form.urbanoRural
            }
            onChange={e =>
              set(
                'urbanoRural',
                e.target.value
              )
            }
            className="mt-2 w-full border rounded-xl px-3 py-2.5 font-normal"
          >

            <option value="URBANO">
              Urbano
            </option>

            <option value="RURAL">
              Rural
            </option>

          </select>

        </label>

      </div>

      <NavButtons
        onBack={onBack}
        onNext={onNext}
      />

    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="text-sm font-semibold">

      {label}

      <input
        value={value}
        onChange={e =>
          onChange(
            e.target.value
          )
        }
        placeholder={placeholder}
        className="mt-2 w-full border rounded-xl px-3 py-2.5 font-normal"
      />

    </label>
  )
}

/*
============================================================
PASO 4
============================================================
*/

function DocumentsStep({
  form,
  setForm,
  onBack,
  onNext
}: {
  form: FormState
  setForm: Dispatch<
    SetStateAction<FormState>
  >
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div>

      <h2 className="text-lg font-bold text-dom-navy">
        Paso 4 de 6: Documentos
      </h2>

      <p className="text-sm text-slate-500 mt-2">
        Adjunte los antecedentes requeridos para su certificado. Máximo recomendado: 5 MB por archivo.
      </p>

      <label className="mt-5 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50">

        <Upload
          size={28}
          className="text-dom-navy"
        />

        <span className="font-semibold mt-2">
          Seleccionar documentos
        </span>

        <span className="text-xs text-slate-500">
          PDF, JPG o PNG
        </span>

        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={e =>
            setForm(current => ({
              ...current,

              archivos: [
                ...current.archivos,
                ...Array.from(
                  e.target.files ??
                    []
                )
              ]
            }))
          }
        />

      </label>

      <div className="mt-4 space-y-2">

        {form.archivos.map(
          (file, index) => (

            <div
              key={`${file.name}-${index}`}
              className="border rounded-lg p-2.5 flex items-center gap-2 text-sm"
            >

              <FileText size={16} />

              <span className="flex-1 truncate">
                {file.name}
              </span>

              <button
                type="button"
                onClick={() =>
                  setForm(
                    current => ({
                      ...current,

                      archivos:
                        current.archivos.filter(
                          (_, i) =>
                            i !==
                            index
                        )
                    })
                  )
                }
              >
                <X size={16} />
              </button>

            </div>

          )
        )}

      </div>

      <NavButtons
        onBack={onBack}
        onNext={onNext}
      />

    </div>
  )
}

/*
============================================================
PASO 5 - RESUMEN
============================================================
*/

function ReviewStep({
  form,
  setForm,
  selectedCatalogo,
  total,
  onBack,
  onSubmit,
  loading
}: {
  form: FormState
  setForm: Dispatch<
    SetStateAction<FormState>
  >
  selectedCatalogo: CatalogoCertificado[]
  total: number
  onBack: () => void
  onSubmit: () => void
  loading: boolean
}) {
  return (
    <div>

      <h2 className="text-lg font-bold text-dom-navy">
        Paso 5 de 6: Resumen
      </h2>

      <div className="mt-5 space-y-3 text-sm">

        <Info
          label="Solicitante"
          value={`${form.nombre} · ${form.rut}`}
        />

        <Info
          label="Propiedad"
          value={`${form.rolAvaluo} · ${form.direccion} ${form.numeroDomicilio}`}
        />

        <Info
          label="Documentos"
          value={`${form.archivos.length} archivo(s)`}
        />

      </div>

      <div className="mt-5 border rounded-xl divide-y">

        {selectedCatalogo.map(
          cert => (

            <div
              key={cert.tipo}
              className="p-3 flex justify-between gap-3 text-sm"
            >

              <div>

                <div className="font-semibold">

                  {cert.nombre ||
                    TIPO_CERT_LABELS[
                      cert.tipo
                    ] ||
                    cert.tipo}

                </div>

                <div className="text-xs text-slate-500 mt-1">

                  Plazo:{' '}

                  {cert.plazo ||
                    'Según tramitación'}

                </div>

              </div>

              <div className="font-bold">

                {cert.valor ===
                null
                  ? 'Según solicitud'
                  : money(
                      cert.valor
                    )}

              </div>

            </div>

          )
        )}

      </div>

      <label className="mt-5 flex gap-3 text-sm cursor-pointer">

        <input
          type="checkbox"
          checked={
            form.aceptaDatos
          }
          onChange={e =>
            setForm(current => ({
              ...current,

              aceptaDatos:
                e.target.checked
            }))
          }
        />

        <span>
          Autorizo a la Ilustre Municipalidad de Doñihue a tratar los siguientes datos
          personales (Nombre Completo - RUT - Correo Electrónico - Teléfono - Dirección del
          Predio - Rol de Avalúo) con el fin exclusivo de gestionar esta solicitud. Conforme a
          la{' '}
          <a
            href="https://www.bcn.cl/leychile/navegar?idNorma=141599"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Ley N° 19.628 de Protección de Datos Personales y sus modificaciones (Ley N° 21.719)
          </a>
          .
        </span>

      </label>

      <div className="mt-5 p-4 rounded-xl bg-slate-50 flex justify-between font-bold">

        <span>
          Total
        </span>

        <span className="text-green-700">

          {total > 0
            ? money(total)
            : 'Según solicitud'}

        </span>

      </div>

      <div className="flex justify-between mt-5">

        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 border rounded-xl flex gap-2 items-center"
        >
          <ArrowLeft size={17} />
          Atrás
        </button>

        <button
          type="button"
          disabled={
            loading ||
            !form.aceptaDatos
          }
          onClick={onSubmit}
          className="bg-dom-navy text-white px-5 py-2.5 rounded-xl disabled:opacity-50"
        >
          {loading
            ? 'Enviando...'
            : 'Confirmar solicitud'}
        </button>

      </div>

    </div>
  )
}

/*
============================================================
INFO
============================================================
*/

function Info({
  label,
  value
}: {
  label: string
  value: string
}) {
  return (
    <div className="border-b pb-2">

      <span className="text-slate-500">
        {label}
      </span>

      <div className="font-semibold mt-0.5">
        {value || '—'}
      </div>

    </div>
  )
}

/*
============================================================
BOTONES ATRÁS / SIGUIENTE
============================================================
*/

function NavButtons({
  onBack,
  onNext
}: {
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div className="flex justify-between mt-6">

      <button
        type="button"
        onClick={onBack}
        className="px-4 py-2.5 border rounded-xl flex gap-2 items-center"
      >
        <ArrowLeft size={17} />
        Atrás
      </button>

      <button
        type="button"
        onClick={onNext}
        className="bg-dom-navy text-white px-5 py-2.5 rounded-xl flex gap-2 items-center"
      >
        Siguiente
        <ArrowRight size={17} />
      </button>

    </div>
  )
}

/*
============================================================
ÉXITO
============================================================
*/

function Success({
  folio
}: {
  folio: string
}) {
  return (
    <div className="text-center py-10">

      <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 mx-auto flex items-center justify-center">

        <Check size={34} />

      </div>

      <h2 className="text-2xl font-bold text-dom-navy mt-5">
        Solicitud ingresada correctamente
      </h2>

      <p className="text-slate-600 mt-2">
        Hemos recibido sus antecedentes.
      </p>

      <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-5">

        <p className="text-sm text-slate-600">
          Su número de solicitud es
        </p>

        <strong className="text-2xl text-dom-navy">
          {folio ||
            'Asignado por el sistema'}
        </strong>

      </div>

      <p className="text-sm text-slate-500 mt-5">
        Guarde este número. Lo necesitará junto con su RUT para consultar el estado.
      </p>

      <Link
        to="/consultar-solicitud"
        className="inline-flex mt-5 bg-dom-navy text-white px-5 py-3 rounded-xl"
      >
        Consultar solicitud
      </Link>

    </div>
  )
}

/*
============================================================
TARJETA DE ESTADO
============================================================
*/

function StatusCard({
  data
}: {
  data: any
}) {
  const estado =
    data.estado ??
    data.Estado ??
    'En revisión'

  const folio =
    data.folioSolicitud ??
    data.folio ??
    data.Title ??
    'Solicitud'

  const fecha =
    data.fechaIngreso ??
    data.FechaIngreso

  const ultimaActualizacion =
    data.ultimaActualizacion ??
    data.Modified

  const estadoNormalizado =
    String(estado)
      .trim()
      .toUpperCase()

  return (
    <div>

      <div className="p-7 border-b bg-green-50/40">

        <div className="flex justify-between gap-4">

          <div>

            <p className="text-sm text-slate-500">
              Solicitud encontrada
            </p>

            <h2 className="text-2xl font-bold text-dom-navy mt-1">
              {folio}
            </h2>

            <p className="mt-2">
              {data.tipoCertificado ??
                data.TipoCertificado ??
                'Certificado'}
            </p>

          </div>

          <span className="px-3 py-2 rounded-lg bg-amber-50 text-amber-700 font-bold text-sm h-fit">
            {estado}
          </span>

        </div>

      </div>

      <div className="p-7">

        <div className="grid sm:grid-cols-2 gap-5 text-sm">

          <Info
            label="Fecha de ingreso"
            value={
              fecha
                ? new Date(
                    fecha
                  ).toLocaleString(
                    'es-CL'
                  )
                : '—'
            }
          />

          <Info
            label="Última actualización"
            value={
              ultimaActualizacion
                ? new Date(
                    ultimaActualizacion
                  ).toLocaleString(
                    'es-CL'
                  )
                : '—'
            }
          />

        </div>

        <div className="mt-8 space-y-4">

          <StatusItem
            done
            label="Solicitud recibida"
            detail="Hemos recibido su solicitud correctamente."
          />

          <StatusItem
            done={[
              'EN_REVISION',
              'EN REVISIÓN',
              'EN REVISIÓN',
              'OBSERVADA',
              'OBSERVADO'
            ].includes(
              estadoNormalizado
            )}
            label="En revisión por la DOM"
            detail="Su solicitud está siendo revisada por nuestros profesionales."
          />

          <StatusItem
            done={[
              'APROBADA',
              'EMITIDA',
              'ENTREGADA'
            ].includes(
              estadoNormalizado
            )}
            label="Resolución"
            detail="Pendiente"
          />

          <StatusItem
            done={
              estadoNormalizado ===
              'ENTREGADA'
            }
            label="Certificado disponible"
            detail="Le notificaremos cuando su certificado esté listo."
          />

        </div>

      </div>

    </div>
  )
}

/*
============================================================
ITEM DE ESTADO
============================================================
*/

function StatusItem({
  done,
  label,
  detail
}: {
  done: boolean
  label: string
  detail: string
}) {
  return (
    <div className="flex gap-3">

      <div
        className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center ${
          done
            ? 'bg-green-500 text-white'
            : 'bg-slate-200 text-slate-500'
        }`}
      >
        {done && (
          <Check size={14} />
        )}
      </div>

      <div>

        <div className="font-semibold text-dom-navy">
          {label}
        </div>

        <div className="text-sm text-slate-500">
          {detail}
        </div>

      </div>

    </div>
  )
}