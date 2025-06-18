# Product Requirements Document: Export Grocery List as Text

## 1. Introduction/Overview

This document outlines requirements for a new feature enabling users to export their final grocery list as plain text. This will allow for easy sharing across different applications like notes, messengers, or email. The core of the feature involves formatting the current list, copying it to the clipboard, and providing clear user feedback.

The application's main user interface is driven by the `components/voice-recorder.tsx` component. This component holds and manages the primary application state, including the `groceryItems` array, which represents the user's current list.

-   **State Management:** The `groceryItems` state (`Array<{ id: string; name: string; quantity: number; measurement?: Measurement }>`) resides in `VoiceRecorder.tsx`.
-   **UI Rendering:** The list is passed as a prop to the `components/grocery-list.tsx` component, which is responsible for rendering the items.
-   **Key Pain Point:** There is currently no mechanism for the user to extract the generated list from the application for use elsewhere, limiting its utility. The data is confined to the browser session.

## 2. Goals

1. Provide a simple, one-click method for users to export their grocery list
2. Ensure the feature is robust by providing a fallback for browsers that do not support the modern Clipboard API
3. Deliver a seamless user experience with clear feedback (e.g., toast notifications)
4. Enable users to easily share their grocery lists across different applications

## 3. User Stories

1. As a user, I want to export my grocery list with one click so I can easily share it with others
2. As a user, I want to see clear feedback when my list has been copied so I know the action was successful
3. As a user, I want to be able to copy my list even if my browser has limited clipboard support
4. As a user, I want the exported text to maintain the format of my grocery list, including quantities and measurements

## 4. Functional Requirements
### 4.1. High-Level Design / Architectural Overview
The proposed solution introduces an "Export" button within the `GroceryList` component. Clicking this button will trigger a handler in the `VoiceRecorder` component that formats the list into a string and attempts to copy it to the clipboard. A modal dialog containing the text will serve as a fallback if the direct copy action fails.

#### User Flow Diagram
```mermaid
graph TD
    A[User has a populated grocery list] --> B{Clicks 'Export' button};
    B --> C{List is empty?};
    C -- Yes --> D[Button is disabled, no action];
    C -- No --> E[formatGroceryList(groceryItems)];
    E --> F{navigator.clipboard.writeText API available & succeeds?};
    F -- Yes --> G[Text copied to clipboard];
    G --> H[Show 'Copied!' toast notification];
    F -- No / Fails --> I[Open Fallback Dialog];
    subgraph Fallback Dialog
        J[Show formatted list in a <textarea>];
        K[Provide 'Copy' & 'Close' buttons];
    end
    I --> J;
    J --> K;
```

### 4.2. Key Components / Modules

1.  **`VoiceRecorder.tsx` (Component Modification)**
    -   **Responsibility:** Will contain the core logic for the export feature, as it owns the `groceryItems` state.
    -   **Changes:**
        -   Add state to manage the visibility of the fallback dialog (e.g., `isExportDialogOpen`).
        -   Implement a new handler function, `handleExportList`, which will:
            1.  Format the `groceryItems` array into text using a new utility function.
            2.  Attempt to use `navigator.clipboard.writeText()` to copy the text.
            3.  On success, trigger a toast notification.
            4.  On failure, open the fallback dialog.

