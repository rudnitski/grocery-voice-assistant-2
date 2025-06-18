# Task List: Export Grocery List as Text

This document outlines the specific tasks required to implement the "Export Grocery List as Text" feature as described in the [PRD](/tasks/prd-export-groceries.md).

## Relevant Files

- `components/voice-recorder.tsx` - Main component containing application state and export handler logic
- `components/grocery-list.tsx` - Component that renders the grocery list and will need Export button
- `components/export-dialog.tsx` - New component for fallback export dialog
- `lib/utils/grocery-utils.ts` - New utility file for formatting grocery list as text
- `lib/utils/grocery-utils.test.ts` - Unit tests for grocery formatting utilities
- `app/components/ui/dialog.tsx` - Existing shadcn/ui Dialog component that will be used
- `app/components/ui/toast.tsx` - Existing toast component for user feedback

### Notes

- The implementation follows the existing application architecture, with state managed in VoiceRecorder and UI elements in separate components
- Unit tests should be implemented for the formatting utility function
- Manual testing will be required for the clipboard functionality

## Tasks

- [x] 1.0 Implement List Formatting Utility
  - [x] 1.1 Create a new file `lib/utils/grocery-utils.ts` with an exported function `formatGroceryListForExport`
  - [x] 1.2 Implement the function to handle items with different quantity formats (numeric only, with measurements)
  - [x] 1.3 Format the grocery list as a bullet-pointed text with proper spacing and consistency
  - [x] 1.4 Import and use the existing `formatMeasurement` utility from `measurement-utils.ts` for items with measurements
  - [x] 1.5 Create unit tests in `lib/utils/grocery-utils.test.ts` to verify formatting behavior for various item types

- [ ] 2.0 Create Export Dialog Componentls
  - [ ] 2.1 Create a new component file `components/export-dialog.tsx`
  - [ ] 2.2 Implement the dialog using shadcn/ui `Dialog` component with proper header and content
  - [ ] 2.3 Add a read-only `Textarea` to display the formatted grocery list
  - [ ] 2.4 Add "Close" button and event handlers
  - [ ] 2.5 Add optional "Copy" button within the dialog for better UX
  - [ ] 2.6 Ensure dialog is accessible and can be dismissed via ESC key or clicking outside

- [ ] 3.0 Update Grocery List Component
  - [ ] 3.1 Import the appropriate icon (`Share2` or `Copy`) from lucide-react
  - [ ] 3.2 Add the export button to the header of `components/grocery-list.tsx`
  - [ ] 3.3 Style the button to be consistent with the existing UI
  - [ ] 3.4 Add logic to disable the button when the list is empty
  - [ ] 3.5 Update the component props interface to accept an `onExport` handler
  - [ ] 3.6 Connect the button's onClick event to the `onExport` handler

- [ ] 4.0 Integrate Export Functionality in Voice Recorder
  - [ ] 4.1 Add new state for managing the export dialog visibility
  - [ ] 4.2 Import the formatGroceryListForExport utility and the ExportDialog component
  - [ ] 4.3 Implement the `handleExportList` async function with clipboard API attempt
  - [ ] 4.4 Add toast notification for successful clipboard operations
  - [ ] 4.5 Implement fallback behavior to open the dialog when clipboard API fails
  - [ ] 4.6 Pass the `handleExportList` function as a prop to the GroceryList component
  - [ ] 4.7 Render the ExportDialog component with proper props in the component

- [ ] 5.0 Testing and Documentation
  - [ ] 5.1 Test the happy path: clicking export button and copying to clipboard works
  - [ ] 5.2 Test the disabled state when grocery list is empty
  - [ ] 5.3 Test the fallback dialog by simulating clipboard API failure
  - [ ] 5.4 Verify the formatting for different item types (with/without measurements)
  - [ ] 5.5 Add JSDoc comments to the utility function and exported components
  - [ ] 5.6 Update the project README with information about the new export feature
