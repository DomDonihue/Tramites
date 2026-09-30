import { msalInstance } from './auth'
import { Expediente, Usuario, Certificado, Desarchivo, Solicitante } from '../types'

const SITE_URL = 'https://mdonihue.sharepoint.com/sites/DOMExpediente'
const SP_SCOPE  = 'https://mdonihue.sharepoint.com/AllSites.Write'

async function getToken(): Promise<string> {
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0]
  try {
    const r = await msalInstance.acquireTokenSilent({ scopes: [SP_SCOPE], account })
    return r.accessToken
  } catch {
    const r = await msalInstance.acquireTokenPopup({ scopes: [SP_SCOPE], account })
    return r.accessToken
  }
}

async function spFetch(path: string, method = 'GET', body?: unknown) {
  const token = await getToken()
  const res = await fetch(`${SITE_URL}/_api${path}`, { method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json;odata=nometadata', 'Content-Type': 'application/json;odata=nometadata' }, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) throw new Error(`SP ${res.status}: ${await res.text()}`)
  if (res.status === 204) return null
  return res.json()
}
async function spDelete(path: string) {
  const token = await getToken()
  const res = await fetch(`${SITE_URL}/_api${path}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}`, 'IF-MATCH': '*', 'X-HTTP-Method': 'DELETE' } })
  if (!res.ok) throw new Error(`SP ${res.status}: ${await res.text()}`)
}
function listItems(list: string) { return `/web/lists/getbytitle('${list}')/items` }
function listItem(list: string, id: string) { return `/web/lists/getbytitle('${list}')/items(${id})` }
function dateOrNull(v: string | undefined | null): string | null { if (!v || v.trim() === '' || v.startsWith('1970')) return null; return v }

function expToSP(e: Partial<Expediente>): Record<string, unknown> { return { Title:e.numero??'', Ano:e.ano, Fecha:dateOrNull(e.fecha), Propietario:e.propietario, RolAvaluo:e.rol_avaluo||null, Direccion:e.direccion||null, Profesional:e.profesional||null, Categoria:e.categoria, TipoTramite:e.tipo_tramite||null, Etapa:e.etapa, Estado:e.estado, SuperficieM2:e.superficie_m2??null, TotalPesos:e.total_pesos??null, Caja:e.caja??null, NumPermiso:e.num_permiso||null, Observaciones:e.observaciones||null, DocsEnArchivo:e.docs_en_archivo?JSON.stringify(e.docs_en_archivo):null, CreadoPor:e.created_by||null } }
function spToExp(f:Record<string,unknown>,spId:string):Expediente{return{id:String(spId),sp_id:String(spId),numero:String(f.Numero??f.Title??''),ano:Number(f.Ano??0),fecha:String(f.Fecha??'').split('T')[0],propietario:String(f.Propietario??''),rol_avaluo:String(f.RolAvaluo??''),direccion:String(f.Direccion??''),profesional:String(f.Profesional??''),categoria:(f.Categoria??'PERMISOS_EDIFICACION') as Expediente['categoria'],tipo_tramite:String(f.TipoTramite??''),etapa:(f.Etapa??'PERMISO') as Expediente['etapa'],estado:(f.Estado??'en_revision') as Expediente['estado'],superficie_m2:Number(f.SuperficieM2??0),total_pesos:Number(f.TotalPesos??0),caja:Number(f.Caja??0),num_permiso:String(f.NumPermiso??''),observaciones:String(f.Observaciones??''),docs_en_archivo:f.DocsEnArchivo?JSON.parse(String(f.DocsEnArchivo)):undefined,fuente:String(f.Fuente??''),created_by:String(f.CreadoPor??''),created_at:String(f.Created??new Date().toISOString()),updated_at:String(f.Modified??new Date().toISOString()),documentos:[]}}
export async function spGetExpedientes():Promise<Expediente[]>{const data=await spFetch(`${listItems('Expediente')}?$top=5000&$orderby=Id desc`);return(data.value??[]).map((item:any)=>spToExp(item,item.Id))}
export async function spCreateExpediente(e:Partial<Expediente>):Promise<string>{const data=await spFetch(listItems('Expediente'),'POST',expToSP(e));return String(data.Id)}
export async function spUpdateExpediente(spId:string,e:Partial<Expediente>):Promise<void>{await spFetch(listItem('Expediente',spId),'PATCH',expToSP(e))}
export async function spDeleteExpediente(spId:string):Promise<void>{await spDelete(listItem('Expediente',spId))}

