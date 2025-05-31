# Project Knowledge Base: Grocery Voice Assistant

## 1. Project Overview

The Grocery Voice Assistant is a web application designed to help users manage their grocery lists using voice commands. It leverages natural language processing to understand user requests for adding, removing, and modifying grocery items.

**Key Technologies:**
- **Frontend:** Next.js (React framework), TypeScript, Tailwind CSS
- **Backend (API Routes):** Next.js API Routes
- **AI/NLP:** OpenAI API (for transcription and grocery item parsing)
- **UI Components:** Shadcn UI (implied by `components.json` and `components/ui` directory), custom React components
- **Testing:** Custom evaluation framework for NLP, Browserbase/Stagehand for UI smoke tests.

## 2. Directory Structure

- **`/app`**: Contains the core application code for the Next.js App Router.
  - **`/app/api`**: Houses API route handlers.
    - **`/app/api/parse_groceries`**: Endpoint for parsing grocery items from text (likely after transcription).
    - **`/app/api/transcribe`**: Endpoint for voice transcription.
  - **`/app/layout.tsx`**: Main layout component for the application.
  - **`/app/page.tsx`**: Main page component (home page).
  - **`/app/globals.css`**: Global stylesheets.

- **`/components`**: Contains reusable React components used throughout the application.
  - **`/components/ui`**: Likely contains generic UI components, potentially from Shadcn UI (e.g., buttons, inputs, cards).
  - **`grocery-item.tsx`**: Component to display a single grocery item.
  - **`grocery-list.tsx`**: Component to display the list of grocery items.
  - **`transcript-panel.tsx`**: Component to display transcription results.
  - **`usual-groceries.tsx`**: Component for managing the user's list of 'usual groceries' to improve transcription accuracy.
  - **`voice-recorder.tsx`**: Component for handling voice recording.

- **`/lib`**: Contains core business logic, services, utility functions, and AI prompts.
  - **`/lib/services`**: Houses services that interact with external APIs (e.g., OpenAI) and manage application data.
    - `openai-service.ts`: Service for interacting with the OpenAI API.
    - `grocery-service.ts`: Service for managing grocery list logic.
  - **`/lib/prompts`**: Stores prompt templates used for AI model interactions.
  - **`/lib/utils.ts`**: General utility functions.
  - **`/lib/mock-data.ts`**: Contains mock data, likely for testing or development.

- **`/public`**: Stores static assets like images, fonts, etc., directly accessible via the web server.

- **`/styles`**: May contain additional global or component-specific stylesheets not covered by Tailwind CSS or `globals.css`.

- **`/evals`**: Contains scripts and configurations for evaluating the performance of the application, particularly the grocery item parsing and list modification logic.
  - **`/evals/scripts/run-grocery-eval.sh`**: Shell script to run evaluations.
  - **`/evals/scripts/run-grocery-eval.ts`**: TypeScript script for running evaluations.

- **`/tests`**: Contains automated tests for the application.
  - **`ui-home.yaml`**: Configuration file for UI smoke tests for the home page, run with Stagehand.
  - **`run-ui-home.mjs`**: Node.js script to execute UI tests using `@browserbasehq/stagehand`.

- **`/hooks`**: Contains custom React hooks for reusable stateful logic.

- **`/tasks`**: Contains project-related documentation, such as Product Requirement Documents (PRDs).
  - `prd-grocery-list-modification.md`: PRD for the list modification feature.

- **`/.windsurf`**: Directory for Windsurf-related files and configuration.
  - **`/.windsurf/rules`**: Contains rules and knowledge bases for Cascade, like this document.

- **`/node_modules`**: Directory where project dependencies (npm packages) are installed.

## 3. Key Configuration Files

- **`package.json`**: Defines project metadata, dependencies (e.g., `next`, `react`, `openai`, `@browserbasehq/stagehand`), and scripts for development, building, testing, and evaluation.
- **`next.config.mjs`**: Configuration file for Next.js. Currently configured to ignore ESLint and TypeScript errors during builds and disable image optimization.
- **`tailwind.config.ts`**: Configuration file for Tailwind CSS, defining theme, plugins, and content paths.
- **`tsconfig.json`**: Configuration file for TypeScript, specifying compiler options and type checking rules.
- **`components.json`**: Likely used by Shadcn UI to manage installed UI components.
- **`load-env.sh`**: Shell script to load environment variables (e.g., API keys) into the development environment. Requires `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID` for UI tests.
- **`.env` / `.env.local`**: Files for storing environment variables (should be in `.gitignore`).
- **`.gitignore`**: Specifies intentionally untracked files that Git should ignore.

## 4. Development Workflow & Scripts

Key scripts from `package.json`:
- **`npm run dev`**: Starts the Next.js development server.
- **`npm run build`**: Builds the application for production.
- **`npm run start`**: Starts the production server (after building).
- **`npm run lint`**: Lints the codebase using Next.js's ESLint configuration.
- **`npm run eval`**: Runs the grocery parsing evaluation script (`evals/scripts/run-grocery-eval.sh`).
- **`npm run ui:home`**: Runs the UI smoke test for the home page using Stagehand (`node tests/run-ui-home.mjs`).

## 5. Key Features & Architectural Notes (from Memories)

- **Usual Groceries for Transcription Accuracy:**
  - The system uses a list of 'usual groceries' provided by the user to improve the accuracy of voice transcriptions via the OpenAI API.
  - The `extractGroceryItems` function in `grocery-service.ts` and the `/api/parse_groceries` route handle this.
  - The prompt to OpenAI includes a `{USUAL_GROCERIES}` placeholder.

- **Grocery List Modification:**
  - Users can add, remove, and modify quantities of items using natural language.
  - Different qualifiers (e.g., "apples", "red apples") are treated as distinct items.
  - Modifications are immediate (no confirmation step).
  - This feature is browser-session based.
  - A PRD exists at `tasks/prd-grocery-list-modification.md`.

- **Manual Transcript Input & Processing:**
  - Users can directly type or paste their grocery list into an editable textarea.
  - A "Process Text" button allows users to submit this manually entered text for parsing.
  - The `manualTranscript` state in `VoiceRecorder` component manages this text.
  - The `handleProcessManualTranscript` function in `VoiceRecorder` processes this input using the `_processTextInternal` shared logic.
  - Voice transcripts automatically populate this textarea, allowing for easy editing and reprocessing.
  - Starting a new voice recording clears any existing text in the manual input area.
  - Error messages specific to manual processing are displayed near the input area.

- **UI Testing with Browserbase/Stagehand:**
  - UI smoke tests are configured to run on the Browserbase cloud using the `@browserbasehq/stagehand` library.
  - The test definition is in `tests/ui-home.yaml` and executed by `tests/run-ui-home.mjs`.
  - Requires `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID` environment variables.

## 6. Future Considerations & Maintenance

- This document should be updated as new features are added, or the architecture changes.
- Pay attention to the `ignoreBuildErrors` and `ignoreDuringBuilds` flags in `next.config.mjs`; these might hide underlying issues and should ideally be addressed.
