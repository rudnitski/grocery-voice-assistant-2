# Tasks for Manual Transcript Input and Processing Feature

Based on PRD: `tasks/prd-manual-transcript-input.md`

## Phase 1: Frontend Implementation (React/Next.js)

1.  **Modify `VoiceRecorder` Component (`components/voice-recorder.tsx`)**
    *   [x] **State Management:**
        *   [x] Add state for the manually editable transcript text (e.g., `manualTranscript`, distinct from `transcript` which might hold the last *processed* transcript). Initialize with `transcript` state or empty.
        *   [x] Ensure `isProcessing` state correctly gates both voice and manual submission flows.
    *   [x] **Update `TranscriptPanel` Integration:**
        *   [x] Pass the new `manualTranscript` state and a handler (e.g., `setManualTranscript`) to `TranscriptPanel` for its `value` and `onTranscriptChange` props.
        *   [x] Create a new handler function (e.g., `handleProcessManualTranscript`) to be passed as `onProcessText` to `TranscriptPanel`.
    *   [x] **Implement `handleProcessManualTranscript` Function:**
        *   [x] Set `isProcessing` to `true`.
        *   [x] Get the current `manualTranscript` text.
        *   [x] Get the current `usualGroceries` text.
        *   [x] Call the existing `processTranscriptClient` service function with `manualTranscript` and `usualGroceries`.
        *   [x] Update `groceryItems` and `rawJsonResponse` with the results (similar to how it's done after voice transcription).
        *   [x] Handle potential errors from `processTranscriptClient` and update `errorMessage` state.
        *   [x] Set `isProcessing` to `false` in a `finally` block.
    *   [x] **Handle Interaction with Voice Input (PRD FR6):**
        *   [x] In the `startRecording` (or equivalent) function, before starting the recording, check if `manualTranscript` has content. If yes, clear `manualTranscript` (e.g., `setManualTranscript("")`).
    *   [x] **Placeholder Logic (PRD FR1):**
        *   [x] The `TranscriptPanel`'s `placeholder` prop will handle the display. Ensure `manualTranscript` is initialized appropriately (e.g., empty or with the last voice transcript) so the placeholder shows correctly.
    *   [x] **Error Display:**
        *   [x] Ensure `errorMessage` state, when set by `handleProcessManualTranscript`, is displayed clearly in the UI (e.g., near the `TranscriptPanel` or using a global notification system if one exists).

2.  **Verify `TranscriptPanel` Component (`components/transcript-panel.tsx`)**
    *   [x] Confirm `Textarea` correctly uses `value` and `onChange` for controlled input.
    *   [x] Confirm `maxLength={5000}` is applied.
    *   [x] Confirm "Process Text" button is correctly wired to `onProcessText` prop.
    *   [x] Confirm button's `disabled` state works based on `isProcessing` and if the transcript text is empty.
    *   [x] Confirm loading indicator (`Loader2`) shows correctly during `isProcessing`.

## Phase 2: Styling & Minor Adjustments

1.  **Review and Refine Styling:**
    *   [x] Ensure the `Textarea` in `TranscriptPanel` has a style consistent with the application's theme.
    *   [x] Ensure the "Process Text" button style matches other primary action buttons.
    *   [x] Verify error message styling is clear and consistent.

## Phase 3: Manual Testing

1.  **Basic Manual Input & Processing (Happy Path):**
    *   [x] **Test Case 3.1.1:**
        *   **Action:** Type a simple grocery list (e.g., "2 apples, 1 milk, 3 bananas") into the transcript `Textarea`.
        *   **Expected:** "Process Text" button becomes enabled. Grocery items appear correctly in the list. Raw JSON response is updated. `manualTranscript` remains.
    *   [x] **Test Case 3.1.2:**
        *   **Action:** Paste a longer, more complex grocery list into the `Textarea`.
        *   **Expected:** "Process Text" button enabled. Items parsed and displayed correctly.

2.  **Placeholder Behavior:**
    *   [x] **Test Case 3.2.1:**
        *   **Action:** Observe `Textarea` on initial load (or after clearing).
        *   **Expected:** Placeholder text ("Your speech transcript will appear here...") is visible.
    *   [x] **Test Case 3.2.2:**
        *   **Action:** Start typing in the `Textarea`.
        *   **Expected:** Placeholder text disappears.
    *   [x] **Test Case 3.2.3:**
        *   **Action:** Clear all text from the `Textarea`.
        *   **Expected:** Placeholder text reappears.

3.  **Button State & Loading Indicator:**
    *   [x] **Test Case 3.3.1:**
        *   **Action:** `Textarea` is empty.
        *   **Expected:** "Process Text" button is disabled.
    *   [x] **Test Case 3.3.2:**
        *   **Action:** Type text into `Textarea`, then click "Process Text".
        *   **Expected:** Button shows loading indicator (`Loader2` icon and "Processing..." text) while `isProcessing` is true. Button returns to normal state after processing.
    *   [x] **Test Case 3.3.3:**
        *   **Action:** Start voice recording.
        *   **Expected:** "Process Text" button is disabled (as `isProcessing` will be true during voice transcription/processing).

4.  **Max Character Limit:**
    *   [x] **Test Case 3.4.1:**
        *   **Action:** Attempt to type or paste text exceeding 5000 characters into the `Textarea`.
        *   **Expected:** Input is capped at 5000 characters.

5.  **Interaction with Voice Input:**
    *   [x] **Test Case 3.5.1:**
        *   **Action:** Type text into `Textarea`. Then, start voice recording.
        *   **Expected:** `manualTranscript` (text in `Textarea`) is cleared. Any `errorMessage` is cleared.
    *   [x] **Test Case 3.5.2:**
        *   **Action:** Complete a voice recording. Transcript appears.
        *   **Expected:** The voice transcript also populates the `manualTranscript` in the `Textarea`, allowing immediate editing.
    *   [x] **Test Case 3.5.3:**
        *   **Action:** After voice input, edit the text in `Textarea` and click "Process Text".
        *   **Expected:** The edited text is processed, and the grocery list updates accordingly.

6.  **Error Handling (Manual Processing):**
    *   [x] **Test Case 3.6.1:** (Requires a way to simulate backend error, or use text that reliably causes parsing failure if known)
        *   **Action:** Enter text that is likely to cause a processing error (e.g., gibberish, or if the API is down). Click "Process Text".
        *   **Expected:** An appropriate error message is displayed near the transcript area. `isProcessing` becomes false. Grocery list might be empty or show fallback parsing.
    *   [x] **Test Case 3.6.2:**
        *   **Action:** After an error is displayed, successfully process a valid transcript (either voice or manual).
        *   **Expected:** Error message is cleared.

7.  **"Usual Groceries" Context:**
    *   [x] **Test Case 3.7.1:**
        *   **Action:** Enter some items in "Usual Groceries". Type a related but perhaps ambiguous item in the manual transcript (e.g., if "whole milk" is usual, type "milk"). Click "Process Text".
        *   **Expected:** The parsing should ideally use the "Usual Groceries" context if the backend supports it, potentially resolving to "whole milk". (This tests the pass-through of context).
2.  **Automated Testing (Optional - depending on project scope/time):**
    *   [ ] Consider if any new unit tests for `VoiceRecorder` logic are needed.
    *   [ ] Consider if UI tests (`ui-home.yaml`) need updates to account for the new elements (though the core flow might not change if existing test IDs are stable).

## Phase 4: Documentation & Review

1.  **Update Documentation (if applicable):**
    *   [x] Review `README.md` or other project documentation. If the new feature significantly changes user interaction or setup, add a brief note.
    *   [x] Ensure any inline code comments added are clear and helpful.
2.  **PRD and Task List Final Review:**
    *   [x] Briefly review the `prd-manual-transcript-input.md` to ensure all requirements have been met.
    *   [x] Briefly review this `tasks-manual-transcript-input.md` to ensure all tasks are addressed.
3.  **Code Review (Conceptual):**
    *   [x] If this were a team environment, this would be the point to open a Pull Request and request code review from peers. (Self-review key changes).
4.  **Consider Edge Cases/Future Enhancements (Optional):**
    *   [x] Briefly think if any obvious edge cases were missed or if there are immediate small enhancements that could be noted for future work. (Considered complete)

---
This task list should guide the development of the feature.
