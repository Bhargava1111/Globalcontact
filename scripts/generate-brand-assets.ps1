$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = "c:\Users\hpula\Documents\trae_projects\MM projects\site\assets\img"
$logoPath = Join-Path $root "logo-globalmarco-icon.png"
$popupPath = Join-Path $root "5-years-local.png"

function New-Brush([int]$a, [int]$r, [int]$g, [int]$b) {
  return New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($a, $r, $g, $b))
}

function Save-Png($bitmap, $path) {
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

function New-RoundedPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$radius) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $radius * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

# Logo PNG
$logo = New-Object System.Drawing.Bitmap 420, 84
$g = [System.Drawing.Graphics]::FromImage($logo)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)

$gradRect = New-Object System.Drawing.Rectangle 8, 10, 56, 56
$grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush($gradRect, [System.Drawing.Color]::FromArgb(255, 155, 220, 255), [System.Drawing.Color]::FromArgb(255, 9, 95, 182), 45)
$g.FillEllipse($grad, $gradRect)
$g.FillEllipse((New-Brush 255 230 246 255), 18, 20, 36, 36)

$whiteBrush = New-Brush 255 255 255 255
$accentBrush = New-Brush 255 12 103 196
$g.FillPie($whiteBrush, 19, 21, 34, 34, 112, 136)
$g.FillPie($whiteBrush, 27, 18, 24, 14, 210, 120)
$g.FillPie($whiteBrush, 24, 44, 26, 10, 10, 130)
$g.FillRectangle($accentBrush, 39, 35, 18, 8)
$g.FillPie($accentBrush, 28, 24, 30, 30, 340, 110)
$g.FillEllipse((New-Brush 255 111 71 239), 49, 14, 7, 7)
$penAccent = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 41, 208, 222), 3)
$penAccent.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$penAccent.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$g.DrawLine($penAccent, 19, 17, 25, 13)

$titleFont = New-Object System.Drawing.Font("Arial", 20, [System.Drawing.FontStyle]::Bold)
$tagFont = New-Object System.Drawing.Font("Arial", 8.5, [System.Drawing.FontStyle]::Bold)
$titleBrush = New-Brush 255 8 28 86
$tagBrush = New-Brush 255 117 131 150
$g.DrawString("GlobalMarco", $titleFont, $titleBrush, 78, 21)
$g.DrawString("BUSINESS DATA AND DIGITAL GROWTH", $tagFont, $tagBrush, 80, 49)

$g.Dispose()
Save-Png $logo $logoPath

# 5 years popup PNG
$bmp = New-Object System.Drawing.Bitmap 760, 760
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$bgRect = New-Object System.Drawing.Rectangle 0, 0, 760, 760
$bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($bgRect, [System.Drawing.Color]::FromArgb(255, 6, 4, 0), [System.Drawing.Color]::FromArgb(255, 18, 10, 0), 90)
$graphics.FillRectangle($bg, $bgRect)

$leftBeam = New-Object System.Drawing.Point[](3)
$leftBeam[0] = New-Object System.Drawing.Point 0, 0
$leftBeam[1] = New-Object System.Drawing.Point 118, 0
$leftBeam[2] = New-Object System.Drawing.Point 186, 274
$rightBeam = New-Object System.Drawing.Point[](3)
$rightBeam[0] = New-Object System.Drawing.Point 760, 0
$rightBeam[1] = New-Object System.Drawing.Point 642, 0
$rightBeam[2] = New-Object System.Drawing.Point 574, 274
$centerBeam = New-Object System.Drawing.Point[](3)
$centerBeam[0] = New-Object System.Drawing.Point 330, 0
$centerBeam[1] = New-Object System.Drawing.Point 430, 0
$centerBeam[2] = New-Object System.Drawing.Point 380, 250
$graphics.FillPolygon((New-Brush 72 255 198 75), $leftBeam)
$graphics.FillPolygon((New-Brush 72 255 198 75), $rightBeam)
$graphics.FillPolygon((New-Brush 92 255 214 110), $centerBeam)

$rand = New-Object System.Random 17
for ($i = 0; $i -lt 450; $i++) {
  $x = $rand.Next(20, 740)
  $y = $rand.Next(30, 720)
  $size = $rand.Next(2, 5)
  $alpha = $rand.Next(60, 170)
  $brush = New-Brush $alpha 255 205 100
  $graphics.FillEllipse($brush, $x, $y, $size, $size)
}

