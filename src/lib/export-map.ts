/**
 * Exporte la carte en PNG : on copie le SVG en figeant les couleurs calculées
 * (les variables CSS ne survivent pas à la conversion en image), on le dessine
 * sur un canvas avec une légende, puis on télécharge le fichier.
 */

const STYLE_PROPS = [
  "fill",
  "fill-opacity",
  "stroke",
  "stroke-width",
  "stroke-dasharray",
  "opacity",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "letter-spacing",
  "vector-effect",
  "display",
];

const EXPORT_WIDTH = 2400;
const PADDING = 64;
const BAND = 150;

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function inlineStyles(source: SVGSVGElement) {
  const clone = source.cloneNode(true) as SVGSVGElement;
  const from = [source, ...source.querySelectorAll("*")];
  const to = [clone, ...clone.querySelectorAll("*")];
  from.forEach((element, index) => {
    const computed = getComputedStyle(element);
    const target = to[index] as Element;
    target.removeAttribute("class");
    target.setAttribute(
      "style",
      STYLE_PROPS.map((prop) => `${prop}:${computed.getPropertyValue(prop)}`).join(";"),
    );
  });
  // Vue d'ensemble : on retire le zoom, le survol et la sélection.
  clone.querySelectorAll("[data-export-skip]").forEach((node) => node.remove());
  clone.querySelector("[data-zoom-layer]")?.removeAttribute("transform");
  clone.querySelectorAll("pattern").forEach((p) => p.setAttribute("patternTransform", "rotate(45)"));
  clone.querySelectorAll("[data-point]").forEach((c) => c.setAttribute("r", "3.5"));
  return clone;
}

export async function exportMapPng(svg: SVGSVGElement, caption: string) {
  await document.fonts.ready;
  const { width, height } = svg.viewBox.baseVal;

  const clone = inlineStyles(svg);
  const scale = (EXPORT_WIDTH - PADDING * 2) / width;
  clone.setAttribute("width", String(width * scale));
  clone.setAttribute("height", String(height * scale));

  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();

    const mapHeight = height * scale;
    const canvas = document.createElement("canvas");
    canvas.width = EXPORT_WIDTH;
    canvas.height = Math.round(mapHeight + PADDING * 2 + BAND);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponible");

    ctx.fillStyle = cssVar("--surface");
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, PADDING, PADDING, EXPORT_WIDTH - PADDING * 2, mapHeight);

    const font = getComputedStyle(document.body).fontFamily;
    const baseline = PADDING + mapHeight + BAND * 0.62;
    ctx.fillStyle = cssVar("--ink");
    ctx.textBaseline = "alphabetic";
    // Titres en Inter Tight (police des titres du site), texte en Inter.
    const display = cssVar("--font-inter-tight") || font;
    ctx.font = `700 44px ${display}`;
    ctx.fillText(caption, PADDING, baseline);

    // Le logo à droite : un carré jaune bordé d'encre, puis « TravelMap ».
    ctx.font = `800 44px ${display}`;
    const name = "TravelMap";
    const textWidth = ctx.measureText(name).width;
    const textX = EXPORT_WIDTH - PADDING - textWidth;
    const square = 34;
    const squareX = textX - square - 16;
    const squareY = baseline - square - 2;
    ctx.fillText(name, textX, baseline);
    ctx.fillStyle = cssVar("--accent-yellow");
    ctx.fillRect(squareX, squareY, square, square);
    ctx.strokeStyle = cssVar("--ink");
    ctx.lineWidth = 3;
    ctx.strokeRect(squareX, squareY, square, square);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Export impossible");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "ma-carte-travelmap.png";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  } finally {
    URL.revokeObjectURL(url);
  }
}
