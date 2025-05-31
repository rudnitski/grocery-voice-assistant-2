---
trigger: manual
description: Product Requirements Document for Manual Transcript Input and Processing Feature
---

# PRD: Manual Transcript Input and Processing

**1. Introduction**
This document outlines the requirements for a new feature in the Grocery Voice Assistant: Manual Transcript Input and Processing. This feature will allow users to manually enter or edit the text in the transcript display area (where the speech-to-text output normally appears) and then initiate the grocery item parsing and list update process by clicking a dedicated button. This enhancement aims to improve usability by providing an alternative input method and a way to correct transcription errors.

**2. Goals**
*   Allow users to input grocery lists via text entry.
*   Enable users to correct errors from the speech-to-text (Whisper model) transcription before processing.
*   Provide a clear and intuitive way to trigger the grocery parsing logic for the manually entered/edited text.
*   Ensure the manual processing flow utilizes the same backend logic as the automatic (voice-initiated) flow for consistency.
*   Maintain the existing voice input functionality.

**3. User Stories**
*   As a user, I want to be able to type my grocery list directly into the application so that I can use it even when I prefer not to speak or when voice input is not working well.
*   As a user, I want to be able to edit the text produced by the voice recognition system before it's processed so that I can correct any mistakes and ensure my list is accurate.
*   As a user, I want to click a button to process the text I've typed or edited so that I have explicit control over when the grocery list is updated.

**4. Requirements**
    *   **FR1: Editable Transcript Area:** The UI component currently displaying the transcript (output from Whisper) should become an editable text input field (e.g., a `<textarea>` or an `<input type="text">`).
        *   It should still display the transcript from voice input when that occurs.
        *   Users should be able to freely type, paste, and edit text in this field.
        *   The placeholder text (e.g., "Your speech transcript will appear here...") should disappear when the user starts typing and reappear if the input field is subsequently cleared by the user.
        *   The input field should have a maximum character limit of 5000 characters.
    *   **FR2: "Process Text" Button:** A new button, labeled "Process Text" (this label can be refined if needed), shall be added near the editable transcript area.
    *   **FR3: Trigger Processing Logic:** Clicking the "Process Text" button should:
        *   Take the current text content from the editable transcript area.
        *   Initiate the same grocery item extraction and list update flow that is currently triggered automatically after voice recognition. This includes calling the `/api/parse_groceries` endpoint with the text.
        *   The "Usual Groceries" context should also be passed if available, consistent with MEMORY[a5adcd2f-04aa-4635-b676-785a60e6f0e4].
    *   **FR4: UI State Updates:**
        *   The UI should reflect the processing state (e.g., disable the button, show a loading indicator) while the manually entered text is being processed.
        *   The grocery list display should update based on the processed text, similar to how it updates after voice input.
        *   The text entered by the user in the transcript area should remain after processing, allowing for further edits if needed.
        *   If an error occurs during the processing of manually entered text (e.g., API error, parsing failure), a clear error message should be displayed to the user (e.g., near the transcript area or via a consistent application notification pattern).
    *   **FR5: No Impact on Voice Flow:** The existing voice input flow (record, transcribe, auto-process) should remain unchanged and fully functional. Manual input is an alternative/adjunct.
    *   **NFR1: Consistency:** The manual processing should yield the same results as the voice-initiated processing for identical input text.
    *   **NFR2: Responsiveness:** The UI should remain responsive during text input and button interaction.
    *   **FR6: Interaction with Voice Input:** If the user initiates a voice recording while there is text present in the manual transcript input field, the text in the input field should be automatically cleared.

**5. Design Considerations**
*   The new editable transcript area and "Process Text" button should visually integrate with the existing application theme and styling.
*   Standard browser focus indicators for the text area are sufficient; no special custom styling is required to indicate editability beyond default input field behavior.

**6. Out of Scope**
*   Saving the manually entered text if the user navigates away before processing.
*   Complex text editing features beyond standard input field capabilities.
*   Changes to the voice recording or Whisper transcription process itself.

**7. Technical Considerations**
*   The frontend will need state management updates to handle the editable text and the new button's action.
*   The existing API endpoint (`/api/parse_groceries`) should be suitable for reuse.
*   Care must be taken to ensure that the manual flow and the voice-initiated flow do not interfere with each other (e.g., concurrent processing attempts).
