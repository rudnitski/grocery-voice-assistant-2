---
trigger: manual
---

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
  - **Technical Implementation:**
    - **Data Model**: Each grocery item has an explicit `action` field that can be `"add"`, `"remove"`, or `"modify"` (interface `GroceryItemWithAction` in `grocery-service.ts`).
    - **LLM Prompt**: The `GROCERY_EXTRACTION_PROMPT` in `lib/prompts/grocery-prompts.ts` instructs the model to analyze user statements for intent and assign the appropriate action to each item.
    - **Processing Logic**: The `processGroceryActions` function in `grocery-service.ts` handles all three action types:
      - `add`: Adds a new item or increments quantity of existing item
      - `remove`: Removes an item from the list entirely
      - `modify`: Updates the quantity of an existing item
    - **State Management**: The `VoiceRecorder` component manages the grocery list state and uses the `_processTextInternal` method to process actions from both voice and manual transcripts.
    - **Conversational Understanding**: The system recognizes indirect statements like "I think we don't need apples" as removal actions, and "actually, let's get 3 instead" as modification actions.
  - **Evaluation Framework:**
    - **Action-Based Evaluation**: The `evaluateGroceryOutput` function in `eval-criteria.ts` has been enhanced to evaluate the correctness of actions in addition to items and quantities.
    - **Metrics**: The system calculates and reports separate accuracy metrics for addition, removal, and modification operations.
    - **Error Reporting**: Evaluation results include detailed error reports for wrong or missing actions.
    - **Test Cases**: Comprehensive test cases for various modification scenarios were added to `grocery_test_data.jsonl`, covering:
      - Direct removal commands ("remove apples")
      - Conversational removal ("actually, never mind about the apples")
      - Quantity modifications ("make that 3 apples instead")
      - Multiple operations in one utterance ("add milk, remove bread, and make it 2 eggs")
      - Multilingual support for all operations
    - The evaluation system achieved a 94.4% success rate across all test cases, with an average score of 96.8%.

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

- **Semantic Grocery Item Comparison:**
  - Advanced evaluation system using OpenAI GPT-4o for intelligent matching of grocery items beyond exact string matching.
  - Implemented in `evals/utils/semantic-comparison.ts` with comprehensive caching and performance optimization.
  - Supports contextual matching using the user's usual groceries list for brand preferences and specific items.
  - Features confidence scoring (0.0-1.0), detailed reasoning, and configurable thresholds (default: 0.75).

- **Multilingual Measurement Parsing:**
  - Comprehensive system for parsing, normalizing, and formatting measurements in grocery items.
  - Supports multiple languages (English, Spanish, French, German, Italian) with language-specific unit handling.
  - Handles metric units (g, kg, mL, L), imperial units (oz, lb, fl oz, cup), and count units.
  - Features fractional values, different decimal separators, and various unit formats.
  - Implemented in `lib/utils/measurement-utils.ts` with extensive test coverage.

## 6. Measurement Parsing System

### 6.1 Core Components

- **Data Model (`lib/types/grocery-types.ts`):**
  - `Measurement` interface: `{ value: number; unit: MeasurementUnit; type?: MeasurementType }`
  - Enums for measurement types (`WEIGHT`, `VOLUME`, `COUNT`) and units
  - Unit normalization maps for multilingual support
  - Display format templates for different units

- **Parsing Utilities (`lib/utils/measurement-utils.ts`):**
  - `parseMeasurement`: Extracts value and unit from strings like "500g" or "2 litros"
  - `normalizeUnit`: Maps various unit representations to standard units
  - `formatMeasurement`: Formats measurements for display
  - `normalizeMeasurement`: Converts to more appropriate units (e.g., 1000g → 1kg)
  - `combineMeasurements`: Combines measurements of the same type
  - Conversion utilities for different measurement systems

### 6.2 Multilingual Support

- **Language-Specific Features:**
  - Support for unit variations with language suffixes (e.g., `grammes_fr`, `litri_it`)
  - Special handling for plural forms in different languages
  - Italian plural handling (e.g., "litro" → "litri")
  - French plural handling (e.g., "gramme" → "grammes")
  - Comprehensive normalization map with entries for all supported languages

- **Parsing Capabilities:**
  - Flexible regex patterns to handle various formats
  - Support for different decimal separators (dot and comma)
  - Handling of fractions and special Unicode fraction characters
  - Text between numbers and units (e.g., "2 large cups")
  - Detection and rejection of mixed units (e.g., "1 lb 4 oz")

### 6.3 Testing and Limitations

- **Test Coverage:**
  - Unit tests for core parsing functions
  - Dedicated multilingual test suite
  - Integration with evaluation framework
  - Edge case testing for unusual formats

- **Known Limitations (documented in `.windsurf/rules/measurement-limitations.md`):**
  - No support for mixed units
  - Limited support for ranges
  - Language-specific pluralization challenges
  - Some ambiguity in abbreviated units
  - Examples: "chocolate milk" ↔ "milk chocolate", "green apples" ↔ "apples", "творожок" ↔ "творожок «савушкин»".
  - Integrated with evaluation framework (`eval-criteria.ts`) while maintaining backward compatibility.
  - Includes intelligent caching to minimize API calls and comprehensive unit/integration tests (29 tests).
  - Documented in `evals/README.md` with detailed configuration options and usage examples.

## 6. Future Considerations & Maintenance

- This document should be updated as new features are added, or the architecture changes.
- Pay attention to the `ignoreBuildErrors` and `ignoreDuringBuilds` flags in `next.config.mjs`; these might hide underlying issues and should ideally be addressed.
