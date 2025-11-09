# React Blob Uploader Library

## Overview

## Key Principles
- Framework-agnostic architecture (no dependency on Redux, Zustand, etc.)
- Flat mutation results (`{ success, hash, ... }`) for predictable handling
- Comprehensive state machine with 19 lifecycle states (including failed states)
- Tailwind-first styling with overrideable class map
- Published with committed `dist/` for Git-based installs (pnpm compatible)

## Core Components
- `Uploader` – orchestrates blob list, mutations, and styling overrides
- `Blob` – manages per-file lifecycle and retry UX
- `SortableBlob` – drag-and-drop wrapper using `@dnd-kit`

## Expected Mutation Contracts
- `getUploadUrl`, `directUpload`, `createBlob`, `createAttachment`, `deleteAttachment`, `getPreviewUrl`
- Each returns `{ success: boolean; hash: string; ... }` with relevant payload or `error`

## Styling System
- 14 customizable class slots (`blobContainerClassName`, `retryButtonClassName`, etc.)
- Deprecated `photo*` props still accepted for backward compatibility (mapped internally)

## Development Commands
```bash
pnpm install
pnpm run dev   # Storybook/examples
pnpm run build # Generates dist/
```

## Publishing Notes
- Versioned via GitHub tags; downstream apps install with `pnpm add github:abdulmughniHamzah/react-blob-uploader`
- Ensure `dist/` and type declarations are committed before tagging

## Documentation
- Primary reference: `README.md`
- Update README and this overview whenever component APIs, props, or lifecycle change
