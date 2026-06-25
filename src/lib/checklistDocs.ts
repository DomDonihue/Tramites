// Checklist de documentos requeridos según categoría y etapa

export interface ItemChecklist {
  id:          string
  label:       string
  tipo_doc:    string
  requerido:   boolean
}

type ClaveChecklist = string  // "{CATEGORIA}_{ETAPA}"

const CHECKLIST: Record<ClaveChecklist, ItemChecklist[]> = {

  // ── PERMISOS EDIFICACIÓN ─────────────────────────────────────────────────
  'PERMISOS_EDIFICACION_ANTEPROYECTO': [
    { id: 'ap_plano',    label: 'Plano de Anteproyecto',     tipo_doc: 'ANTEPROYECTO', requerido: true  },
    { id: 'ap_memoria',  label: 'Memoria Explicativa',        tipo_doc: 'OTRO',         requerido: false },
    { id: 'ap_ubicacion',label: 'Plano de Ubicación',         tipo_doc: 'PLANO',        requerido: true  },
  ],
  'PERMISOS_EDIFICACION_PERMISO': [
    { id: 'pe_permiso',  label: 'Permiso de Edificación',     tipo_doc: 'PERMISO',      requerido: true  },
    { id: 'pe_arqt',     label: 'Plano de Arquitectura',      tipo_doc: 'PLANO',        requerido: true  },
    { id: 'pe_struct',   label: 'Plano de Estructuras',       tipo_doc: 'PLANO',        requerido: true  },
    { id: 'pe_eet',      label: 'Memoria EET',                tipo_doc: 'MEMORIA_EET',  requerido: true  },
    { id: 'pe_espec',    label: 'Especificaciones Técnicas',  tipo_doc: 'OTRO',         requerido: false },
    { id: 'pe_ubic',     label: 'Plano de Ubicación',         tipo_doc: 'PLANO',        requerido: true  },
    { id: 'pe_resol',    label: 'Resolución',                 tipo_doc: 'RESOLUCION',   requerido: false },
  ],
  'PERMISOS_EDIFICACION_MODIFICACION': [
    { id: 'mod_resol',   label: 'Resolución de Modificación', tipo_doc: 'RESOLUCION',   requerido: true  },
    { id: 'mod_plano',   label: 'Planos Modificados',         tipo_doc: 'PLANO',        requerido: true  },
    { id: 'mod_eet',     label: 'Memoria EET Actualizada',    tipo_doc: 'MEMORIA_EET',  requerido: false },
  ],
  'PERMISOS_EDIFICACION_RECEPCION': [
    { id: 'rec_cert',    label: 'Certificado de Recepción Final', tipo_doc: 'RECEPCION',  requerido: true  },
    { id: 'rec_asbuilt', label: 'Plano As-Built',                tipo_doc: 'PLANO',       requerido: true  },
    { id: 'rec_eet',     label: 'Memoria EET Final',              tipo_doc: 'MEMORIA_EET', requerido: false },
    { id: 'rec_foto',    label: 'Fotografías de Obra',            tipo_doc: 'OTRO',        requerido: false },
  ],

  // ── OBRAS MENORES ────────────────────────────────────────────────────────
  'OBRAS_MENORES_PERMISO': [
    { id: 'om_permiso',  label: 'Permiso Obra Menor',         tipo_doc: 'PERMISO',      requerido: true  },
    { id: 'om_croquis',  label: 'Croquis / Plano',            tipo_doc: 'PLANO',        requerido: true  },
    { id: 'om_resol',    label: 'Resolución',                 tipo_doc: 'RESOLUCION',   requerido: false },
  ],
  'OBRAS_MENORES_MODIFICACION': [
    { id: 'om_mod_resol',label: 'Resolución de Modificación', tipo_doc: 'RESOLUCION',   requerido: true  },
    { id: 'om_mod_plano',label: 'Plano Modificado',           tipo_doc: 'PLANO',        requerido: false },
  ],
  'OBRAS_MENORES_RECEPCION': [
    { id: 'om_rec_cert', label: 'Certificado de Recepción',   tipo_doc: 'RECEPCION',    requerido: true  },
    { id: 'om_rec_foto', label: 'Fotografías de Obra',        tipo_doc: 'OTRO',         requerido: false },
  ],

  // ── SUBDIVISIÓN URBANIZACIÓN ─────────────────────────────────────────────
  'SUBDIVISION_URB_ANTEPROYECTO': [
    { id: 'sub_ap_plano',label: 'Plano de Anteproyecto',      tipo_doc: 'ANTEPROYECTO', requerido: true  },
    { id: 'sub_ap_mem',  label: 'Memoria Explicativa',        tipo_doc: 'OTRO',         requerido: false },
  ],
  'SUBDIVISION_URB_PERMISO': [
    { id: 'sub_permiso', label: 'Permiso de Subdivisión',     tipo_doc: 'PERMISO',      requerido: true  },
    { id: 'sub_plano',   label: 'Plano de Subdivisión',       tipo_doc: 'PLANO',        requerido: true  },
    { id: 'sub_resol',   label: 'Resolución',                 tipo_doc: 'RESOLUCION',   requerido: true  },
    { id: 'sub_croquis', label: 'Croquis de Deslindes',       tipo_doc: 'PLANO',        requerido: false },
  ],
  'SUBDIVISION_URB_MODIFICACION': [
    { id: 'sub_mod',     label: 'Resolución de Modificación', tipo_doc: 'RESOLUCION',   requerido: true  },
    { id: 'sub_mod_p',   label: 'Plano Modificado',           tipo_doc: 'PLANO',        requerido: true  },
  ],
  'SUBDIVISION_URB_RECEPCION': [
    { id: 'sub_rec',     label: 'Certificado de Recepción',   tipo_doc: 'RECEPCION',    requerido: true  },
    { id: 'sub_rec_p',   label: 'Plano As-Built',             tipo_doc: 'PLANO',        requerido: false },
  ],

  // ── ZONAS CATÁSTROFE ─────────────────────────────────────────────────────
  'ZONAS_CATASTROFE_PERMISO': [
    { id: 'cat_permiso', label: 'Permiso de Edificación',     tipo_doc: 'PERMISO',      requerido: true  },
    { id: 'cat_plano',   label: 'Plano de Arquitectura',      tipo_doc: 'PLANO',        requerido: true  },
    { id: 'cat_resol',   label: 'Resolución',                 tipo_doc: 'RESOLUCION',   requerido: true  },
    { id: 'cat_eet',     label: 'Memoria EET',                tipo_doc: 'MEMORIA_EET',  requerido: false },
  ],
  'ZONAS_CATASTROFE_RECEPCION': [
    { id: 'cat_rec',     label: 'Certificado de Recepción',   tipo_doc: 'RECEPCION',    requerido: true  },
    { id: 'cat_rec_p',   label: 'Plano As-Built',             tipo_doc: 'PLANO',        requerido: false },
  ],

  // ── TORRES ANTENAS ──────────────────────────────────────────────────────
  'TORRES_ANTENAS_PERMISO': [
    { id: 'tor_permiso', label: 'Permiso de Instalación',     tipo_doc: 'PERMISO',      requerido: true  },
    { id: 'tor_plano',   label: 'Plano Técnico',              tipo_doc: 'PLANO',        requerido: true  },
    { id: 'tor_resol',   label: 'Resolución',                 tipo_doc: 'RESOLUCION',   requerido: true  },
    { id: 'tor_espec',   label: 'Especificaciones Técnicas',  tipo_doc: 'OTRO',         requerido: false },
  ],
  'TORRES_ANTENAS_RECEPCION': [
    { id: 'tor_rec',     label: 'Certificado de Recepción',   tipo_doc: 'RECEPCION',    requerido: true  },
  ],

  // ── AUTORIZACIÓN / APROBACIÓN ────────────────────────────────────────────
  'AUTORIZACION_APRO_PERMISO': [
    { id: 'aut_resol',   label: 'Resolución de Autorización', tipo_doc: 'RESOLUCION',   requerido: true  },
    { id: 'aut_plano',   label: 'Plano de Referencia',        tipo_doc: 'PLANO',        requerido: false },
    { id: 'aut_cert',    label: 'Certificado',                tipo_doc: 'CERTIFICADO',  requerido: false },
  ],

  // ── REGULARIZACIÓN ───────────────────────────────────────────────────────
  'REGULARIZACION_PERMISO': [
    { id: 'req_permiso', label: 'Permiso de Regularización',  tipo_doc: 'PERMISO',      requerido: true  },
    { id: 'req_plano',   label: 'Plano de Regularización',    tipo_doc: 'PLANO',        requerido: true  },
    { id: 'req_resol',   label: 'Resolución',                 tipo_doc: 'RESOLUCION',   requerido: false },
    { id: 'req_eet',     label: 'Memoria EET',                tipo_doc: 'MEMORIA_EET',  requerido: false },
    { id: 'req_foto',    label: 'Fotografías del Inmueble',   tipo_doc: 'OTRO',         requerido: false },
  ],

  // ── CERTIFICADOS ─────────────────────────────────────────────────────────
  'CERTIFICADOS_PERMISO': [
    { id: 'cer_doc',     label: 'Certificado Emitido',        tipo_doc: 'CERTIFICADO',  requerido: true  },
    { id: 'cer_sol',     label: 'Solicitud del Interesado',   tipo_doc: 'OTRO',         requerido: false },
  ],
}

export function getChecklist(categoria: string, etapa: string): ItemChecklist[] {
  const clave = `${categoria}_${etapa}`
  return CHECKLIST[clave] ?? [
    { id: 'gen_doc', label: 'Documento principal', tipo_doc: 'OTRO', requerido: true },
  ]
}
