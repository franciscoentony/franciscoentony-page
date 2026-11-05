/*
 * Prepara o HTML do post (vindo do Hugo) antes de ir para a página
 * (adendo v3, docs/redesign/HANDOFF-ADENDO-V3-PROJETO-POST.md).
 *
 * O render hook do Hugo põe cada imagem numa moldura (.media-frame) dentro
 * de um <p>. Aqui:
 * - capa: se o post não tem `cover` e o corpo COMEÇA com uma imagem, ela
 *   sobe para a capa (e sai do corpo);
 * - 2 imagens seguidas viram um par lado a lado, com alturas iguais
 *   (<figure class="fig"> com <div class="pair">) e uma legenda por par.
 *   Duas verticais vão na trilha média (880px, .mid); com alguma horizontal,
 *   o par fica na coluna do texto (640px);
 * - imagem sozinha: horizontal na trilha média (.mid); vertical na coluna,
 *   com altura limitada (.portrait);
 * - a legenda vem do data-caption (título da imagem no Markdown);
 * - também lista os h2 e conta as palavras.
 * As molduras já têm a proporção reservada, então nada disso causa CLS.
 */

export interface PostCover {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  width?: number;
  height?: number;
  caption?: string;
}

export interface PostHeading {
  id: string;
  text: string;
}

export interface PreparedPost {
  /** Imagem de abertura que virou capa (null = sem imagem de abertura). */
  openingImage: PostCover | null;
  bodyHtml: string;
  headings: PostHeading[];
  wordCount: number;
}

/** Índice só com 3+ h2 e 900+ palavras (adendo B1, item 9). */
export function shouldShowToc(headings: PostHeading[], wordCount: number) {
  return headings.length >= 3 && wordCount >= 900;
}

/** <p> que só contém uma moldura de imagem (sem texto). */
function isImageParagraph(element: Element | null): element is HTMLElement {
  return (
    !!element &&
    element.tagName === "P" &&
    element.children.length === 1 &&
    element.firstElementChild!.classList.contains("media-frame") &&
    (element.textContent ?? "").trim() === ""
  );
}

/** Foto vertical (o render hook marca com post-image-portrait). */
function isPortrait(frame: Element) {
  return frame.classList.contains("post-image-portrait");
}

function frameOf(paragraph: Element): HTMLElement {
  return paragraph.firstElementChild as HTMLElement;
}

function makeCaption(doc: Document, text: string | undefined) {
  if (!text) return null;
  const caption = doc.createElement("figcaption");
  caption.className = "cap";
  caption.textContent = text;
  return caption;
}

/**
 * @param html HTML do corpo (já com os caminhos reescritos por resolveContentHtml)
 * @param hasCoverField true se o post já tem o campo `cover`
 */
export function preparePostContent(
  html: string,
  hasCoverField: boolean,
): PreparedPost {
  const doc = new DOMParser().parseFromString(
    `<div id="post-root">${html}</div>`,
    "text/html",
  );
  const root = doc.getElementById("post-root")!;

  // 1. Capa a partir da imagem de abertura
  let openingImage: PostCover | null = null;
  const first = root.firstElementChild;
  if (!hasCoverField && isImageParagraph(first)) {
    const frame = frameOf(first);
    const img = frame.querySelector("img")!;
    openingImage = {
      src: img.getAttribute("src") ?? "",
      srcSet: img.getAttribute("srcset") ?? undefined,
      sizes: img.getAttribute("sizes") ?? undefined,
      alt: img.getAttribute("alt") ?? "",
      width: Number(img.getAttribute("width")) || undefined,
      height: Number(img.getAttribute("height")) || undefined,
      caption: frame.dataset.caption,
    };
    first.remove();
  }

  // 2. Figuras: pares lado a lado e imagens sozinhas
  for (const element of Array.from(root.children)) {
    if (!element.isConnected || !isImageParagraph(element)) continue;

    const next = element.nextElementSibling;
    const figure = doc.createElement("figure");
    const frame = frameOf(element);

    if (isImageParagraph(next)) {
      // Par: alturas iguais (cada foto pesa --r = largura/altura)
      const second = frameOf(next);
      const row = doc.createElement("div");
      const bothPortrait = [frame, second].every(isPortrait);
      row.className = "pair";
      row.append(frame, second);
      figure.className = bothPortrait ? "fig mid" : "fig";
      figure.append(row);
      const caption = makeCaption(
        doc,
        frame.dataset.caption || second.dataset.caption,
      );
      if (caption) figure.append(caption);
      element.replaceWith(figure);
      next.remove();
    } else {
      figure.className = isPortrait(frame) ? "fig portrait" : "fig mid";
      figure.append(frame);
      const caption = makeCaption(doc, frame.dataset.caption);
      if (caption) figure.append(caption);
      element.replaceWith(figure);
    }
  }

  // 3. Índice e tamanho do texto
  const headings = Array.from(root.querySelectorAll("h2"))
    .filter((heading) => heading.id)
    .map((heading) => ({
      id: heading.id,
      text: (heading.textContent ?? "").trim(),
    }));
  const wordCount = (root.textContent ?? "")
    .split(/\s+/)
    .filter(Boolean).length;

  return { openingImage, bodyHtml: root.innerHTML, headings, wordCount };
}

/**
 * Foto que representa um post (usada no "Próximo post."): o campo `cover`
 * ou, sem ele, a 1ª imagem do corpo. null se o post não tem imagem.
 * @param contentHtml corpo já com os caminhos reescritos (resolveContentHtml)
 */
export function getPostPhoto(
  coverSrc: string | null,
  contentHtml: string,
): PostCover | null {
  if (coverSrc) return { src: coverSrc, alt: "" };
  const doc = new DOMParser().parseFromString(contentHtml, "text/html");
  const img = doc.querySelector("img");
  const src = img?.getAttribute("src");
  if (!img || !src) return null;
  return {
    src,
    srcSet: img.getAttribute("srcset") ?? undefined,
    alt: img.getAttribute("alt") ?? "",
    width: Number(img.getAttribute("width")) || undefined,
    height: Number(img.getAttribute("height")) || undefined,
  };
}
