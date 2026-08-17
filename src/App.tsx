import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './lib/auth'
import { initFromSharePoint } from './lib/data'
import { AppLayout } from './components/layout/AppLayout'
import { CitizenNavigation } from './components/CitizenNavigation'
import { LoginPage } from './pages/LoginPage'
import { PortalCiudadanoPage } from './pages/PortalCiudadanoPage'
import { BuscarPage } from './pages/BuscarPage'
import { ExpedienteFormPage } from './pages/ExpedienteFormPage'
import { EstadisticasPage } from './pages/EstadisticasPage'
import { RepositorioPage } from './pages/RepositorioPage'
import { UsuariosPage } from './pages/UsuariosPage'
import { DesarchivePage } from './pages/DesarchivePage'
import { CertificadosPage } from './pages/CertificadosPage'
import { CertificadosWebPage } from './pages/CertificadosWebPage'
import { CertificadosWebBandejaPage } from './pages/CertificadosWebBandejaPage'
import { PortalCiudadanoAdminPage } from './pages/PortalCiudadanoAdminPage'
import { SetupPage } from './pages/SetupPage'
import { ImportPage } from './pages/ImportPage'

function ProtectedRoutes() {
  const { user, can } = useAuth()
  if (!user) return <Navigate to="/" replace />
  return <AppLayout><Routes>
    <Route path="/buscar" element={<BuscarPage />} />
    <Route path="/nuevo" element={<ExpedienteFormPage />} />
    <Route path="/expediente/:id" element={<ExpedienteFormPage />} />
    <Route path="/estadisticas" element={<EstadisticasPage />} />
    <Route path="/repositorio" element={<RepositorioPage />} />
    <Route path="/desarchivo/:id" element={<DesarchivePage />} />
    <Route path="/certificados" element={<CertificadosPage />} />
    <Route path="/certificados/nuevo" element={<CertificadosPage nuevo />} />
    <Route path="/certificados-web/bandeja" element={<CertificadosWebBandejaPage />} />
    {can('manageUsers') && <Route path="/portal-admin/certificados" element={<PortalCiudadanoAdminPage />} />}
    {can('manageUsers') && <Route path="/setup" element={<SetupPage />} />}
    {can('manageUsers') && <Route path="/importar" element={<ImportPage />} />}
    {can('manageUsers') && <Route path="/usuarios" element={<UsuariosPage />} />}
    <Route path="*" element={<Navigate to="/buscar" replace />} />
  </Routes></AppLayout>
}

function CitizenRoute() { return <CitizenNavigation><CertificadosWebPage /></CitizenNavigation> }

function AuthGate() {
  const { user } = useAuth()
  useEffect(() => { if (user) initFromSharePoint() }, [user])
  return <Routes>
    <Route path="/" element={<PortalCiudadanoPage />} />
    <Route path="/profesionales" element={user ? <Navigate to="/buscar" replace /> : <LoginPage />} />
    <Route path="/certificados-web" element={<CitizenRoute />} />
    <Route path="/consultar-solicitud" element={<CitizenRoute />} />
    <Route path="/*" element={<ProtectedRoutes />} />
  </Routes>
}
export default function App() { return <AuthProvider><BrowserRouter basename="/Tramites"><AuthGate /></BrowserRouter></AuthProvider> }
