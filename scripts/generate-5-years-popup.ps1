$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$basePath = "c:\Users\hpula\Documents\trae_projects\MM projects\site\assets\img\9 years 3.png"
$outputPath = "c:\Users\hpula\Documents\trae_projects\MM projects\site\assets\img\5-years-premium.png"

$bitmap = [System.Drawing.Bitmap]::FromFile($basePath)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

function New-RoundedRectanglePath([System.Drawing.RectangleF]$rect, [float]$radius) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $radius * 2

  $path.AddArc($rect.X, $rect.Y, $diameter, $diameter, 180, 90)
  $path.AddArc($rect.Right - $diameter, $rect.Y, $diameter, $diameter, 270, 90)
  $path.AddArc($rect.Right - $diameter, $rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($rect.X, $rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

# Hide the original center artwork with a solid premium mask,
# keeping the original spotlights and stage around the edges.
$coverRect = New-Object System.Drawing.RectangleF(98, 72, 572, 568)
$coverPath = New-RoundedRectanglePath $coverRect 58
$coverBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.PointF($coverRect.X, $coverRect.Y)),
  (New-Object System.Drawing.PointF($coverRect.X, $coverRect.Bottom)),
  ([System.Drawing.Color]::FromArgb(248, 4, 3, 0)),
  ([System.Drawing.Color]::FromArgb(236, 10, 6, 0))
)
$graphics.FillPath($coverBrush, $coverPath)

$glowEllipse = New-Object System.Drawing.Drawing2D.GraphicsPath
$glowEllipse.AddEllipse(170, 90, 420, 360)
$glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($glowEllipse)
$glowBrush.CenterColor = [System.Drawing.Color]::FromArgb(85, 154, 88, 0)
$glowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 154, 88, 0))
$graphics.FillPath($glowBrush, $glowEllipse)

# Draw a strong gold 5.
$fivePath = New-Object System.Drawing.Drawing2D.GraphicsPath
$fiveFamily = New-Object System.Drawing.FontFamily("Arial Black")
$fiveFormat = New-Object System.Drawing.StringFormat
$fiveFormat.Alignment = [System.Drawing.StringAlignment]::Center
$fiveFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
$fiveRect = New-Object System.Drawing.RectangleF(155, 102, 440, 382)
$fivePath.AddString("5", $fiveFamily, [int][System.Drawing.FontStyle]::Bold, 245, $fiveRect, $fiveFormat)

$shadowMatrix = New-Object System.Drawing.Drawing2D.Matrix
$shadowMatrix.Translate(0, 14)
$fiveShadow = $fivePath.Clone()
$fiveShadow.Transform($shadowMatrix)
$shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(120, 44, 20, 0))
$graphics.FillPath($shadowBrush, $fiveShadow)

$goldBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.PointF(0, 110)),
  (New-Object System.Drawing.PointF(0, 465)),
  ([System.Drawing.Color]::FromArgb(255, 255, 246, 198)),
  ([System.Drawing.Color]::FromArgb(255, 176, 110, 0))
)
$goldBlend = New-Object System.Drawing.Drawing2D.ColorBlend
$goldBlend.Colors = @(
  [System.Drawing.Color]::FromArgb(255, 255, 248, 205),
  [System.Drawing.Color]::FromArgb(255, 244, 211, 116),
  [System.Drawing.Color]::FromArgb(255, 204, 134, 12),
  [System.Drawing.Color]::FromArgb(255, 255, 227, 132),
  [System.Drawing.Color]::FromArgb(255, 138, 84, 0)
)
$goldBlend.Positions = @(0.0, 0.18, 0.46, 0.78, 1.0)
$goldBrush.InterpolationColors = $goldBlend
$graphics.FillPath($goldBrush, $fivePath)

$outlinePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(230, 255, 230, 145), 7)
$outlinePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$graphics.DrawPath($outlinePen, $fivePath)

# Text block.
function Draw-CenteredTextPath(
  [System.Drawing.Graphics]$g,
  [string]$text,
  [string]$fontName,
  [float]$fontSize,
  [System.Drawing.RectangleF]$rect,
  [System.Drawing.Brush]$brush,
  [System.Drawing.Pen]$pen = $null
) {
  $family = New-Object System.Drawing.FontFamily($fontName)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddString($text, $family, [int][System.Drawing.FontStyle]::Bold, $fontSize, $rect, $format)
  if ($pen -ne $null) {
    $g.DrawPath($pen, $path)
  }
  $g.FillPath($brush, $path)
}

$textBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.PointF(0, 530)),
  (New-Object System.Drawing.PointF(0, 675)),
  ([System.Drawing.Color]::FromArgb(255, 255, 242, 190)),
  ([System.Drawing.Color]::FromArgb(255, 188, 119, 0))
)
$textPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(210, 89, 53, 0), 2.5)
$textPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

Draw-CenteredTextPath $graphics "5 YEARS" "Arial Black" 54 (New-Object System.Drawing.RectangleF(165, 536, 440, 60)) $textBrush $textPen
Draw-CenteredTextPath $graphics "CELEBRATION" "Arial Black" 29 (New-Object System.Drawing.RectangleF(175, 596, 420, 38)) $textBrush $null

$tagBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 245, 232, 188))
Draw-CenteredTextPath $graphics "GLOBAL CONTACT HUB" "Arial" 18 (New-Object System.Drawing.RectangleF(175, 648, 420, 28)) $tagBrush $null

$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$outlinePen.Dispose()
$textPen.Dispose()
$goldBrush.Dispose()
$shadowBrush.Dispose()
$glowBrush.Dispose()
$coverBrush.Dispose()
$graphics.Dispose()
$bitmap.Dispose()