function certToSP(c:Partial<Certificado>):Record<string,unknown>{return{Title:String(c.numero??''),Fecha:dateOrNull(c.fecha),Solicitante:c.solicitante??null,RutSolicitante:c.rut_solicitante||null,Email:c.email||null,Telefono:c.telefono||null,TipoCertificado:c.tipo??null,OtrosDescripcion:c.otros_descripcion||null,Anotaciones:c.anotaciones||null,RolAvaluo:c.rol_avaluo||null,Propietario:c.propietario||null,Direccion:c.direccion||null,NumeroDomicilio:c.numero_domicilio||null,Localidad:c.localidad||null,Manzana:c.manzana||null,Lote:c.lote||null,UrbanoRural:c.urbano_rural??null,NumeroAsignado:c.numero_asignado||null,FechaEntrega:dateOrNull(c.fecha_entrega),Estado:c.estado??null,EstadoPago:c.estado_pago||null,TotalDerechos:c.total_derechos??null,GiroMunicipal:c.giro_municipal||null,FechaPago:dateOrNull(c.fecha_pago),Funcionario:c.funcionario||null,CreadoPor:c.created_by||null}}
function spToCert(f:Record<string,unknown>,spId:string):Certificado{return{id:String(spId),sp_id:String(spId),numero:Number(f.Title??0),fecha:String(f.Fecha??'').split('T')[0],solicitante:String(f.Solicitante??''),rut_solicitante:String(f.RutSolicitante??''),email:String(f.Email??''),telefono:String(f.Telefono??''),tipo:(f.TipoCertificado??'NUMERO') as Certificado['tipo'],otros_descripcion:String(f.OtrosDescripcion??''),anotaciones:String(f.Anotaciones??''),rol_avaluo:String(f.RolAvaluo??''),propietario:String(f.Propietario??''),direccion:String(f.Direccion??''),numero_domicilio:String(f.NumeroDomicilio??''),localidad:String(f.Localidad??''),manzana:String(f.Manzana??''),lote:String(f.Lote??''),urbano_rural:(f.UrbanoRural??'URBANO') as Certificado['urbano_rural'],numero_asignado:String(f.NumeroAsignado??''),fecha_entrega:String(f.FechaEntrega??'').split('T')[0],estado:(f.Estado??'POR_ENTREGAR') as Certificado['estado'],estado_pago:(f.EstadoPago||undefined) as Certificado['estado_pago'],total_derechos:Number(f.TotalDerechos??0),giro_municipal:String(f.GiroMunicipal??''),fecha_pago:String(f.FechaPago??'').split('T')[0],funcionario:String(f.Funcionario??''),created_by:String(f.CreadoPor??''),afectacion_vialidad:Boolean(f.AfectacionVialidad),afectacion_parque:Boolean(f.AfectacionParque),afectacion_ensanche:Boolean(f.AfectacionEnsanche),afectacion_apertura:Boolean(f.AfectacionApertura),vias_afectadas:String(f.ViasAfectadas??''),created_at:String(f.Created??new Date().toISOString()),updated_at:String(f.Modified??new Date().toISOString())}}
export async function spGetCertificados():Promise<Certificado[]>{const data=await spFetch(`${listItems('Certificados')}?$top=5000&$orderby=Id desc`);return(data.value??[]).map((item:any)=>spToCert(item,item.Id))}
export async function spCreateCertificado(c:Partial<Certificado>):Promise<string>{const data=await spFetch(listItems('Certificados'),'POST',certToSP(c));return String(data.Id)}
export async function spUpdateCertificado(spId:string,c:Partial<Certificado>):Promise<void>{await spFetch(listItem('Certificados',spId),'PATCH',certToSP(c))}
export async function spDeleteCertificado(spId:string):Promise<void>{await spDelete(listItem('Certificados',spId))}
export async function spBorrarTodosCertificados(onProgress?:(done:number,total:number)=>void):Promise<{borrados:number;total:number}>{let borrados=0,total=0;for(;;){const data=await spFetch(`${listItems('Certificados')}?$select=Id&$top=1000`);const items:{Id:number}[]=data?.value??[];if(!items.length)break;total+=items.length;for(const it of items){await spDelete(listItem('Certificados',String(it.Id)));borrados++;onProgress?.(borrados,total)}}return{borrados,total}}

