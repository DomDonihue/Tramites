const LS_KEY = 'dom_config'

export interface DomConfig {
  plazo_expediente_dias: number   // días hábiles para tramites en revisión
  plazo_certificado_dias: number  // días hábiles para entrega de certificados
  alerta_expediente_pct: number   // % del plazo para alerta amarilla (0-100)
  alerta_certificado_pct: number
}

const DEFAULTS: DomConfig = {
  plazo_expediente_dias: 30,
  plazo_certificado_dias: 7,
  alerta_expediente_pct: 70,   // amarillo desde 70% = 21 días de 30
  alerta_certificado_pct: 71,  // amarillo desde 71% = 5 días de 7
}

function load(): DomConfig {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch { return DEFAULTS }
}

function save(cfg: DomConfig) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(cfg)) } catch {}
}

export function getConfig(): DomConfig {
  return load()
}

export function saveConfig(cfg: DomConfig): void {
  save(cfg)
}
