# Gera dist\A Terra que Rejeitou - Instalador.exe usando só o que já vem no Windows (.NET Framework 4).
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File instalador\construir.ps1
$ErrorActionPreference = 'Stop'
$aqui = Split-Path -Parent $MyInvocation.MyCommand.Path
$raiz = Split-Path -Parent $aqui
$obra = Join-Path $aqui 'obra'
$dist = Join-Path $raiz 'dist'
$csc = 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe'
Add-Type -AssemblyName System.Drawing, System.IO.Compression, System.IO.Compression.FileSystem
if (Test-Path $obra) { Remove-Item $obra -Recurse -Force }
New-Item -ItemType Directory -Force $obra, $dist | Out-Null

# ---------- ícone e emblema: o selo do jogo, recortado em círculo ----------
$foto = [System.Drawing.Image]::FromFile((Join-Path $raiz 'assets\ui\start-button.jpg'))
function Selo([int]$n) {
  $b = New-Object System.Drawing.Bitmap $n, $n, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($b)
  $g.SmoothingMode = 'AntiAlias'; $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $p.AddEllipse(0, 0, $n - 1, $n - 1)
  $g.SetClip($p)
  $g.DrawImage($foto, 0, 0, $n, $n)
  $g.Dispose()
  return $b
}
$tamanhos = 16, 24, 32, 48, 64, 256
$pngs = @{}
foreach ($n in $tamanhos) { $b = Selo $n; $m = New-Object IO.MemoryStream; $b.Save($m, [System.Drawing.Imaging.ImageFormat]::Png); $pngs[$n] = $m.ToArray(); $b.Dispose() }
$ico = Join-Path $obra 'jogo.ico'
$w = New-Object IO.BinaryWriter ([IO.File]::Create($ico))
$w.Write([uint16]0); $w.Write([uint16]1); $w.Write([uint16]$tamanhos.Count)
$pos = 6 + 16 * $tamanhos.Count
foreach ($n in $tamanhos) {
  $lado = [byte]$(if ($n -ge 256) { 0 } else { $n })
  $w.Write($lado); $w.Write($lado); $w.Write([byte]0); $w.Write([byte]0); $w.Write([uint16]1); $w.Write([uint16]32)
  $w.Write([uint32]$pngs[$n].Length); $w.Write([uint32]$pos); $pos += $pngs[$n].Length
}
foreach ($n in $tamanhos) { $w.Write($pngs[$n]) }
$w.Close()
$emb = Selo 168; $emb.Save((Join-Path $obra 'emblema.png'), [System.Drawing.Imaging.ImageFormat]::Png); $emb.Dispose()
$foto.Dispose()

# ---------- os arquivos do jogo (sem ferramentas nem a imagem da tela que saiu) ----------
$zip = Join-Path $obra 'jogo.zip'
$a = [IO.Compression.ZipFile]::Open($zip, 'Create')
$lista = @(Get-Item (Join-Path $raiz 'index.html')) + (Get-ChildItem (Join-Path $raiz 'css'), (Join-Path $raiz 'js'), (Join-Path $raiz 'assets') -Recurse -File)
foreach ($f in $lista) {
  $rel = $f.FullName.Substring($raiz.Length + 1).Replace('\', '/')
  if ($rel -eq 'assets/ui/start-button.jpg') { continue }
  $nivel = if ($f.Extension -in '.mp4', '.mp3') { 'NoCompression' } else { 'Optimal' }
  [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($a, $f.FullName, $rel, $nivel)
}
$a.Dispose()

# ---------- compilar ----------
$comum = '/nologo', '/optimize+', '/target:winexe', '/platform:anycpu', '/codepage:65001', "/win32icon:$ico", "/win32manifest:$aqui\app.manifest", '/r:System.dll', '/r:System.Core.dll', '/r:System.Drawing.dll', '/r:System.Windows.Forms.dll'
$jogoExe = Join-Path $obra 'jogo.exe'
& $csc @comum "/out:$jogoExe" "$aqui\Jogo.cs"
if ($LASTEXITCODE) { throw 'falhou ao compilar o jogo' }
$saida = Join-Path $dist 'A Terra que Rejeitou - Instalador.exe'
& $csc @comum '/r:Microsoft.CSharp.dll' '/r:System.IO.Compression.dll' '/r:System.IO.Compression.FileSystem.dll' "/resource:$zip,jogo.zip" "/resource:$jogoExe,jogo.exe" "/resource:$obra\emblema.png,emblema.png" "/out:$saida" "$aqui\Instalador.cs"
if ($LASTEXITCODE) { throw 'falhou ao compilar o instalador' }
Remove-Item $obra -Recurse -Force
"pronto: $saida ({0:N1} MB)" -f ((Get-Item $saida).Length / 1MB)
