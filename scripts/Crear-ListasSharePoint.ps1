# Script para crear las listas de SharePoint para el sistema DOM Doñihue
# Requiere PnP.PowerShell instalado: Install-Module -Name PnP.PowerShell -Scope CurrentUser -Force

$SiteUrl = "https://mdonihue.sharepoint.com/sites/DOMExpediente"

Write-Host "Conectando a SharePoint..." -ForegroundColor Cyan
Connect-PnPOnline -Url $SiteUrl -UseWebLogin

# ============================================================
# LISTA 1: Expedientes
# ============================================================
Write-Host "`nCreando lista Expedientes..." -ForegroundColor Yellow

$listExists = Get-PnPList -Identity "Expedientes" -ErrorAction SilentlyContinue
if ($listExists) {
    Write-Host "  Lista 'Expedientes' ya existe, omitiendo creacion." -ForegroundColor Gray
} else {
    New-PnPList -Title "Expedientes" -Template GenericList -OnQuickLaunch
    Write-Host "  Lista creada." -ForegroundColor Green
}

$campos = @(
    @{ Name="Propietario";    Type="Text" },
    @{ Name="RolAvaluo";      Type="Text" },
    @{ Name="Direccion";      Type="Text" },
    @{ Name="Profesional";    Type="Text" },
    @{ Name="Ano";            Type="Number" },
    @{ Name="NumPermiso";     Type="Text" },
    @{ Name="SuperficieM2";   Type="Number" },
    @{ Name="TotalPesos";     Type="Number" },
    @{ Name="Caja";           Type="Number" },
    @{ Name="Observaciones";  Type="Note" },
    @{ Name="Fuente";         Type="Text" }
)

foreach ($campo in $campos) {
    $existe = Get-PnPField -List "Expedientes" -Identity $campo.Name -ErrorAction SilentlyContinue
    if (-not $existe) {
        Add-PnPField -List "Expedientes" -DisplayName $campo.Name -InternalName $campo.Name -Type $campo.Type
        Write-Host "  Campo '$($campo.Name)' creado." -ForegroundColor Green
    } else {
        Write-Host "  Campo '$($campo.Name)' ya existe." -ForegroundColor Gray
    }
}

# Campos tipo Choice
$choiceFields = @(
    @{
        Name   = "Categoria"
        Choices = @(
            "PERMISOS_EDIFICACION","OBRAS_MENORES","SUBDIVISION_URB",
            "CERTIFICADOS","ZONAS_CATASTROFE","TORRES_ANTENAS",
            "AUTORIZACION_APRO","REGULARIZACION"
        )
    },
    @{
        Name   = "Etapa"
        Choices = @("ANTEPROYECTO","PERMISO","MODIFICACION","RECEPCION")
    },
    @{
        Name   = "Estado"
        Choices = @("en_revision","aprobado","observado","vigente","rechazado")
    },
    @{
        Name   = "TipoTramite"
        Choices = @(
            "OBRA_NUEVA","AMPLIACION_100","ALTERACION","RECONSTRUCCION",
            "REPARACION","AMPLIACION_VIV_50","ARTE_SIN_OBRA","MODIF_SIN_ALT",
            "REGUL_EDIF_ANTI","FUSION","LOTEO","LOTEO_CONS_SIN","LOTEO_DFL2",
            "SUBDIVISION","URBANIZACION","CERT_NUM","CERT_COP","CERT_ZON",
            "CERT_OTRO","AMPLIACION_VIV","OBRA_NUEVA_VIV","RECONSTRUCCION_V",
            "VIVIENDA_TIPO","116_BIS_F_GENERAL","116_BIS_F_ESPECIAL",
            "116_BIS_G_SIMPLIF","OBRA_PRELIMINAR","DEMOLICION","CAMBIO_DESTINO",
            "MOD_DESLINDES","REC_DESLINDES","LEY_20898","LEY_21031",
            "LEY_21052","LEY_20251"
        )
    }
)

