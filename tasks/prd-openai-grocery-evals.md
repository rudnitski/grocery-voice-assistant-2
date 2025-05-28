# Product Requirements Document: OpenAI Evals for Grocery Parsing LLM

## 1. Introduction/Overview

This document outlines the requirements for creating an OpenAI Evals suite for the grocery parsing Language Model (LLM) used in the Grocery Voice Assistant application. The primary problem this feature solves is ensuring the continued reliability, accuracy, and consistency of the LLM in extracting grocery items and their quantities from user speech transcripts. The goal is to develop a robust evaluation framework that can validate the LLM's JSON output against a comprehensive set of predefined criteria, detect regressions, and facilitate comparisons between different LLM versions or prompt strategies.

## 2. Goals

The specific objectives for this feature are:

*   To ensure that the LLM's output is always a structurally valid JSON object, or an empty JSON object (`{"items": []}`) if no groceries are found in the input.
*   To verify that all required fields (specifically `item` and `quantity` within each object in the `items` array) are present in the LLM's JSON response, as per the defined schema.
*   To confirm that the `quantity` field in the JSON response consistently contains a valid numerical value.
*   To validate that the `item` field in the JSON response contains a meaningful grocery item relevant to the input transcript.
*   To ensure that any grocery item extracted by the LLM was actually present in the source user request, allowing for minor, predefined naming differences.
*   To establish a reliable mechanism for preventing regressions in parsing accuracy when changes are made to the LLM, its prompts, or other related system components.
*   To provide a standardized method for comparing the performance of different LLM versions or prompt engineering approaches.

## 3. User Stories

*   As a Developer/Product Manager, I want to run a comprehensive evaluation suite for the grocery parsing LLM so that I can be confident in its accuracy, ensure consistent performance, and prevent regressions over time.
*   As a Developer/Product Manager, I want the evals to meticulously check JSON validity, adherence to the data schema, correct formatting of quantities, and the contextual correctness of extracted items so that I get a holistic understanding of the LLM's performance characteristics.
*   As a Developer/Product Manager, I want the evaluation suite to aim for 100% accuracy on the defined test dataset for all specified criteria so that I can have high trust in the LLM's output for production use.

## 4. Functional Requirements

1.  **FR1: Test Case Input:** The evaluation system must accept a predefined set of test cases as input. Each test case shall consist of a user utterance (string) and the corresponding expected JSON output (string).
2.  **FR2: LLM Invocation:** For each test case, the system must invoke the grocery parsing LLM, simulating the application's current operational logic. This includes utilizing the `usualGroceries` feature by passing the relevant usual groceries list to the LLM as part of the input.
3.  **FR3: Output Evaluation Criteria:** The system must evaluate the LLM's generated output against the following criteria for each test case:
    *   **FR3.1: JSON Validity:** The LLM output must be a syntactically valid JSON string. If no groceries are identified in the utterance, the output must be an empty JSON object (e.g., `{"items": []}`).
    *   **FR3.2: Schema Adherence:** If the JSON output is not empty, it must conform to the established schema: an object containing an `items` array. Each element within the `items` array must be an object possessing an `item` field (string) and a `quantity` field.
    *   **FR3.3: Quantity Type:** The `quantity` field within each item object must be a **valid number**. *(Note: This is a firm requirement. The test data `evals/data/grocery_test_data.jsonl` and any relevant LLM prompts must be aligned to ensure only numeric quantities are expected and generated. Units mentioned in utterances will be ignored by the primary parsing LLM for now.)*
    *   **FR3.4: Item Meaningfulness:** The `item` field must represent a meaningful grocery item. This check will employ a secondary LLM call to assess the relevance and sensibility of the extracted item name in the context of the source utterance. The proposed prompt for this secondary LLM is:
        ```
        You are an AI assistant evaluating grocery item extraction.
        Original User Utterance: "{{utterance}}"
        Extracted Grocery Item: "{{item_name}}"

        Is the "Extracted Grocery Item" a plausible grocery item that could reasonably be derived from the "Original User Utterance"?
        Respond with only "PASS" or "FAIL".
        ```
    *   **FR3.5: Item Source Match:** The grocery item specified in the `item` field must correspond to an item explicitly mentioned in the original user utterance. For the initial version, simple matching techniques will be used:
        *   Case-insensitive matching.
        *   Basic singular/plural matching (e.g., "apple" matches "apples").
        *   Substring matching (e.g., "yogurt" in "banana yogurt" is a match).