// ── DESARCHIVOS ──
function desToSP(d:Partial<Desarchivo>):Record<string,unknown>{return{Title:d.expediente_id??'',ExpedienteId:d.expediente_id,Solicitante:d.solicitante,RutSolicitante:d.rut_solicitante,DocumentosRetirados:JSON.stringify({fisicos:d.documentos_retirados??d.documentos??[],digitales:d.documentos_digitales??[]}),Fecha:d.fecha,Funcionario:d.funcionario}}
function spToDes(f:Record<string,unknown>,spId:string):Desarchivo{const guardado=f.DocumentosRetirados?JSON.parse(String(f.DocumentosRetirados)):[];const docs=Array.isArray(guardado)?guardado:(guardado.fisicos??[]);const digitales:string[]=Array.isArray(guardado)?[]:(guardado.digitales??[]);return{id:String(spId),sp_id:String(spId),expediente_id:String(f.ExpedienteId??''),solicitante:String(f.Solicitante??''),rut_solicitante:String(f.RutSolicitante??''),documentos:docs,documentos_retirados:docs,documentos_digitales:digitales,fecha:String(f.Fecha??'').split('T')[0],funcionario:String(f.Funcionario??''),created_at:String(f.Created??new Date().toISOString())}}
export async function spGetDesarchivos():Promise<Desarchivo[]>{const data=await spFetch(`${listItems('Desarchivo')}?$top=5000&$orderby=Id desc`);return(data.value??[]).map((item:any)=>spToDes(item,item.Id))}
export async function spCreateDesarchivo(d:Partial<Desarchivo>):Promise<string>{const data=await spFetch(listItems('Desarchivo'),'POST',desToSP(d));return String(data.Id)}

// ── USUARIOS ──
const PERFIL_TO_SP:Record<string,string>={admin:'Administrador',director:'Director',profesional:'Profesional'}
const PERFIL_FROM_SP:Record<string,string>={administrador:'admin',director:'director',profesional:'profesional'}
export async function spGetUsuarios():Promise<Usuario[]>{const data=await spFetch(`${listItems('Usuario')}?$top=200`);return(data.value??[]).map((item:any)=>({id:String(item.Id),sp_id:String(item.Id),nombre:String(item.Title??''),email:String(item.Email??''),perfil:(PERFIL_FROM_SP[String(item.Perfil??'').toLowerCase()]??'profesional') as Usuario['perfil'],activo:item.Activo!==false,cargo:String(item.Cargo??''),created_at:String(item.Created??new Date().toISOString())}))}
function usuarioToSP(u:Partial<Usuario>):Record<string,unknown>{return{Title:u.nombre??'',Email:u.email??'',Perfil:PERFIL_TO_SP[u.perfil??'profesional']??u.perfil,Activo:u.activo!==false,Cargo:u.cargo??'',FechaIngreso:u.created_at?u.created_at.split('T')[0]:new Date().toISOString().split('T')[0],UltimoAcceso:new Date().toISOString().split('T')[0]}}
export async function spCreateUsuario(u:Partial<Usuario>):Promise<string>{const data=await spFetch(listItems('Usuario'),'POST',usuarioToSP(u));return String(data.Id)}
export async function spUpdateUsuario(spId:string,u:Partial<Usuario>):Promise<void>{await spFetch(listItem('Usuario',spId),'PATCH',usuarioToSP(u))}
export async function spDeleteUsuario(spId:string):Promise<void>{await spDelete(listItem('Usuario',spId))}