2.  **`GroceryList.tsx` (Component Modification)**
    -   **Responsibility:** To provide the user-facing trigger for the export functionality.
    -   **Changes:**
        -   Add an "Export" button (e.g., using `lucide-react`'s `Share` or `Copy` icon) to its header.
        -   The button will be disabled if `items.length === 0`.
        -   The button's `onClick` event will call the `handleExportList` handler passed down from `VoiceRecorder.tsx`.

3.  **`lib/utils/grocery-utils.ts` (New Utility File/Function)**
    -   **Responsibility:** To provide a pure, testable function for formatting the grocery list.
    -   **New Function:** `formatGroceryListForExport(items)`:
        -   Takes the `groceryItems` array as input.
        -   Returns a formatted, human-readable string.
        -   Leverages the existing `formatMeasurement` utility from `lib/utils/measurement-utils.ts`.

4.  **`components/export-dialog.tsx` (New Component)**
    -   **Responsibility:** A modal dialog to display the formatted list text for manual copying.
    -   **Implementation:**
        -   Will use `Dialog`, `DialogHeader`, `DialogContent`, `Textarea`, and `Button` components from the existing `shadcn/ui` library.
        -   The `Textarea` will be pre-filled with the formatted list and set to read-only.
        -   It will have a "Close" button. A "Copy" button inside the dialog is optional but recommended for better UX.

### 4.3. Detailed Action Plan / Phases

#### Phase 1: Core Logic and Utility Function
-   **Objective(s):** Create the foundational, non-UI logic for the feature.
-   **Priority:** High

-   **Task 1.1: Create List Formatting Utility**
    -   **Rationale/Goal:** Decouple the formatting logic from the component, making it pure and easily testable.
    -   **Estimated Effort:** S
    -   **Deliverable/Criteria for Completion:**
        -   A new file `lib/utils/grocery-utils.ts` is created.
        -   It contains an exported function `formatGroceryListForExport(items: GroceryItem[]): string`.
        -   The function correctly formats a list of items into a multi-line string (e.g., `- Apples (3)\n- Flour (500g)`).
        -   Unit tests for this function are created and pass.

-   **Task 1.2: Implement Export Handler in `VoiceRecorder.tsx`**
    -   **Rationale/Goal:** Centralize the feature's logic within the state-owning component.
    -   **Estimated Effort:** M
    -   **Deliverable/Criteria for Completion:**
        -   `VoiceRecorder.tsx` has a new state `const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);`.
        -   A new asynchronous function `handleExportList` is implemented.
        -   The function calls `formatGroceryListForExport`, `navigator.clipboard.writeText`, and `toast()`.
        -   It includes a `try...catch` block to handle clipboard API failures by setting `setIsExportDialogOpen(true)`.
        -   The function is passed as a prop to the `GroceryList` component.

#### Phase 2: UI Implementation
-   **Objective(s):** Build the user-facing elements for the export feature.
-   **Priority:** High (Depends on 1.2)

-   **Task 2.1: Create `ExportDialog.tsx` Component**
    -   **Rationale/Goal:** Provide a robust fallback mechanism for copying text.
    -   **Estimated Effort:** S
    -   **Deliverable/Criteria for Completion:**
        -   A new file `components/export-dialog.tsx` is created.
        -   The component uses `shadcn/ui` `Dialog` components to render a modal.
        -   It accepts `isOpen`, `onClose`, and `textToCopy` as props.
        -   The `textToCopy` is displayed in a `Textarea` component.
        -   A "Close" button is present and functional.

-   **Task 2.2: Add Export Button to `GroceryList.tsx`**
    -   **Rationale/Goal:** Provide the user with a clear and intuitive entry point for the export feature.
    -   **Estimated Effort:** S
    -   **Deliverable/Criteria for Completion:**
        -   `GroceryList.tsx` is modified to include an "Export" button in its header, next to the "Grocery List" title. A `Share2` icon from `lucide-react` is recommended.
        -   The button receives the `onExport` handler via props and calls it on click.
        -   The button is disabled with appropriate styling when the `items` prop is an empty array.

#### Phase 3: Integration and Testing
-   **Objective(s):** Connect all the pieces and validate the end-to-end flow.
-   **Priority:** High (Depends on Phase 1 & 2)

-   **Task 3.1: Integrate `ExportDialog` into `VoiceRecorder.tsx`**
    -   **Rationale/Goal:** To complete the fallback user flow.
    -   **Estimated Effort:** S
    -   **Deliverable/Criteria for Completion:**
        -   `VoiceRecorder.tsx` imports and renders the `<ExportDialog />`.
        -   The dialog's visibility is controlled by the `isExportDialogOpen` state.
        -   The formatted list text is passed to the dialog.

-   **Task 3.2: End-to-End Manual Testing**
    -   **Rationale/Goal:** Ensure the feature works as expected in a real browser environment.
    -   **Estimated Effort:** M
    -   **Deliverable/Criteria for Completion:**
        -   Test the happy path: click export, see toast, paste text successfully.
        -   Test the disabled state: confirm the button is disabled for an empty list.
        -   Test the fallback: simulate clipboard failure (e.g., via browser dev tools permissions) and confirm the dialog appears and manual copy works.
        -   Verify the formatting of the exported text is correct for items with and without measurements.

### 4.4. Data Model Changes
-   No changes are required for the existing data models.

### 4.5. API Design / Interface Changes
-   No backend API changes are required for this feature.

## 5. Non-Goals (Out of Scope)

1. Advanced formatting options for the exported text (e.g., HTML, CSV, or specialized formats)
2. Sharing directly to social media platforms or specific applications
3. Integration with cloud storage services for saving lists
4. Creating QR codes or short links for the grocery list
5. Persistent storage of previously exported lists

## 6. Design Considerations

1. **Button Placement and Visual Design**
   - Place an icon-only button in the header of the `GroceryList` component, to the right of the "Grocery List" title
   - Use the `Share2` or `Copy` icon from `lucide-react` for intuitive recognition
   - Disable the button with appropriate styling when the list is empty

2. **Text Format for Export**
   - Use a simple, markdown-friendly bullet list format
   - Display quantities and measurements in a consistent way
   - Keep formatting universal and readable across different applications

## 7. Key Considerations & Risk Mitigation
### 7.1. Technical Risks & Challenges
-   **Risk:** Browser support and permissions for the Clipboard API (`navigator.clipboard.writeText`). It requires a secure context (HTTPS) and may require user permission.
    -   **Mitigation:** The primary mitigation is the implementation of the fallback dialog (`ExportDialog.tsx`), which provides a universal solution for all browsers by allowing manual selection and copying from a textarea.
-   **Risk:** The format of the exported text may not suit all users or use cases.
    -   **Mitigation:** Start with a simple, clean, and universally readable format (like a bulleted list). The proposed format and potential alternatives are listed in "Open Questions" for discussion.

### 7.2. Dependencies
-   The feature relies on the existing `shadcn/ui` component library (`Button`, `Dialog`, `Textarea`) and `lucide-react` for icons.
-   It uses the `useToast` hook for user feedback.

### 7.3. Non-Functional Requirements (NFRs) Addressed
-   **Usability:** Significantly improved by allowing users to take their data out of the application. The one-click copy with a robust fallback is highly usable.
-   **Reliability:** The fallback dialog ensures the feature is reliable across different browsers and security contexts.
-   **Maintainability:** By creating a dedicated formatting utility and a separate dialog component, the logic is modular and easy to maintain.

## 8. Success Metrics
-   **Feature Adoption:** (Quantitative) Track the number of "Export" button clicks to measure usage.
-   **User Feedback:** (Qualitative) Positive user feedback regarding the ability to share the list.
-   **Functionality:** The feature works correctly across major target browsers (Chrome, Firefox, Safari). The text copied to the clipboard is always an accurate representation of the list shown in the UI.

## 9. Assumptions Made
-   The application is and will be served over a secure context (HTTPS), a prerequisite for the modern Clipboard API.
-   A plain text export is sufficient for the initial version of this feature.
-   The current `useToast` hook is the appropriate mechanism for providing feedback for this action.

## 10. Open Questions
1.  **Text Format:** What is the ideal format for the exported text?
    -   **Proposal:** A simple, markdown-friendly list.
        ```
        - Milk (1 L)
        - Apples (5)
        - Sourdough Bread (2)
        - Flour (500g)
        ```
    -   **Discussion Point:** Should there be a title, like "Grocery List"? Should quantities always be in parentheses?

2.  **Button Placement and Icon:**
    -   **Proposal:** Place an icon-only button in the header of the `GroceryList` component, to the right of the "Grocery List" title. The `Share2` or `Copy` icon from `lucide-react` would be suitable.
    -   **Discussion Point:** Is this the most intuitive location? Should it have text?

3.  **Web Share API for Mobile:**
    -   **Area for Investigation:** For a future iteration, we should investigate using the Web Share API (`navigator.share`). If available (primarily on mobile), this API provides a much better user experience by opening the native OS share sheet.
    -   **Proposal:** The `handleExportList` function could be enhanced to check for `navigator.share` and use it if available, falling back to the clipboard/dialog flow otherwise. This would be a progressive enhancement.