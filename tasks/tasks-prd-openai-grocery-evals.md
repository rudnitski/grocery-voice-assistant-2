## Relevant Files

- `evals/scripts/run-grocery-eval.ts` - Main custom script to be developed for orchestrating the OpenAI Evals for grocery parsing, as per PRD.
- `evals/scripts/run-grocery-eval.test.ts` - Unit tests for the new `run-grocery-eval.ts` script.
- `evals/data/grocery_test_data.jsonl` - Contains the curated test cases (utterances and expected JSON outputs). (Needs alignment with FR3.3)
- `evals/utils/eval-criteria.ts` - New module to define and implement specific evaluation criteria functions (JSON validity, schema, quantity type, item meaningfulness, item source match).
- `evals/utils/eval-criteria.test.ts` - Unit tests for `eval-criteria.ts`.
- `lib/services/grocery-service.ts` - Existing core service for grocery item extraction; will be invoked by the new evaluation script.
- `lib/services/openai-service.ts` - Existing service for OpenAI API interactions; used by `grocery-service.ts` and for the secondary LLM call in FR3.4.
- `lib/prompts/grocery-prompts.ts` - Contains the primary LLM prompt for grocery extraction. (Needs alignment with FR3.3)
- `evals/scripts/grocery-eval-run.json` - Existing configuration used for the current/first working version of an OpenAI eval. Review for reference (prompts, model, schema). (Needs alignment with FR3.3 if its definitions are strictly followed/reused for the new script)
- `evals/config/grocery_add_eval.json` - Existing configuration file, likely related to the current/first working version of an OpenAI eval. Review for relevant settings or structures.

### Notes

- Unit tests should be created for all new non-trivial logic, especially in `run-grocery-eval.ts` and `eval-criteria.ts`.
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- Ensure all new scripts are executable and have necessary shebangs or run instructions if applicable (e.g. for shell scripts, though TypeScript is anticipated for the main eval script).
- The PRD (Section 9, Point 1) mandates that `quantity` must be a number. This requires updating `grocery_test_data.jsonl`, `grocery-prompts.ts`, and potentially `grocery-eval-run.json` to align with this. This task is explicitly included below.

## Tasks

- [x] 1.0 Setup Evaluation Framework and Test Data Management
  - [x] 1.1 Define the project structure for the new evaluation script within the `evals` directory (e.g., `evals/scripts/run-grocery-eval.ts`, `evals/utils/`).
  - [x] 1.2 Implement a robust mechanism in `run-grocery-eval.ts` to load and parse test cases from `evals/data/grocery_test_data.jsonl` (FR1).
  - [x] 1.3 **Align Test Data and Prompts with Numeric Quantity Requirement (PRD FR3.3 & Section 9.1):**
    - [x] 1.3.1 Modify `evals/data/grocery_test_data.jsonl` to ensure all `quantity` fields in `expect_json` are numbers.
    - [x] 1.3.2 Update the prompt in `lib/prompts/grocery-prompts.ts` to instruct the LLM to return `quantity` as a number.
    - [x] 1.3.3 Review and update `evals/scripts/grocery-eval-run.json` (if its prompt is reused or referenced) to ensure consistency regarding numeric quantities.
  - [x] 1.4 Ensure the system supports easy extension of test data (FR5).

- [x] 2.0 Implement Core LLM Invocation with `usualGroceries` Feature
  - [x] 2.1 In `run-grocery-eval.ts`, for each test case, implement the logic to invoke the main grocery parsing LLM (e.g., by calling `extractGroceryItems` from `lib/services/grocery-service.ts`), ensuring it uses the SSoT prompt from `lib/prompts/grocery-prompts.ts` and aligns with the SSoT schema from `lib/services/grocery-service.ts` (FR2).
  - [x] 2.2 Ensure the `usualGroceries` list (can be a predefined example list for testing, or configurable) is correctly passed to the LLM invocation (FR2).
  - [x] 2.3 Handle responses from the LLM, including potential errors or timeouts.

- [x] 3.0 Develop Comprehensive Output Evaluation Logic (in `evals/utils/eval-criteria.ts` and used by `run-grocery-eval.ts`)
  - [x] 3.1 Implement JSON Validity Check (FR3.1): Verify if the LLM output is a syntactically valid JSON string. Handle empty JSON `{"items": []}` correctly.
  - [x] 3.2 Implement Schema Conformance Check (FR3.2): Check if the LLM output conforms to the expected schema (contains the required `items` array, each item has `item` and `quantity` properties, etc.)
  - [x] 3.3 Implement Item Matching Check (FR3.4): Verify if all expected grocery items are present in the LLM output. The check should be case-insensitive.
  - [x] 3.4 Implement Quantity Check (FR3.4): Verify if the quantities of grocery items match the expected values.
  - [x] 3.5 Calculate an overall score based on these evaluation metrics (correct items, incorrect items, extra items, etc.).

- [x] 4.0 Design and Implement `usualGroceries` Impact Test Cases
  - [x] 4.1 Analyze the `usualGroceries` feature and design specific test cases for `evals/data/grocery_test_data.jsonl` that highlight its impact (e.g., ambiguous items clarified by usual groceries, misspellings corrected) (FR6).
  - [x] 4.2 Add these new test cases to `evals/data/grocery_test_data.jsonl`, ensuring they have clear `utterance` and `expect_json` values that reflect the intended behavior of `usualGroceries`.

- [x] 5.0 Finalize Evaluation Script, Add Documentation, and Prepare for Execution
  - [x] 5.1 Structure `run-grocery-eval.ts` to iterate through all test cases, apply all evaluation criteria (FR3.1-FR3.5), and aggregate results.
  - [x] 5.2 Implement clear console output for evaluation results, showing per-test-case pass/fail status for each criterion, and a final summary (aiming for 100% pass rate - Success Metric).
  - [x] 5.3 Add inline comments and documentation to `run-grocery-eval.ts` and `evals/utils/eval-criteria.ts`.
  - [x] 5.4 Create a brief `README.md` within the `evals` directory (or update an existing one) explaining how to run the evaluation script and interpret its output (FR4).
  - [x] 5.5 Ensure all necessary dependencies are documented (e.g., in a project `package.json` or the new `README.md`).