// ── REPOSITORIO DE DOCUMENTOS ──
// Los archivos de cada expediente se guardan en la biblioteca Documentos, en la carpeta
// REPOSITORIO_DOM/... que calcula repositorio.ts. El nombre lleva como prefijo el ítem del
// checklist ("pe_arqt__Plano.pdf"); los documentos adicionales usan "extra__".
export interface ArchivoRepositorio{nombre:string;item:string;url:string;rutaServidor:string;tamano:number;fecha:string}
let raizBiblioteca:Promise<string>|null=null
function bibliotecaDocumentos():Promise<string>{if(!raizBiblioteca){raizBiblioteca=spFetch(`/web/lists/getbytitle('Documentos')/RootFolder?$select=ServerRelativeUrl`).then((d:any)=>String(d.ServerRelativeUrl));raizBiblioteca.catch(()=>{raizBiblioteca=null})}return raizBiblioteca}
const rutaSP=(ruta:string)=>encodeURIComponent(ruta.replace(/'/g,"''"))
function aArchivo(f:any):ArchivoRepositorio{const m=String(f.Name).match(/^([a-z0-9_]+?)__(.+)$/i);return{nombre:m?m[2]:String(f.Name),item:m?m[1]:'extra',url:`${new URL(SITE_URL).origin}${f.ServerRelativeUrl}`,rutaServidor:String(f.ServerRelativeUrl),tamano:Number(f.Length??0),fecha:String(f.TimeCreated??'')}}
// Crea la carpeta y sus niveles superiores si no existen; devuelve su ruta en el servidor
async function asegurarCarpeta(ruta:string):Promise<string>{let actual=await bibliotecaDocumentos();for(const parte of ruta.split('/').filter(Boolean)){actual+=`/${parte}`;await spFetch(`/web/folders/add('${rutaSP(actual)}')`,'POST').catch(()=>{})}return actual}
async function carpetaExiste(rutaServidor:string):Promise<boolean>{return spFetch(`/web/GetFolderByServerRelativePath(decodedurl='${rutaSP(rutaServidor)}')?$select=Exists`).then((d:any)=>d?.Exists!==false).catch(()=>false)}
export async function spListarArchivosRepositorio(ruta:string):Promise<ArchivoRepositorio[]>{const carpeta=`${await bibliotecaDocumentos()}/${ruta}`;const data=await spFetch(`/web/GetFolderByServerRelativePath(decodedurl='${rutaSP(carpeta)}')/Files?$select=Name,ServerRelativeUrl,Length,TimeCreated`).catch(()=>null);return(data?.value??[]).map(aArchivo).sort((a:ArchivoRepositorio,b:ArchivoRepositorio)=>a.fecha.localeCompare(b.fecha))}
export async function spSubirArchivoRepositorio(file:File,ruta:string,item:string):Promise<ArchivoRepositorio>{const carpeta=await asegurarCarpeta(ruta);const nombre=`${item}__${file.name.replace(/[\/:*?"<>|#%]/g,'_')}`;const token=await getToken();const res=await fetch(`${SITE_URL}/_api/web/GetFolderByServerRelativePath(decodedurl='${rutaSP(carpeta)}')/Files/AddUsingPath(decodedurl='${rutaSP(nombre)}',overwrite=true)`,{method:'POST',headers:{Authorization:`Bearer ${token}`,Accept:'application/json;odata=nometadata'},body:await file.arrayBuffer()});if(!res.ok)throw new Error(`SP ${res.status}: ${await res.text()}`);return aArchivo(await res.json())}
// Si al editar el expediente cambia su carpeta (ROL, año, categoría…), los documentos se mueven con él
export async function spMoverCarpetaRepositorio(de:string,a:string):Promise<void>{if(de===a)return;const raiz=await bibliotecaDocumentos();const origen=`${raiz}/${de}`;if(!(await carpetaExiste(origen)))return;const partes=a.split('/');const padre=await asegurarCarpeta(partes.slice(0,-1).join('/'));await spFetch(`/web/GetFolderByServerRelativePath(decodedurl='${rutaSP(origen)}')/MoveToUsingPath(DecodedUrl='${rutaSP(`${padre}/${partes[partes.length-1]}`)}')`,'POST')}

// ── SOLICITANTES ──
function solToSP(s:Partial<Solicitante>):Record<string,unknown>{return{Title:s.rut??'',Nombre:s.nombre??null,Email:s.email||null,Telefono:s.telefono||null}}
function spToSol(f:Record<string,unknown>,spId:string):Solicitante{return{id:String(spId),sp_id:String(spId),rut:String(f.Title??''),nombre:String(f.Nombre??''),email:String(f.Email??'')||undefined,telefono:String(f.Telefono??'')||undefined,created_at:String(f.Created??new Date().toISOString()),updated_at:String(f.Modified??new Date().toISOString())}}
export async function spGetSolicitantes():Promise<Solicitante[]>{const data=await spFetch(`${listItems('Solicitante')}?$top=2000&$orderby=Title asc`);return(data.value??[]).map((item:any)=>spToSol(item,item.Id))}
export async function spCreateSolicitante(s:Partial<Solicitante>):Promise<string>{const data=await spFetch(listItems('Solicitante'),'POST',solToSP(s));return String(data.Id)}
export async function spUpdateSolicitante(spId:string,s:Partial<Solicitante>):Promise<void>{await spFetch(listItem('Solicitante',spId),'PATCH',solToSP(s))}
export async function spUpsertSolicitante(s:Solicitante):Promise<string>{if(s.sp_id){await spUpdateSolicitante(s.sp_id,s);return s.sp_id}return spCreateSolicitante(s)}

export async function spLoadAll(){const [expedientes,certificados,desarchivos,usuarios]=await Promise.all([spGetExpedientes().catch(()=>null),spGetCertificados().catch(()=>null),spGetDesarchivos().catch(()=>null),spGetUsuarios().catch(()=>null)]);return{expedientes,certificados,desarchivos,usuarios}}