foreach ($cf in $choiceFields) {
    $existe = Get-PnPField -List "Expedientes" -Identity $cf.Name -ErrorAction SilentlyContinue
    if (-not $existe) {
        Add-PnPField -List "Expedientes" -DisplayName $cf.Name -InternalName $cf.Name -Type Choice -Choices $cf.Choices
        Write-Host "  Campo Choice '$($cf.Name)' creado." -ForegroundColor Green
    } else {
        Write-Host "  Campo Choice '$($cf.Name)' ya existe." -ForegroundColor Gray
    }
}

Write-Host "  Lista Expedientes lista!" -ForegroundColor Cyan

# ============================================================
# LISTA 2: Documentos
# ============================================================
Write-Host "`nCreando lista Documentos..." -ForegroundColor Yellow

$listExists2 = Get-PnPList -Identity "Documentos" -ErrorAction SilentlyContinue
if ($listExists2) {
    Write-Host "  Lista 'Documentos' ya existe, omitiendo creacion." -ForegroundColor Gray
} else {
    New-PnPList -Title "Documentos" -Template GenericList -OnQuickLaunch
    Write-Host "  Lista creada." -ForegroundColor Green
}

$camposDoc = @(
    @{ Name="ExpedienteID"; Type="Text" },
    @{ Name="ArchivoURL";   Type="URL" },
    @{ Name="SubidoPor";    Type="Text" }
)

foreach ($campo in $camposDoc) {
    $existe = Get-PnPField -List "Documentos" -Identity $campo.Name -ErrorAction SilentlyContinue
    if (-not $existe) {
        Add-PnPField -List "Documentos" -DisplayName $campo.Name -InternalName $campo.Name -Type $campo.Type
        Write-Host "  Campo '$($campo.Name)' creado." -ForegroundColor Green
    }
}

$existe = Get-PnPField -List "Documentos" -Identity "TipoDoc" -ErrorAction SilentlyContinue
if (-not $existe) {
    Add-PnPField -List "Documentos" -DisplayName "TipoDoc" -InternalName "TipoDoc" -Type Choice `
        -Choices @("PERMISO","ANTEPROYECTO","PLANO","CERTIFICADO","RECEPCION","MODIFICACION","OTRO")
    Write-Host "  Campo Choice 'TipoDoc' creado." -ForegroundColor Green
}

Write-Host "  Lista Documentos lista!" -ForegroundColor Cyan

# ============================================================
# LISTA 3: Usuarios_DOM
# ============================================================
Write-Host "`nCreando lista Usuarios_DOM..." -ForegroundColor Yellow

$listExists3 = Get-PnPList -Identity "Usuarios_DOM" -ErrorAction SilentlyContinue
if ($listExists3) {
    Write-Host "  Lista 'Usuarios_DOM' ya existe, omitiendo creacion." -ForegroundColor Gray
} else {
    New-PnPList -Title "Usuarios_DOM" -Template GenericList -OnQuickLaunch
    Write-Host "  Lista creada." -ForegroundColor Green
}

$camposUser = @(
    @{ Name="Email";  Type="Text" },
    @{ Name="Activo"; Type="Boolean" }
)

foreach ($campo in $camposUser) {
    $existe = Get-PnPField -List "Usuarios_DOM" -Identity $campo.Name -ErrorAction SilentlyContinue
    if (-not $existe) {
        Add-PnPField -List "Usuarios_DOM" -DisplayName $campo.Name -InternalName $campo.Name -Type $campo.Type
        Write-Host "  Campo '$($campo.Name)' creado." -ForegroundColor Green
    }
}

$existe = Get-PnPField -List "Usuarios_DOM" -Identity "Perfil" -ErrorAction SilentlyContinue
if (-not $existe) {
    Add-PnPField -List "Usuarios_DOM" -DisplayName "Perfil" -InternalName "Perfil" -Type Choice `
        -Choices @("profesional","director","admin")
    Write-Host "  Campo Choice 'Perfil' creado." -ForegroundColor Green
}

Write-Host "  Lista Usuarios_DOM lista!" -ForegroundColor Cyan

# ============================================================
Write-Host "`n=====================================" -ForegroundColor Green
Write-Host "Listo! Las 3 listas fueron creadas en:" -ForegroundColor Green
Write-Host $SiteUrl -ForegroundColor White
Write-Host "=====================================" -ForegroundColor Green
