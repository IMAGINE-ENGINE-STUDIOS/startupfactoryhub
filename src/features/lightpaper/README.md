# LightPaper — architecture notes

LightPaper is the document workspace at `/lightpaper`.

## Where the code lives

| Concern | File |
| --- | --- |
| Page shell, tabs, dialogs | `src/pages/LightPaper.tsx` |
| Document editor (main surface) | `src/components/lightpaper/LightPaperDocument.tsx` |
| Spreadsheet editor | `src/components/lightpaper/LightPaperSpreadsheet.tsx` |
| Presentation editor | `src/components/lightpaper/LightPaperPresentation.tsx` |
| Project CRUD + autosave | `src/hooks/useLightPaperProjects.ts` |
| Heavy-content offloading (storage) | `src/lib/lightpaperStorage.ts` |
| Files drawer / quick nav / search | `src/components/lightpaper/{MyFilesDrawer,QuickNavigation,SearchDialog,TextSearchDialog}.tsx` |
| Genius AI writing assistant | `src/components/lightpaper/{GeniusAIBubble,GeniusAIChat,GeniusTaskRegistry}.tsx` |
| Signing / sharing | `src/pages/SignStudio.tsx`, routes `/sign/:token` |

## Data model

- `public.lightpaper_projects` — one row per document/spreadsheet/presentation.
  Listings **never** select the `content` JSONB (a drawer open used to pull
  ~20&nbsp;MB). `useLightPaperProjects.loadProject(id)` hydrates a single row on
  demand; that is why `LightPaper.openProject()` awaits before rendering.
- `public.lightpaper_share_links` — share tokens, owned by the Sign flow.
- `public.lightpaper_activity` — per-document activity ledger.

## Entry points

- Global toolbar icon (`src/components/DashboardHeader.tsx`) → `/lightpaper`.
- `Ctrl/Cmd+K` opens Quick Navigation, both here and in Sign Studio.
- `genius-open-in-lightpaper` window event opens AI-generated content as a new
  document.

## Known limitations (intentional, not bugs)

1. **Persistence covers documents only.** The spreadsheet and presentation
   editors keep state in React and are session-scoped; selecting a project of
   those types switches the tab but starts a blank editor. Adding persistence
   means giving both editors `selectedProject` props plus save handlers.
2. **Sharing goes through Sign Studio.** LightPaper does not mint its own
   share links, because only `/sign/:token` renders them. The files-drawer
   "share" action therefore routes to `/sign/studio?project=<id>`.
3. **Tab switching shows a 300&nbsp;ms skeleton** to avoid a flash of an empty
   editor while a heavy surface mounts.
