# franciscoentony.com

Site pessoal, portfólio e blog de Francisco Entony. Feito em React 19, TypeScript, Vite e Tailwind v4. O blog é escrito em Markdown e compilado pelo Hugo para JSON.

```bash
bun install
bun run dev:react   # site em http://localhost:5173
bun run dev:hugo    # recompila o blog a cada alteração (rode junto com o dev:react)
bun run build       # build completo (Hugo + Vite + páginas estáticas)
bun run preview     # o build, como vai ao ar (http://localhost:4173)
```

## Como criar um post no blog

Os posts ficam em `blog-cms/content/posts/`, um arquivo `.md` por post. O nome do arquivo vira o endereço do post: `meu-post.md` → `franciscoentony.com/blog/meu-post/`. Use letras minúsculas, números e hífens, sem acentos.

### 1. Crie o arquivo

```bash
hugo new content -s blog-cms posts/meu-post.md
```

Ou copie um post existente e troque o conteúdo. O começo do arquivo (entre os `+++`) tem os dados do post:

```toml
+++
date = '2026-11-07T10:00:00-03:00'
draft = false
title = 'Título do post'
excerpt = 'Uma ou duas frases sobre o post. Aparece nos cards do blog e na prévia do link.'
tags = ["Palestras", "IFRN"]
+++
```

| Campo          | Obrigatório | Para que serve                                                                                        |
| -------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| `title`        | sim         | Título do post                                                                                        |
| `date`         | sim         | Data de publicação. Define a ordem no blog e o "próximo post"                                         |
| `draft`        | sim         | `true` deixa o post fora do site; troque para `false` para publicar                                   |
| `excerpt`      | recomendado | Resumo dos cards e da prévia do link. Sem ele, usa o começo do texto                                  |
| `tags`         | não         | Até 3 aparecem nos cards (`"Palestras"`, `"Viagens"`, `"IFRN"`…)                                      |
| `cover`        | não         | Imagem de capa (`/blog/images/posts/meu-post/capa.jpg`). Sem ela, a capa é a primeira imagem do texto |
| `coverCaption` | não         | Legenda da capa                                                                                       |
| `readTime`     | não         | Ex.: `'4 min de leitura'`. Sem ele, é calculado pelo tamanho do texto                                 |

### 2. Escreva o texto

Depois do segundo `+++`, escreva em Markdown normal: parágrafos, `## intertítulos`, **negrito**, listas e links.

**Imagens:**

1. Coloque as fotos em `blog-cms/static/images/posts/meu-post/`, uma pasta por post.
2. No texto, use o caminho começando por `/blog/images/posts/`:

```markdown
![Descrição da foto para quem não enxerga](/blog/images/posts/meu-post/foto1.jpg "Legenda que aparece embaixo da foto")
```

- O texto entre `[ ]` é a descrição para leitores de tela. É obrigatório: descreva o que aparece na foto.
- O texto entre aspas, depois do caminho, é a legenda. É opcional.
- Duas imagens seguidas, sem texto entre elas, viram um par lado a lado.
- Fotos muito grandes deixam o site lento. Prefira JPEG com até ~2400px no lado maior.

### 3. Prepare as imagens

Depois de adicionar ou trocar fotos, rode:

```bash
python3 scripts/post-images.py
```

O script cria as versões menores para celular (`-800w.jpg`) e anota o tamanho de cada foto, o que evita que a página "pule" enquanto carrega. Ele precisa do Pillow (`pip install pillow`).

### 4. Confira e publique

```bash
bun run dev:hugo     # num terminal
bun run dev:react    # em outro; abra http://localhost:5173/blog
```

Quando estiver tudo certo:

1. Rode `bun run build`. Isso atualiza `public/blog-data/`, que vai junto no commit.
2. Faça commit do post, das imagens, de `blog-cms/data/post-images.json` e de `public/blog-data/` numa branch.
3. Abra um PR para a `main`. Ao fazer o merge, o GitHub Actions publica o site sozinho.

> Nunca faça commit direto na `main`: todo push nela vai para produção.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
