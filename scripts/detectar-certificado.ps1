# ============================================================================
# detectar-certificado.ps1
# Detecta certificados digitales validos en Windows y los exporta a .p12
# Ejecutar: powershell -ExecutionPolicy Bypass -File .\scripts\detectar-certificado.ps1
# ============================================================================

$ErrorActionPreference = "SilentlyContinue"
$OutputDir = Join-Path $PSScriptRoot "..\certificados"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  CertiDocs - Detector de Certificados Digitales" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Buscar en almacen de certificados Personal (My) ─────────────────────
Write-Host "Buscando certificados con clave privada..." -ForegroundColor Yellow
Write-Host ""

$certStore = New-Object System.Security.Cryptography.X509Certificates.X509Store("My", "CurrentUser")
$certStore.Open("ReadOnly")
$certsConClave = $certStore.Certificates | Where-Object { $_.HasPrivateKey }
$certStore.Close()

$listaCerts = @()

if ($certsConClave.Count -eq 0) {
    Write-Host "  No se encontraron certificados con clave privada." -ForegroundColor Red
} else {
    Write-Host ("  Certificados encontrados: " + $certsConClave.Count) -ForegroundColor Green
    Write-Host ""

    $i = 1
    foreach ($cert in $certsConClave) {
        $subject    = $cert.Subject
        $emisor     = $cert.Issuer
        $validHasta = $cert.NotAfter.ToString("dd/MM/yyyy")
        $thumbprint = $cert.Thumbprint
        $esValido   = $cert.NotAfter -gt (Get-Date)
        $estado     = if ($esValido) { "VALIDO" } else { "EXPIRADO" }
        $color      = if ($esValido) { "Green" } else { "Red" }

        Write-Host ("  [" + $i + "] " + $estado) -ForegroundColor $color
        Write-Host ("      Sujeto    : " + $subject)
        Write-Host ("      Emisor    : " + $emisor)
        Write-Host ("      Expira    : " + $validHasta)
        Write-Host ("      Thumbprint: " + $thumbprint)
        Write-Host ""

        $listaCerts += [PSCustomObject]@{
            Index      = $i
            Subject    = $subject
            Issuer     = $emisor
            ValidUntil = $validHasta
            Thumbprint = $thumbprint
            EsValido   = $esValido
            Cert       = $cert
        }
        $i++
    }
}

# ── 2. Buscar archivos .pfx / .p12 ──────────────────────────────────────────
Write-Host ""
Write-Host "Buscando archivos .pfx / .p12 en rutas habituales..." -ForegroundColor Yellow
Write-Host ""

$rutasBusqueda = @(
    "$env:USERPROFILE\Desktop",
    "$env:USERPROFILE\Downloads",
    "$env:USERPROFILE\Documents",
    "$env:USERPROFILE",
    "C:\certificados",
    "D:\certificados",
    (Join-Path $PSScriptRoot "..")
)

$archivosEncontrados = @()
foreach ($ruta in $rutasBusqueda) {
    if (Test-Path $ruta) {
        $archivos = Get-ChildItem -Path $ruta -Include "*.pfx","*.p12" -Recurse -Depth 3 -ErrorAction SilentlyContinue
        foreach ($arch in $archivos) {
            Write-Host ("  Archivo: " + $arch.FullName) -ForegroundColor Green
            $archivosEncontrados += $arch.FullName
        }
    }
}

if ($archivosEncontrados.Count -eq 0) {
    Write-Host "  No se encontraron archivos .pfx/.p12." -ForegroundColor Yellow
}

# ── 3. Exportar certificado ──────────────────────────────────────────────────
Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan

$certsValidos = $listaCerts | Where-Object { $_.EsValido }

if ($certsValidos -and $certsValidos.Count -gt 0) {
    Write-Host ""
    $seleccion = Read-Host "Escribe el numero del certificado que quieres exportar (ej: 1)"

    $certElegido = $listaCerts | Where-Object { $_.Index -eq [int]$seleccion }

    if ($certElegido) {
        $passwordText = Read-Host "Introduce una contrasena para proteger el archivo .p12 (minimo 6 caracteres)"

        if ($passwordText.Length -lt 6) {
            Write-Host "  La contrasena debe tener al menos 6 caracteres." -ForegroundColor Red
            exit 1
        }

        $outputPath   = Join-Path $OutputDir "certificado.p12"
        $base64Path   = Join-Path $OutputDir "certificado_base64.txt"

        try {
            $pfxBytes = $certElegido.Cert.Export(
                [System.Security.Cryptography.X509Certificates.X509ContentType]::Pkcs12,
                $passwordText
            )
            [System.IO.File]::WriteAllBytes($outputPath, $pfxBytes)

            $base64 = [Convert]::ToBase64String($pfxBytes)
            [System.IO.File]::WriteAllText($base64Path, $base64)

            Write-Host ""
            Write-Host "  Certificado exportado correctamente:" -ForegroundColor Green
            Write-Host ("  Archivo .p12 : " + $outputPath) -ForegroundColor Green
            Write-Host ("  Base64 txt   : " + $base64Path) -ForegroundColor Green
            Write-Host ""
            Write-Host "  SIGUIENTE PASO:" -ForegroundColor Cyan
            Write-Host ("  1. Abre el archivo: " + $base64Path) -ForegroundColor White
            Write-Host "  2. Copia TODO el contenido" -ForegroundColor White
            Write-Host "  3. Pega en D:\PROYECTO DS\.env como:" -ForegroundColor White
            Write-Host ""
            Write-Host "     CERT_P12_BASE64=<pega aqui el contenido>" -ForegroundColor Yellow
            Write-Host ("     CERT_P12_PASSWORD=" + $passwordText) -ForegroundColor Yellow
            Write-Host ""

        } catch {
            Write-Host ("  Error al exportar: " + $_) -ForegroundColor Red
            Write-Host "  Algunos certificados no permiten exportar la clave privada." -ForegroundColor Yellow
            Write-Host "  Si usas FNMT, reinstala marcando la opcion Exportable." -ForegroundColor Yellow
        }
    } else {
        Write-Host "  Numero no valido." -ForegroundColor Red
    }

} elseif ($archivosEncontrados.Count -gt 0) {
    Write-Host ""
    Write-Host "  Tienes archivos .pfx/.p12. Para convertirlos a base64:" -ForegroundColor Cyan
    Write-Host "  Ejecuta en PowerShell:" -ForegroundColor White
    Write-Host '  $bytes = [IO.File]::ReadAllBytes("RUTA_AL_ARCHIVO.p12")' -ForegroundColor Yellow
    Write-Host '  [Convert]::ToBase64String($bytes) | Out-File "D:\PROYECTO DS\certificados\certificado_base64.txt"' -ForegroundColor Yellow
    Write-Host "  Luego copia el contenido al .env como CERT_P12_BASE64" -ForegroundColor White

} else {
    Write-Host ""
    Write-Host "  No se encontro ningun certificado digital." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Opciones:" -ForegroundColor Cyan
    Write-Host "  A) Certificado FNMT  : sede.fnmt.gob.es/certificados/persona-fisica" -ForegroundColor White
    Write-Host "  B) Clave Permanente  : clave.gob.es" -ForegroundColor White
    Write-Host "  C) DNIe con lector   : dnielectronico.es" -ForegroundColor White
    Write-Host ""
    Write-Host "  Dile a Claude que tipo de certificado tienes y te guiara." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""
