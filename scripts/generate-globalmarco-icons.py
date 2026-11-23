"""Generate the GlobalMarco raster icons/favicons from the vector logo design."""

from pathlib import Path
from PIL import Image, ImageDraw

IMG = Path(__file__).resolve().parent.parent / "site" / "assets" / "img"
SCALE = 8
SIZE = 64 * SCALE


def px(value: float) -> int:
    return int(round(value * SCALE))


def base_logo() -> Image.Image:
    image = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))

    # Accent orbit above the globe.
    accent = ImageDraw.Draw(image)
    accent.arc(
        (px(6), px(-8), px(54), px(40)),
        start=188,
        end=286,
        fill=(41, 208, 222, 255),
        width=px(2.4),
    )
    accent.ellipse(
        (px(52.4), px(8.4), px(57.6), px(13.6)),
        fill=(41, 208, 222, 255),
    )

    # Globe body with a simple diagonal blue gradient.
    globe_mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(globe_mask).ellipse(
        (px(4), px(5), px(60), px(61)), fill=255
    )
    gradient = Image.new("RGBA", (SIZE, SIZE), (1, 41, 112, 255))
    grad_draw = ImageDraw.Draw(gradient)
    for i in range(SIZE):
        t = i / (SIZE - 1)
        color = (
            int(10 + (1 - 10) * t),
            int(99 + (41 - 99) * t),
            int(184 + (112 - 184) * t),
            255,
        )
        grad_draw.line((i, 0, i, SIZE), fill=color)
    image.paste(gradient, (0, 0), globe_mask)

    # Globe grid, clipped to the circle.
    grid = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    grid_color = (191, 234, 255, 120)
    for ry in (10, 19):
        gd.ellipse(
            (px(5), px(33 - ry), px(59), px(33 + ry)),
            outline=grid_color,
            width=px(1),
        )
    for rx in (10, 19):
        gd.ellipse(
            (px(32 - rx), px(6), px(32 + rx), px(60)),
            outline=grid_color,
            width=px(1),
        )
    gd.line((px(5), px(33), px(59), px(33)), fill=grid_color, width=px(1))
    image = Image.composite(grid, image, globe_mask)

    # Bold M monogram.
    monogram = ImageDraw.Draw(image)
    points = [(px(16), px(46)), (px(16), px(24)), (px(32), px(39)), (px(48), px(24)), (px(48), px(46))]
    monogram.line(points, fill=(255, 255, 255, 255), width=px(4.6), joint="curve")
    monogram.ellipse(
        (px(14.4), px(22.4), px(17.6), px(25.6)),
        fill=(255, 255, 255, 255),
    )
    monogram.ellipse(
        (px(46.4), px(22.4), px(49.6), px(25.6)),
        fill=(255, 255, 255, 255),
    )
    monogram.line(
        [(px(16), px(46)), (px(16), px(24))],
        fill=(41, 208, 222, 255),
        width=px(1.5),
    )

    return image.resize((64, 64), Image.Resampling.LANCZOS)


def save_sizes(logo: Image.Image) -> None:
    logo.save(IMG / "logo-globalmarco-icon.png")
    logo.resize((16, 16), Image.Resampling.LANCZOS).save(IMG / "favicon-16.png")
    logo.resize((32, 32), Image.Resampling.LANCZOS).save(IMG / "favicon-32.png")
    logo.resize((64, 64), Image.Resampling.LANCZOS).save(IMG / "favicon.png")
    logo.resize((180, 180), Image.Resampling.LANCZOS).save(IMG / "apple-touch-icon.png")
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
    logo.save(
        IMG / "favicon.ico",
        format="ICO",
        sizes=ico_sizes,
    )


if __name__ == "__main__":
    save_sizes(base_logo())
    print("Generated GlobalMarco icons in", IMG)
