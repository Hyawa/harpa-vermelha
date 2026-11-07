# Harpa Vermelha

<p align="center">
  <img src="public/logo.svg" alt="Harpa Vermelha" width="160" height="160" />
</p>

<p align="center">
  <strong>Hinário mobile-first estilo Harpa Cristã, mas com músicas revolucionárias.</strong>
</p>

<p align="center">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-React-61DAFB?style=for-the-badge&logo=vite" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5A9CF5?style=for-the-badge&logo=typescript" />
  <img alt="Capacitor" src="https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=capacitor" />
  <img alt="SQLite" src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite" />
  <img alt="pnpm" src="https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm" />
</p>

> Um hinário no bolso: **86 hinos numerados (001–086)** com letra completa, busca, categorias, favoritos e modo de leitura confortável — 100% offline após o primeiro acesso.

![Preview](./public/logo.svg)

## ✨ Recursos

- 📕 **Índice numerado estilo hinário** — 001 a 086, como na Harpa Cristã
- 🔍 **Busca instantânea** por título, número ou trecho da letra
- 🏷️ **Categorias** — Todas, Internacional, Soviética, Chinesa, Romena
- ⭐ **Favoritos + recentes** — salvos localmente (`localStorage` no web, SQLite no nativo)
- 📖 **Leitor confortável** — A-/A+ (14–28px), anterior/próximo, fonte grande
- 🌙 **Modo escuro** claro/escuro
- 📱 **Mobile-first** — cabeçalho fixo, navegação inferior para polegar, funciona como app empacotado
- 💾 **Offline** — letras embutidas em `src/data/songs.json`, sem necessidade de internet

## 🚀 Como rodar

Pré-requisitos: [Node.js 20+](https://nodejs.org/) e [pnpm](https://pnpm.io/)

```bash
git clone https://github.com/seu-usuario/harpa-vermelha.git
cd harpa-vermelha
pnpm install
pnpm dev      # http://localhost:5173
```

### Build web

```bash
pnpm build    # → dist/
pnpm preview
```

### Build mobile (Android)

```bash
pnpm build
pnpm exec cap sync android
pnpm exec cap open android   # abre no Android Studio → Run / Generate APK
```

App ID: `com.harpavermelha.app`

> iOS: `pnpm exec cap add ios` (requer macOS + Xcode)

## 🗂️ Estrutura

```
harpa-vermelha/
├── android/                # projeto Capacitor Android (ícones gerados)
├── assets/                 # fontes SVG + PNG para ícones/splash
│   ├── icon.svg            # logo principal (1024x1024)
│   ├── icon-foreground.svg
│   └── splash.svg
├── public/
│   ├── logo.svg
│   └── favicon.svg
├── scripts/
│   └── fetch-songs.mjs     # importador das letras (marxists.org)
├── src/
│   ├── components/ui/      # shadcn/ui: button, input, card, badge
│   ├── data/
│   │   ├── songs.json      # 86 músicas (gerado via import:songs)
│   │   └── types.ts
│   ├── db/
│   │   └── sqlite.ts       # camada SQLite (@capacitor-community/sqlite)
│   ├── lib/utils.ts        # cn()
│   ├── App.tsx             # rotas + telas (Índice/Busca/Favoritos/Leitor)
│   ├── main.tsx
│   └── index.css           # Tailwind v4 + tokens shadcn
├── capacitor.config.ts
├── components.json         # config shadcn/ui
├── package.json
└── vite.config.ts
```

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| Build | Vite 8 + React 19 + TypeScript |
| Estilo | Tailwind CSS v4 + shadcn/ui (Radix UI) + Lucide |
| Roteamento | React Router v7 |
| Mobile | Capacitor 8 (`@capacitor/android`, `@capacitor/core`) |
| Banco | SQLite via `@capacitor-community/sqlite` |
| Ícones/Splash | `@capacitor/assets` + `sharp` (SVG → PNG) |
| Dados | `cheerio` para scraping do [marxists.org](https://www.marxists.org/portugues/tematica/musica/index.htm) |

## 📜 Dados

Baseado em:

- `CADERNO.md` do autor (índice original)
- [Arquivo Marxista na Internet — Música Revolucionária](https://www.marxists.org/portugues/tematica/musica/index.htm)
  - Principal: A Internacional + Internacional (22) + Che Guevara (20)
  - Soviética (`sovietica.htm`)
  - Chinesa — Songs of the Cultural Revolution
  - Romena (`romana/tematica/muzica/`)

### Atualizar as letras

```bash
pnpm run import:songs   # re-raspa marxists.org e regenera src/data/songs.json
pnpm build
```

> Algumas páginas antigas usam encoding `windows-1252`. O script usa `TextDecoder` — caracteres acentuados podem gerar glifos em páginas legadas; re-rodar o import resolve para novas páginas.

### SQLite

`src/db/sqlite.ts` cria as tabelas no app nativo:

```sql
CREATE TABLE songs (id, number, title, category, source_url, lyrics);
CREATE TABLE favorites (song_id, created_at);
```

No web, usa `localStorage` como fallback. Seed automático a partir de `songs.json` na primeira abertura.

## 🎨 Logo / Ícones

- Paleta: vermelho revolucionário `#C1272D`, preto `#1A1A1A`, creme papel `#F5EFE0`
- Conceito: livro de hino aberto + estrela vermelha como nota musical
- Gerar/ atualizar ícones Android/iOS:

```bash
# 1. edite assets/icon.svg
# 2. rasterize com sharp (ver histórico) para assets/icon.png
pnpm exec capacitor-assets generate --android --ios --iconBackgroundColor "#1A1A1A" --splashBackgroundColor "#F5EFE0"
```

> Registre seu projeto com `pnpm dlx shadcn@latest init -t vite` (documentado no histórico). No Windows o `init -d --base radix` atual tem bug de path — os componentes foram movidos manualmente e o import ajustado para `@/lib/utils`.

## 🤝 Contribuindo

1. Fork este repo
2. Crie uma branch: `git checkout -b feat/sua-ideia`
3. Commit: `git commit -m "feat: sua ideia"`
4. Push e abra um PR

## 📄 Licença

Uso educacional. Letras e fontes pertencem ao [marxists.org](https://www.marxists.org/portugues/tematica/musica/index.htm) e aos autores originais. Este projeto é um hinário de leitura pessoal sem fins comerciais.

---

Feito com ❤️ para leitura, canto e estudo — mobile first, offline first.
