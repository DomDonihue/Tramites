import { Certificado, TIPO_CERT_LABELS } from '../../types'

const MUNICIPALIDAD = 'Doñihue'
const REGION = 'O\'Higgins'
const DOM_DIRECTOR = 'Director de Obras Municipales'

function fmtDate(s?: string) {
  if (!s) return ''
  const [y, m, d] = s.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

interface Props { cert: Certificado }

export function PrintCertificado({ cert }: Props) {
  if (cert.tipo === 'NUMERO') return <CertNumero cert={cert} />
  if (cert.tipo === 'AFECTACION_UTILIDAD_PUBLICA') return <CertAfectacion cert={cert} />
  if (cert.tipo === 'INFORMACIONES_PREVIAS') return <CertInfoPrevias cert={cert} />
  return <CertGenerico cert={cert} />
}

/* ── Estilos comunes ── */
const headerBox = 'border border-gray-400 text-[10px] px-1.5 py-0.5'
const tdCell = 'border border-gray-400 px-1.5 py-1 text-[10px]'
const thCell = 'border border-gray-400 px-1.5 py-1 text-[10px] font-bold bg-amber-100'

/* ══════════════════════════════════════════════
   CERTIFICADO DE NÚMERO  (Formulario 5.5)
══════════════════════════════════════════════ */
function CertNumero({ cert }: Props) {
  return (
    <div className="bg-white p-8 max-w-[210mm] mx-auto text-gray-900 font-sans text-sm print:p-6">
      {/* Formulario ref */}
      <div className="flex justify-between text-[9px] text-gray-500 mb-1">
        <span>FORMULARIO 5.5.</span>
        <span>(C.N. - 1.4.4./130)</span>
      </div>

      {/* Título */}
      <h1 className="text-center text-xl font-bold uppercase mb-1">Certificado de Número</h1>
      <p className="text-center text-xs font-semibold mb-4">DIRECCIÓN DE OBRAS — I. MUNICIPALIDAD DE: {MUNICIPALIDAD}</p>

      {/* Header con N° solicitud / certificado */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 border border-gray-400 p-2 text-xs">
          <span className="text-gray-500">Municipalidad de {MUNICIPALIDAD}</span>
        </div>
        <div className="w-40 space-y-1">
          <div className={headerBox}><span className="text-gray-500">SOLICITUD N°</span><br/><strong>{cert.numero}</strong></div>
          <div className={headerBox}><span className="text-gray-500">FECHA</span><br/><strong>{fmtDate(cert.fecha)}</strong></div>
          <div className={headerBox}><span className="text-gray-500">CERTIFICADO N°</span><br/><strong>{cert.numero}</strong></div>
          <div className={headerBox}><span className="text-gray-500">FECHA</span><br/><strong>{fmtDate(cert.fecha)}</strong></div>
        </div>
      </div>

      {/* Región y urbano/rural */}
      <div className="flex gap-6 mb-4 items-center text-xs">
        <span>REGIÓN: <strong>{REGION}</strong></span>
        <label className="flex items-center gap-1">
          <span className={`w-3 h-3 border border-gray-500 inline-flex items-center justify-center text-[8px] ${cert.urbano_rural==='URBANO'?'bg-gray-700 text-white':''}`}>
            {cert.urbano_rural==='URBANO'?'✓':''}
          </span> URBANO
        </label>
        <label className="flex items-center gap-1">
          <span className={`w-3 h-3 border border-gray-500 inline-flex items-center justify-center text-[8px] ${cert.urbano_rural==='RURAL'?'bg-gray-700 text-white':''}`}>
            {cert.urbano_rural==='RURAL'?'✓':''}
          </span> RURAL
        </label>
      </div>

      {/* Cuerpo del certificado */}
      <div className="text-xs mb-6 leading-relaxed">
        <p>
          El Director de Obras Municipales que suscribe certifica que al predio ubicado en calle/camino{' '}
          <span className="border-b border-gray-400 inline-block min-w-[180px] font-semibold">
            {cert.direccion || ''}
          </span>{' '}
          N°{' '}
          <span className="border-b border-gray-400 inline-block min-w-[60px] font-semibold">
            {cert.numero_domicilio || ''}
          </span>
        </p>
        <p className="mt-2">
          correspondiente al lote N°{' '}
          <span className="border-b border-gray-400 inline-block min-w-[50px] font-semibold">{cert.lote || ''}</span>{' '}
          manzana{' '}
          <span className="border-b border-gray-400 inline-block min-w-[60px] font-semibold">{cert.manzana || ''}</span>{' '}
          localidad o loteo{' '}
          <span className="border-b border-gray-400 inline-block min-w-[120px] font-semibold">{cert.localidad || ''}</span>
        </p>
        <p className="mt-2">
          Rol de Avalúo N°{' '}
          <span className="border-b border-gray-400 inline-block min-w-[80px] font-semibold">{cert.rol_avaluo || ''}</span>{' '}
          le ha sido asignado el número:{' '}
          <span className="border border-gray-400 inline-block min-w-[80px] px-2 py-0.5 font-bold text-base text-center">
            {cert.numero_asignado || ''}
          </span>
        </p>
        {cert.anotaciones && (
          <p className="mt-3 text-gray-600 italic">{cert.anotaciones}</p>
        )}
      </div>

      {/* Pago de derechos */}
      <div className="mb-8">
        <div className={`${thCell} w-full`}>PAGO DE DERECHOS</div>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className={`${tdCell} w-2/3`}>TOTAL DERECHOS MUNICIPALES (Art. 130 N°9 L.G.U.C.)</td>
              <td className={`${tdCell} font-semibold`}>$ {cert.total_derechos?.toLocaleString('es-CL') ?? ''}</td>
            </tr>
            <tr>
              <td className={tdCell}>GIRO DE INGRESO MUNICIPAL N° <strong>{cert.giro_municipal ?? ''}</strong></td>
              <td className={tdCell}>FECHA: {fmtDate(cert.fecha_pago)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Firma */}
      <div className="flex justify-end mt-12">
        <div className="text-center">
          <div className="border-t border-gray-700 w-56 pt-1">
            <p className="text-xs font-bold uppercase">{DOM_DIRECTOR}</p>
            <p className="text-[10px] text-gray-500">FIRMA Y TIMBRE</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   CERTIFICADO DE AFECTACIÓN A UTILIDAD PÚBLICA (5.4)
══════════════════════════════════════════════ */
function CertAfectacion({ cert }: Props) {
  return (
    <div className="bg-white p-8 max-w-[210mm] mx-auto text-gray-900 font-sans text-sm print:p-6">
      <div className="flex justify-between text-[9px] text-gray-500 mb-1">
        <span>FORMULARIO 5.4.</span><span>(C.U.P. - 1.4.4./59)</span>
      </div>
      <h1 className="text-center text-xl font-bold uppercase mb-1">Certificado de Afectación a Utilidad Pública</h1>
      <p className="text-center text-xs font-semibold mb-4">DIRECCIÓN DE OBRAS — I. MUNICIPALIDAD DE: {MUNICIPALIDAD}</p>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 border border-gray-400 p-2 text-xs">Municipalidad de {MUNICIPALIDAD}</div>
        <div className="w-40 space-y-1">
          <div className={headerBox}><span className="text-gray-500">SOLICITUD N°</span><br/><strong>{cert.numero}</strong></div>
          <div className={headerBox}><span className="text-gray-500">FECHA</span><br/><strong>{fmtDate(cert.fecha)}</strong></div>
          <div className={headerBox}><span className="text-gray-500">CERTIFICADO N°</span><br/><strong>{cert.numero}</strong></div>
          <div className={headerBox}><span className="text-gray-500">FECHA</span><br/><strong>{fmtDate(cert.fecha)}</strong></div>
        </div>
      </div>

      <div className="flex gap-6 mb-4 items-center text-xs">
        <span>REGIÓN: <strong>{REGION}</strong></span>
        <span className={`w-3 h-3 border border-gray-500 inline-flex items-center justify-center text-[8px] ${cert.urbano_rural==='URBANO'?'bg-gray-700 text-white':''}`}>{cert.urbano_rural==='URBANO'?'✓':''}</span> URBANO
        <span className={`w-3 h-3 border border-gray-500 inline-flex items-center justify-center text-[8px] ${cert.urbano_rural==='RURAL'?'bg-gray-700 text-white':''}`}>{cert.urbano_rural==='RURAL'?'✓':''}</span> RURAL
      </div>

      <div className="text-xs mb-4 leading-relaxed">
        <p>
          El Director de Obras Municipales que suscribe certifica que el predio ubicado en calle/camino{' '}
          <span className="border-b border-gray-400 inline-block min-w-[160px] font-semibold">{cert.direccion || ''}</span>{' '}
          N° <span className="border-b border-gray-400 inline-block min-w-[50px] font-semibold">{cert.numero_domicilio || ''}</span>
        </p>
        <p className="mt-1">
          lote N° <span className="border-b border-gray-400 inline-block min-w-[40px] font-semibold">{cert.lote || ''}</span>{' '}
          manzana <span className="border-b border-gray-400 inline-block min-w-[60px] font-semibold">{cert.manzana || ''}</span>{' '}
          localidad o loteo <span className="border-b border-gray-400 inline-block min-w-[120px] font-semibold">{cert.localidad || ''}</span>
        </p>
        <p className="mt-1">
          Rol de Avalúo <span className="border-b border-gray-400 inline-block min-w-[80px] font-semibold">{cert.rol_avaluo || ''}</span>{' '}
          <span className="font-semibold">{cert.afectacion_vialidad || cert.afectacion_parque ? 'se encuentra' : 'no se encuentra'}</span>{' '}
          afecto a declaración de utilidad pública.
        </p>
      </div>

      {/* Cuadro afectación */}
      <table className="w-full border-collapse mb-4 text-xs">
        <thead>
          <tr><th colSpan={3} className={thCell}>LA PROPIEDAD SE ENCUENTRA AFECTA A DECLARATORIA DE UTILIDAD PÚBLICA (Art. 59)</th></tr>
          <tr>
            <th className={thCell}>VIALIDAD</th>
            <th className={thCell}>ENSANCHE</th>
            <th className={thCell}>APERTURA</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={tdCell}>{cert.afectacion_vialidad ? '☑' : '☐'}</td>
            <td className={tdCell}>{cert.afectacion_ensanche ? '☑' : '☐'}</td>
            <td className={tdCell}>{cert.afectacion_apertura ? '☑' : '☐'}</td>
          </tr>
        </tbody>
      </table>

      {cert.vias_afectadas && (
        <div className="text-xs mb-3">
          <strong>DE LA(S) SIGUIENTE(S) VÍA(S):</strong> {cert.vias_afectadas}
        </div>
      )}

      {cert.afectacion_parque && (
        <div className="text-xs mb-3">
          <strong>PARQUE ☑</strong>
        </div>
      )}

      {cert.anotaciones && <p className="text-xs italic text-gray-600 mb-4">{cert.anotaciones}</p>}

      {/* Pago */}
      <div className="mb-8">
        <div className={`${thCell} w-full`}>PAGO DE DERECHOS</div>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className={`${tdCell} w-2/3`}>TOTAL DERECHOS MUNICIPALES (Art. 130 N°9 L.G.U.C.)</td>
              <td className={`${tdCell} font-semibold`}>$ {cert.total_derechos?.toLocaleString('es-CL') ?? ''}</td>
            </tr>
            <tr>
              <td className={tdCell}>GIRO DE INGRESO MUNICIPAL N° <strong>{cert.giro_municipal ?? ''}</strong></td>
              <td className={tdCell}>FECHA: {fmtDate(cert.fecha_pago)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-12">
        <div className="text-center">
          <div className="border-t border-gray-700 w-56 pt-1">
            <p className="text-xs font-bold uppercase">{DOM_DIRECTOR}</p>
            <p className="text-[10px] text-gray-500">FIRMA Y TIMBRE</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   CERTIFICADO DE INFORMACIONES PREVIAS (5.2) — 3 páginas
══════════════════════════════════════════════ */
function CipHeader({ cert, page }: { cert: Certificado; page: string }) {
  return (
    <>
      <div className="flex justify-between text-[9px] text-gray-500 mb-1">
        <span>FORMULARIO 5.2.</span><span>(C.I.P. - 1.4.4.) {page}/3</span>
      </div>
      <h1 className="text-center text-base font-bold uppercase mb-0.5">Certificado de Informaciones Previas</h1>
      <p className="text-center text-[10px] font-semibold mb-3">DIRECCIÓN DE OBRAS — I. MUNICIPALIDAD DE: {MUNICIPALIDAD}</p>
      <div className="flex gap-3 mb-3">
        <div className="flex-1 border border-gray-400 p-1.5 text-[10px]">
          <div>Municipalidad de {MUNICIPALIDAD}</div>
          <div className="mt-0.5 text-gray-500">REGIÓN: <strong>{REGION}</strong></div>
        </div>
        <div className="w-40 space-y-0.5">
          <div className={headerBox}><span className="text-gray-500">CERTIFICADO N°</span> <strong>{cert.numero}</strong></div>
          <div className={headerBox}><span className="text-gray-500">FECHA</span> <strong>{fmtDate(cert.fecha)}</strong></div>
          <div className={headerBox}><span className="text-gray-500">SOLICITUD N°</span> <strong>{cert.numero}</strong></div>
          <div className={headerBox}><span className="text-gray-500">FECHA</span> <strong>{fmtDate(cert.fecha)}</strong></div>
        </div>
      </div>
    </>
  )
}

function CertInfoPrevias({ cert }: Props) {
  const pg = 'bg-white p-6 max-w-[210mm] mx-auto text-gray-900 font-sans text-[11px] print:p-5'
  const pb = 'break-after-page'

  return (
    <div>
      {/* ─── PÁGINA 1/3 ─── */}
      <div className={`${pg} ${pb}`}>
        <CipHeader cert={cert} page="1" />

        {/* 1. Identificación */}
        <div className="mb-3">
          <div className={`${thCell} text-[10px]`}>1. IDENTIFICACIÓN DE LA PROPIEDAD</div>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className={`${thCell} w-1/2`}>CALLE / CAMINO</td>
                <td className={tdCell} colSpan={3}>{cert.direccion || ''} {cert.numero_domicilio || ''}</td>
              </tr>
              <tr>
                <td className={thCell}>LOTEO / LOCALIDAD</td>
                <td className={tdCell}>{cert.localidad || ''}</td>
                <td className={thCell}>MANZANA</td>
                <td className={tdCell}>{cert.manzana || ''}</td>
              </tr>
              <tr>
                <td className={thCell}>LOTE N°</td>
                <td className={tdCell}>{cert.lote || ''}</td>
                <td className={thCell}>ROL S.I.I. N°</td>
                <td className={tdCell}>{cert.rol_avaluo || ''}</td>
              </tr>
              <tr>
                <td className={thCell}>N° DOMICILIO ASIGNADO</td>
                <td className={tdCell} colSpan={3}><strong>{cert.numero_asignado || ''}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. Instrumentos planificación */}
        <div className="mb-3">
          <div className={`${thCell} text-[10px]`}>2. INSTRUMENTO(S) DE PLANIFICACIÓN TERRITORIAL APLICABLE(S)</div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={`${thCell} w-[55%]`}>INSTRUMENTO</th>
                <th className={thCell}>NOMBRE</th>
                <th className={thCell}>FECHA</th>
              </tr>
            </thead>
            <tbody>
              {['PLAN REGULADOR INTERCOMUNAL O METROPOLITANO','PLAN REGULADOR COMUNAL','PLAN SECCIONAL','PLANO SECCIONAL'].map(r => (
                <tr key={r}><td className={tdCell}>{r}</td><td className={`${tdCell} h-5`}></td><td className={`${tdCell} h-5`}></td></tr>
              ))}
            </tbody>
          </table>
          <table className="w-full border-collapse mt-0.5">
            <tbody>
              <tr>
                <td className={`${thCell} text-center`} colSpan={3}>ÁREA DONDE SE UBICA EL TERRENO</td>
              </tr>
              <tr>
                <td className={`${tdCell} text-center`}>☐ URBANA</td>
                <td className={`${tdCell} text-center`}>☐ EXTENSIÓN URBANA</td>
                <td className={`${tdCell} text-center`}>☐ RURAL</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3. Afectaciones utilidad pública */}
        <div className="mb-3">
          <div className={`${thCell} text-[10px]`}>3. AFECTACIONES POR DECLARACIÓN DE UTILIDAD PÚBLICA (Art. 59 L.G.U.C.)</div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={thCell}>TIPO DE VÍA / ÁREA</th>
                <th className={thCell}>NOMBRE / DENOMINACIÓN</th>
                <th className={thCell}>ANCHO (m)</th>
                <th className={thCell}>AFECTACIÓN (m²)</th>
              </tr>
            </thead>
            <tbody>
              {[1,2,3].map(i=>(
                <tr key={i}>
                  <td className={`${tdCell} h-5`}>{i === 1 && cert.vias_afectadas ? cert.vias_afectadas : ''}</td>
                  <td className={`${tdCell} h-5`}></td>
                  <td className={`${tdCell} h-5`}></td>
                  <td className={`${tdCell} h-5`}></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={`${tdCell} min-h-[20px]`}>
            ☐ NO EXISTE DECLARATORIA DE UTILIDAD PÚBLICA QUE AFECTE AL PREDIO
          </div>
        </div>

        {/* 4. Expropiaciones */}
        <div className="mb-3">
          <div className={`${thCell} text-[10px]`}>4. AFECTACIONES POR EXPROPIACIÓN (D.L. 2.186)</div>
          <div className={`${tdCell} min-h-[24px]`}>
            ☐ NO EXISTEN EXPROPIACIONES VIGENTES QUE AFECTEN AL PREDIO
          </div>
        </div>
      </div>

      {/* ─── PÁGINA 2/3 ─── */}
      <div className={`${pg} ${pb}`}>
        <CipHeader cert={cert} page="2" />

        {/* 5. Normas urbanísticas */}
        <div className="mb-3">
          <div className={`${thCell} text-[10px]`}>5. NORMAS URBANÍSTICAS APLICABLES AL PREDIO</div>

          <div className={`${thCell}`}>5.1 USOS DE SUELO</div>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className={`${thCell} w-[45%]`}>ZONA O SUBZONA EN QUE SE EMPLAZA</td>
                <td className={tdCell}></td>
              </tr>
              <tr>
                <td className={`${tdCell}`} colSpan={2}>
                  <div className="font-bold text-[9px] mb-0.5">USOS DE SUELO PERMITIDOS:</div>
                  <div className="min-h-[30px]"></div>
                </td>
              </tr>
              <tr>
                <td className={`${tdCell}`} colSpan={2}>
                  <div className="font-bold text-[9px] mb-0.5">USOS DE SUELO PROHIBIDOS:</div>
                  <div className="min-h-[20px]"></div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className={`${thCell} mt-0.5`}>5.2 SUBDIVISIÓN PREDIAL</div>
          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr>
                <th className={thCell}>SUPERFICIE PREDIAL MÍN. (m²)</th>
                <th className={thCell}>FRENTE MÍNIMO (m)</th>
                <th className={thCell}>DENSIDAD MÁXIMA (viv/há)</th>
                <th className={thCell}>N° MÁX. VIVIENDAS</th>
              </tr>
            </thead>
            <tbody>
              <tr>{[1,2,3,4].map(i=><td key={i} className={`${tdCell} h-5`}></td>)}</tr>
            </tbody>
          </table>

          <div className={`${thCell} mt-0.5`}>5.3 EDIFICACIÓN</div>
          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr>
                <th className={thCell}>SISTEMA AGRUPAMIENTO</th>
                <th className={thCell}>ALTURA MÁX. (m / pisos)</th>
                <th className={thCell}>COEF. CONSTRUCTIB.</th>
                <th className={thCell}>COEF. OCUP. SUELO</th>
                <th className={thCell}>OCUP. PISOS SUP.</th>
              </tr>
            </thead>
            <tbody>
              <tr>{[1,2,3,4,5].map(i=><td key={i} className={`${tdCell} h-5`}></td>)}</tr>
            </tbody>
          </table>

          <div className={`${thCell} mt-0.5`}>5.4 DISTANCIAS MÍNIMAS Y RASANTES</div>
          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr>
                <th className={thCell}>RASANTE (°)</th>
                <th className={thCell}>DISTANCIA MÍN. MEDIANERO (m)</th>
                <th className={thCell}>ADOSAMIENTO</th>
                <th className={thCell}>NIVEL APLICACIÓN RASANTE</th>
              </tr>
            </thead>
            <tbody>
              <tr>{[1,2,3,4].map(i=><td key={i} className={`${tdCell} h-5`}></td>)}</tr>
            </tbody>
          </table>

          <div className={`${thCell} mt-0.5`}>5.5 ANTEJARDÍN Y ESTACIONAMIENTOS</div>
          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr>
                <th className={thCell}>ANTEJARDÍN MÍN. (m)</th>
                <th className={thCell}>ESTACIONAM. RESIDENCIAL</th>
                <th className={thCell}>ESTACIONAM. COMERCIAL</th>
                <th className={thCell}>OTRAS EXIGENCIAS</th>
              </tr>
            </thead>
            <tbody>
              <tr>{[1,2,3,4].map(i=><td key={i} className={`${tdCell} h-5`}></td>)}</tr>
            </tbody>
          </table>

          <div className={`${thCell} mt-0.5`}>5.6 ÁREAS DE RIESGO O PROTECCIÓN</div>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className={`${tdCell} min-h-[30px]`} colSpan={2}>
                  ☐ NO EXISTEN ÁREAS DE RIESGO O PROTECCIÓN QUE AFECTEN AL PREDIO
                  <div className="min-h-[20px]"></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── PÁGINA 3/3 ─── */}
      <div className={pg}>
        <CipHeader cert={cert} page="3" />

        {/* 6. Condicionantes */}
        <div className="mb-3">
          <div className={`${thCell} text-[10px]`}>6. OTRAS CONDICIONANTES NORMATIVAS</div>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className={`${tdCell} min-h-[40px]`}>
                  <div className="font-bold text-[9px] mb-0.5">NORMAS DE SUBDIVISIÓN Y LOTEO APLICABLES:</div>
                  <div className="min-h-[30px]"></div>
                </td>
              </tr>
              <tr>
                <td className={`${tdCell} min-h-[30px]`}>
                  <div className="font-bold text-[9px] mb-0.5">OTRAS NORMAS (monumentos nacionales, zonas típicas, etc.):</div>
                  <div className="min-h-[20px]"></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 7. Observaciones */}
        <div className="mb-3">
          <div className={`${thCell} text-[10px]`}>7. OBSERVACIONES</div>
          <div className={`${tdCell} min-h-[80px] whitespace-pre-wrap`}>
            {cert.anotaciones || ''}
          </div>
        </div>

        {/* 8. Vigencia */}
        <div className="mb-3">
          <div className={`${thCell} text-[10px]`}>8. VIGENCIA DEL CERTIFICADO</div>
          <div className={`${tdCell}`}>
            El presente certificado tiene una vigencia de <strong>36 meses</strong> a contar de su fecha de emisión,
            de conformidad con el Art. 116° bis de la L.G.U.C.
          </div>
        </div>

        {/* 9. Pago */}
        <div className="mb-6">
          <div className={`${thCell} text-[10px]`}>9. PAGO DE DERECHOS MUNICIPALES</div>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className={`${tdCell} w-2/3`}>TOTAL DERECHOS MUNICIPALES (Art. 130 N°9 L.G.U.C.)</td>
                <td className={`${tdCell} font-semibold`}>$ {cert.total_derechos?.toLocaleString('es-CL') ?? ''}</td>
              </tr>
              <tr>
                <td className={tdCell}>GIRO DE INGRESO MUNICIPAL N° <strong>{cert.giro_municipal ?? ''}</strong></td>
                <td className={tdCell}>FECHA: {fmtDate(cert.fecha_pago)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-[9px] text-gray-500 mb-6">
          Este certificado no autoriza la ejecución de obras. Para efectuar cualquier tipo de construcción,
          ampliación o demolición se deberá solicitar el permiso de edificación correspondiente conforme a
          la Ley General de Urbanismo y Construcciones (L.G.U.C.) y su Ordenanza General (O.G.U.C.).
        </p>

        <div className="flex justify-end mt-8">
          <div className="text-center">
            <div className="border-t border-gray-700 w-56 pt-1">
              <p className="text-[10px] font-bold uppercase">{DOM_DIRECTOR}</p>
              <p className="text-[9px] text-gray-500">FIRMA Y TIMBRE</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   CERTIFICADO GENÉRICO (Ruralidad, Zonificación, etc.)
══════════════════════════════════════════════ */
function CertGenerico({ cert }: Props) {
  const titulo = cert.tipo === 'OTROS'
    ? (cert.otros_descripcion || 'Certificado')
    : TIPO_CERT_LABELS[cert.tipo]

  return (
    <div className="bg-white p-8 max-w-[210mm] mx-auto text-gray-900 font-sans text-sm print:p-6">
      <h1 className="text-center text-xl font-bold uppercase mb-1">Certificado de {titulo}</h1>
      <p className="text-center text-xs font-semibold mb-6">DIRECCIÓN DE OBRAS — I. MUNICIPALIDAD DE: {MUNICIPALIDAD}</p>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 border border-gray-400 p-2 text-xs">
          <div>Municipalidad de {MUNICIPALIDAD} — Región {REGION}</div>
          <div className="mt-1">{cert.urbano_rural}</div>
        </div>
        <div className="w-44 space-y-1">
          <div className={headerBox}><span className="text-gray-500">SOLICITUD N°</span><br/><strong>{cert.numero}</strong></div>
          <div className={headerBox}><span className="text-gray-500">FECHA</span><br/><strong>{fmtDate(cert.fecha)}</strong></div>
          <div className={headerBox}><span className="text-gray-500">CERTIFICADO N°</span><br/><strong>{cert.numero}</strong></div>
          <div className={headerBox}><span className="text-gray-500">FECHA</span><br/><strong>{fmtDate(cert.fecha)}</strong></div>
        </div>
      </div>

      <div className="text-xs leading-relaxed mb-6">
        <p>
          El Director de Obras Municipales que suscribe certifica que el predio ubicado en calle/camino{' '}
          <span className="border-b border-gray-400 inline-block min-w-[160px] font-semibold">{cert.direccion || ''}</span>{' '}
          N° <span className="border-b border-gray-400 inline-block min-w-[50px] font-semibold">{cert.numero_domicilio || ''}</span>{' '}
          lote N° <span className="border-b border-gray-400 inline-block min-w-[40px] font-semibold">{cert.lote || ''}</span>{' '}
          manzana <span className="border-b border-gray-400 inline-block min-w-[60px] font-semibold">{cert.manzana || ''}</span>{' '}
          localidad o loteo <span className="border-b border-gray-400 inline-block min-w-[120px] font-semibold">{cert.localidad || ''}</span>,{' '}
          Rol de Avalúo N° <span className="border-b border-gray-400 inline-block min-w-[80px] font-semibold">{cert.rol_avaluo || ''}</span>.
        </p>
        {cert.anotaciones && (
          <p className="mt-4 border border-gray-300 p-3 rounded">{cert.anotaciones}</p>
        )}
      </div>

      {/* Pago */}
      <div className="mb-8">
        <div className={`${thCell} font-bold text-xs`}>PAGO DE DERECHOS</div>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className={`${tdCell} w-2/3`}>TOTAL DERECHOS MUNICIPALES (Art. 130 N°9 L.G.U.C.)</td>
              <td className={`${tdCell} font-semibold`}>$ {cert.total_derechos?.toLocaleString('es-CL') ?? ''}</td>
            </tr>
            <tr>
              <td className={tdCell}>GIRO DE INGRESO MUNICIPAL N° <strong>{cert.giro_municipal ?? ''}</strong></td>
              <td className={tdCell}>FECHA: {fmtDate(cert.fecha_pago)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-12">
        <div className="text-center">
          <div className="border-t border-gray-700 w-56 pt-1">
            <p className="text-xs font-bold uppercase">{DOM_DIRECTOR}</p>
            <p className="text-[10px] text-gray-500">FIRMA Y TIMBRE</p>
          </div>
        </div>
      </div>
    </div>
  )
}