4.  **FR4: Script-Based Execution:** The evaluation suite must be executable via a custom script (e.g., shell script, Python), similar in nature to existing scripts like `evals/scripts/run-eval.sh`.
5.  **FR5: Extensible Test Data:** The system must support an evolving and expanding dataset of test cases, accommodating various languages, diverse ways of stating quantities, utterances with no valid groceries, ambiguous items, and other linguistic variations.
6.  **FR6: `usualGroceries` Impact Testing:** The evaluation tests should include scenarios designed to assess the impact and effectiveness of the `usualGroceries` feature on parsing accuracy.

## 5. Non-Goals (Out of Scope)

*   Advanced semantic matching or normalization for item names beyond simple string comparisons for FR3.5 in the initial version.
*   A dedicated graphical user interface (GUI) for visualizing detailed evaluation results. Initial analysis will rely on console output and potentially the OpenAI Evals dashboard.
*   Automated generation or synthesis of test data. Test cases will be manually curated and expanded as needed.
*   (Initially) Explicitly defining and handling highly obscure or extremely complex edge-case utterances, unless they become apparent through user data.

## 6. Design Considerations (Optional)

*   Not applicable for the initial script-based version.

## 7. Technical Considerations (Optional)

*   The evaluation script will likely leverage OpenAI's Python/Node.js libraries or APIs for executing checks, particularly the LLM-based validation for item meaningfulness (FR3.4).
*   The system architecture should facilitate easy switching or updating of the LLM model under test (e.g., gpt-4o-mini, gpt-4o, future models).
*   Test data will be stored and maintained in JSONL format in the `evals/data/grocery_test_data.jsonl` file.
*   The core grocery parsing logic resides in `lib/services/grocery-service.ts` and `lib/services/openai-service.ts`.
*   Prompts used for LLM interaction are defined in `lib/prompts/grocery-prompts.ts` and `evals/scripts/grocery-eval-run.json`. These prompts must be aligned with the requirement for numeric quantities if FR3.3 is strictly enforced as numeric.

## 8. Success Metrics

*   **Primary Metric:** 100% pass rate across all test cases and all defined evaluation criteria (FR3.1-FR3.5) for any given evaluation run.
*   **Criterion Clarity:** Each individual evaluation criterion (e.g., JSON validity, schema adherence) must yield an unambiguous PASS or FAIL result for each test case.

## 9. Open Questions & Resolutions

1.  **Quantity Field Type Resolution:** 
    *   **Status:** Resolved.
    *   **Decision:** The `quantity` field must be a **number** (FR3.3). 
    *   **Action:** The test data in `evals/data/grocery_test_data.jsonl` and all relevant LLM prompts (e.g., in `lib/prompts/grocery-prompts.ts`, `evals/scripts/grocery-eval-run.json`) must be updated to strictly align with this requirement, ensuring only numeric quantities are expected and generated.

2.  **Definition of "Meaningful Grocery" for LLM Check (FR3.4):** 
    *   **Status:** Initial proposal made.
    *   **Details:** A prompt for the secondary LLM has been proposed in FR3.4. 
    *   **Next Step:** Review and confirm if the proposed prompt is sufficient or requires refinement.

3.  **Handling of Units:** 
    *   **Status:** Resolved for initial scope.
    *   **Decision:** If `quantity` is strictly numeric, any units explicitly mentioned in user utterances (e.g., "литр", "кг", "пачки") will be **ignored** by the primary parsing LLM for the current version. This may be revisited for future enhancements if a need to extract units is identified.

4.  **Scope of "Naming Differences" (FR3.5):** 
    *   **Status:** Initial scope defined.
    *   **Details:** For the initial version, simple matching techniques are defined in FR3.5 (case-insensitivity, basic singular/plural, substring matching). 
    *   **Next Step:** Confirm if this scope is acceptable for the initial implementation.

5.  **Specifics of "Script-Based Running" (FR4):** 
    *   **Status:** Resolved.
    *   **Decision:** This refers to a **custom-developed script** (e.g., shell script, Python), similar in approach to `evals/scripts/run-eval.sh`, rather than relying solely on the `oaieval` command-line tool.

6.  **Complex Utterances (Non-Goal Clarification):** 
    *   **Status:** Remains a non-goal for the initial version.
    *   **Consideration:** A process for identifying and incorporating challenging utterances encountered in user interactions into the test set should be considered for future enhancements.
