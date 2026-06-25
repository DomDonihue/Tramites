# DOM en Línea — Doñihue
## Sistema de Gestión de Expedientes · Dirección de Obras Municipales

---

## Instalación y uso

### Requisitos
- Node.js 18+
- npm o pnpm

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar en modo desarrollo
npm run dev

# 3. Abrir en navegador
# http://localhost:5173
```

---

## Credenciales demo

| Perfil | Correo | Contraseña |
|---|---|---|
| Admin | admin@donihue.cl | admin123 |
| Director | director@donihue.cl | director123 |
| Profesional | a.carrasco@donihue.cl | prof123 |

---

## Permisos por perfil

| Acción | Profesional | Director | Admin |
|---|---|---|---|
| Ver expedientes | ✅ | ✅ | ✅ |
| Crear expediente | ✅ | ✅ | ✅ |
| Editar expediente | ✅ | ✅ | ✅ |
| Eliminar expediente | ❌ | ✅ | ✅ |
| Adjuntar documentos | ✅ | ✅ | ✅ |
| Eliminar documentos | ❌ | ✅ | ✅ |
| Gestionar usuarios | ❌ | ❌ | ✅ |

---

## Estructura del proyecto

```
src/
├── components/
│   ├── layout/    AppLayout (sidebar + nav)
│   └── ui/        Badges, Toast, ConfirmDialog
├── hooks/         useToast
├── lib/
│   ├── auth.tsx   AuthContext (demo login)
│   └── data.ts    In-memory store (15 expedientes reales)
├── pages/
│   ├── LoginPage.tsx
│   ├── BuscarPage.tsx        ← búsqueda principal
│   ├── ExpedienteFormPage.tsx ← crear/editar
│   ├── EstadisticasPage.tsx
│   ├── RepositorioPage.tsx
│   └── UsuariosPage.tsx      ← solo admin
└── types/index.ts             ← tipos + constantes DOM
```

---

## Próximos pasos para producción

1. **Base de datos**: Conectar Supabase (reemplazar `src/lib/data.ts` por cliente Supabase)
2. **Autenticación**: Activar Supabase Auth (reemplazar `src/lib/auth.tsx`)
3. **Almacenamiento**: Supabase Storage para archivos reales
4. **SharePoint**: Integrar Microsoft Graph API para sincronizar con SharePoint Lists
5. **Deploy**: Vercel, Netlify, o servidor municipal

---

## Datos incluidos

15 expedientes reales DOM Doñihue 2024–2026:
- Cecilia Palma Pereira (Obra Nueva 2024)
- Municipalidad de Doñihue (Subdivisión 2024)
- Noelia Pérez Peralta (Obra Nueva 2024)
- Metalúrgica Rancagua S.A. (Subdivisión 2025)
- Victor Leiva Cañete (Anteproyecto 2026 vía DOM en Línea)
- y 10 más...