$glow = New-Object System.Drawing.Drawing2D.PathGradientBrush((New-RoundedPath 180 80 400 380 160))
$glow.CenterColor = [System.Drawing.Color]::FromArgb(85, 255, 195, 60)
$glow.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 255, 195, 60))
$graphics.FillEllipse($glow, 180, 80, 400, 380)

$fivePath = New-Object System.Drawing.Drawing2D.GraphicsPath
$fmt = New-Object System.Drawing.StringFormat
$fmt.Alignment = [System.Drawing.StringAlignment]::Center
$fmt.LineAlignment = [System.Drawing.StringAlignment]::Center
$fiveRect = New-Object System.Drawing.RectangleF 160, 96, 440, 330
$fivePath.AddString("5", (New-Object System.Drawing.FontFamily("Arial Black")), [int][System.Drawing.FontStyle]::Regular, 250, $fiveRect, $fmt)
$gold = New-Object System.Drawing.Drawing2D.LinearGradientBrush(([System.Drawing.Point]::new(0, 110)), ([System.Drawing.Point]::new(0, 430)), [System.Drawing.Color]::FromArgb(255, 255, 244, 202), [System.Drawing.Color]::FromArgb(255, 183, 111, 0))
$blend = New-Object System.Drawing.Drawing2D.ColorBlend
$blend.Colors = @(
  [System.Drawing.Color]::FromArgb(255, 255, 244, 202),
  [System.Drawing.Color]::FromArgb(255, 244, 214, 122),
  [System.Drawing.Color]::FromArgb(255, 205, 135, 14),
  [System.Drawing.Color]::FromArgb(255, 255, 228, 140),
  [System.Drawing.Color]::FromArgb(255, 135, 82, 0)
)
$blend.Positions = @(0.0, 0.22, 0.5, 0.76, 1.0)
$gold.InterpolationColors = $blend
$shadowMatrix = New-Object System.Drawing.Drawing2D.Matrix
$shadowMatrix.Translate(0, 12)
$shadowPath = $fivePath.Clone()
$shadowPath.Transform($shadowMatrix)
$graphics.FillPath((New-Brush 100 56 31 0), $shadowPath)
$graphics.FillPath($gold, $fivePath)
$outline = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(235, 255, 226, 140), 7)
$outline.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$graphics.DrawPath($outline, $fivePath)

$stageShadow = New-Brush 255 12 8 0
$graphics.FillEllipse($stageShadow, 150, 616, 460, 72)
$stageGold = New-Object System.Drawing.Drawing2D.LinearGradientBrush(([System.Drawing.Point]::new(0, 560)), ([System.Drawing.Point]::new(0, 670)), [System.Drawing.Color]::FromArgb(255, 254, 221, 120), [System.Drawing.Color]::FromArgb(255, 145, 87, 0))
$graphics.FillEllipse($stageGold, 170, 562, 420, 96)
$graphics.FillEllipse((New-Brush 210 255 239 165), 212, 585, 336, 30)
$graphics.FillEllipse((New-Brush 255 90 52 0), 138, 646, 484, 40)

$textGold = New-Object System.Drawing.Drawing2D.LinearGradientBrush(([System.Drawing.Point]::new(0, 500)), ([System.Drawing.Point]::new(0, 640)), [System.Drawing.Color]::FromArgb(255, 255, 239, 185), [System.Drawing.Color]::FromArgb(255, 188, 120, 3))
$font1 = New-Object System.Drawing.Font("Arial", 46, [System.Drawing.FontStyle]::Bold)
$font2 = New-Object System.Drawing.Font("Arial", 24, [System.Drawing.FontStyle]::Bold)
$font3 = New-Object System.Drawing.Font("Arial", 18, [System.Drawing.FontStyle]::Bold)
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$graphics.DrawString("5 YEARS", $font1, $textGold, 380, 500, $sf)
$graphics.DrawString("CELEBRATION", $font2, $textGold, 380, 555, $sf)
$graphics.DrawString("GLOBALMARCO", $font3, (New-Brush 255 248 236 198), 380, 610, $sf)

$graphics.Dispose()
Save-Png $bmp $popupPath
