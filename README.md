# KernelLab

KernelLab is an interactive memory-management simulator built with React, TypeScript, and Vite.

It lets you:

- Define processes with code/data/stack/heap segments.
- Simulate contiguous and non-contiguous allocation strategies step by step.
- Compare two algorithms side by side using the same process set.
- Visualize memory state, queue behavior, and runtime statistics.

## Tech Stack

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4
- Zustand (state management)
- Framer Motion (animations)
- React Router DOM

## Scripts

```bash
npm install
npm run dev
```

Available scripts:

- `npm run dev`: start development server.
- `npm run build`: type-check and build production bundle.
- `npm run preview`: preview production build.
- `npm run lint`: run ESLint.

## Main Pages

- `/`: Home
- `/simulator`: single-algorithm simulation with step controls
- `/comparison`: side-by-side algorithm comparison
- `/about`: project documentation page

## Algorithms Included

Contiguous allocation:

- First Fit
- Best Fit
- Worst Fit
- Next Fit
- Buddy System

Non-contiguous:

- Paging (`Paginacion Simple`) with replacement strategies:
  - OPT
  - FIFO
  - LRU
  - NRU
  - Segunda Oportunidad
  - Clock
- Segmentation (`Segmentacion`)

## Project Structure

```text
KernelLab/
├─ public/
├─ src/
│  ├─ algorithms/
│  │  ├─ allocation/
│  │  ├─ nonContiguous/
│  │  ├─ paging/
│  │  ├─ replacement/
│  │  ├─ segmentation/
│  │  ├─ stepStats.ts
│  │  └─ types.ts
│  ├─ assets/
│  ├─ components/
│  │  ├─ forms/
│  │  ├─ layout/
│  │  ├─ ui/
│  │  └─ visualization/
│  ├─ hooks/
│  ├─ pages/
│  │  ├─ Home.tsx
│  │  ├─ Simulator.tsx
│  │  ├─ Comparison.tsx
│  │  └─ About.tsx
│  ├─ store/
│  ├─ utils/
│  ├─ App.tsx
│  └─ main.tsx
├─ tests/
├─ eslint.config.js
├─ index.html
├─ package.json
├─ tsconfig*.json
└─ vite.config.ts
```

## Notes

- Process validation in add/edit forms blocks saving when process size exceeds usable memory (`totalMemory - osSize`).
- The repository currently contains a `tests/slgorithms` directory (name preserved as-is).
