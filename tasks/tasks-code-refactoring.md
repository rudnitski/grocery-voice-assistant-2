# Task List: Architectural Refactoring of Grocery Voice Assistant

## Overview
This document outlines the specific tasks required to implement the architectural refactoring plan for the Grocery Voice Assistant. The refactoring aims to enhance modularity, testability, and maintainability by decomposing the monolithic `VoiceRecorder.tsx` component into smaller, reusable custom hooks with clear responsibilities.

## Phase 1: Project Cleanup and Consolidation
**Priority: High**
**Estimated Timeline: 1 day**

### Task 1.1: Deduplicate Hooks
- [x] Review and compare duplicate hook files (`use-mobile.tsx` and `use-toast.ts`)
- [x] Decide on canonical location for hooks (e.g., `/hooks` directory)
- [x] Delete duplicate files
- [x] Update all imports to point to the canonical versions
- [x] Verify application still functions correctly

### Task 1.2: Consolidate Stylesheets
- [x] Confirm `app/globals.css` is the stylesheet in active use
- [x] Remove unused `styles/globals.css`
- [x] Verify no styling issues appear after removal

### Task 1.3: Create Shared Logger Utility
- [x] Create `lib/utils/logger.ts` with consistent logging interface
- [x] Implement basic log levels (info, warn, error, debug)
- [x] Add configurable verbosity based on environment
- [x] Update API routes in `app/api/` to use the shared logger
- [x] Test logging functionality in development environment

## Phase 2: Core Logic Abstraction into Hooks
**Priority: High**
**Estimated Timeline: 3-4 days**

### Task 2.1: Create `useGroceryList` Hook
- [ ] Create new file `hooks/use-grocery-list.ts`
- [ ] Extract grocery list state management from `VoiceRecorder.tsx`
- [ ] Move list manipulation logic from `grocery-service.ts` (`processGroceryActions`) to the hook
- [ ] Implement functions for adding, removing, and modifying grocery items
- [ ] Add TypeScript interfaces and documentation
- [ ] Write unit tests for the hook

### Task 2.2: Create `useAudioRecorder` Hook
- [ ] Create new file `hooks/use-audio-recorder.ts`
- [ ] Extract audio recording state and logic from `VoiceRecorder.tsx`
- [ ] Implement feature detection for browser audio capabilities
- [ ] Handle audio stream setup and teardown
- [ ] Implement recording start/stop functionality
- [ ] Add error handling for audio recording issues
- [ ] Add TypeScript interfaces and documentation
- [ ] Write unit tests for the hook

### Task 2.3: Create `useTranscriptProcessor` Hook
- [ ] Create new file `hooks/use-transcript-processor.ts`
- [ ] Extract transcript state management from `VoiceRecorder.tsx`
- [ ] Move transcript processing logic to the hook
- [ ] Implement functions for handling both voice and manual transcripts
- [ ] Add error handling and processing state management
- [ ] Add TypeScript interfaces and documentation
- [ ] Write unit tests for the hook

## Phase 3: Component Refactoring and Integration
**Priority: High**
**Estimated Timeline: 2-3 days**

### Task 3.1: Refactor `VoiceRecorder.tsx`
- [ ] Update imports to use the newly created hooks
- [ ] Remove redundant state management code
- [ ] Wire up hooks together (connect outputs of one hook to inputs of another)
- [ ] Ensure proper data flow between hooks and UI components
- [ ] Simplify render logic to focus on UI orchestration
- [ ] Verify component renders correctly with the new architecture

### Task 3.2: Full Application Validation
- [ ] Run existing evaluation tests (`npm run eval`)
- [ ] Run UI tests (`npm run ui:home`)
- [ ] Perform manual testing of all user flows:
  - [ ] Voice input recording and processing
  - [ ] Manual transcript input and processing
  - [ ] Grocery list modifications (add, remove, update)
  - [ ] Error handling scenarios
- [ ] Verify "usual groceries" context functionality
- [ ] Fix any regressions or issues discovered during testing

## Phase 4: Documentation and Code Quality
**Priority: Medium**
**Estimated Timeline: 1 day**

### Task 4.1: Update Documentation
- [ ] Document the new architecture in project README or wiki
- [ ] Add JSDoc comments to all new hooks and functions
- [ ] Update any existing documentation that references the old architecture

### Task 4.2: Code Quality Improvements
- [ ] Run linter on all modified files
- [ ] Ensure consistent code style across new and modified files
- [ ] Remove any commented-out or dead code
- [ ] Optimize imports and remove unused dependencies
- [ ] Review and address any TODO comments

## Success Metrics
- [ ] Reduced line count and complexity in `VoiceRecorder.tsx` (at least 50% reduction)
- [ ] All existing tests pass (100% success rate)
- [ ] All functionality works as before refactoring
- [ ] Code is more modular and easier to understand

## Notes
- This refactoring focuses on internal code quality and does not change external functionality
- The hooks-based architecture provides a foundation for future enhancements
- Consider running the refactoring in a separate branch and merging only after full validation
