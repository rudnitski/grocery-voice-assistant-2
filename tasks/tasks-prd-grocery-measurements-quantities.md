# Task List: Grocery Measurements and Quantities Support

## Relevant Files

- `lib/types/grocery-types.ts` - New file for defining measurement interfaces and types
- `lib/services/grocery-service.ts` - Update to handle measurements in grocery items
- `lib/prompts/grocery-prompts.ts` - Update prompts to recognize and extract measurements
- `lib/utils/measurement-utils.ts` - New utility functions for measurement formatting and handling
- `components/grocery-item.tsx` - Update to display measurement information
- `components/grocery-list.tsx` - Update item interface to include measurements
- `app/api/parse_groceries/route.ts` - Update API route to handle measurements
- `evals/test-cases/measurement-cases.json` - New test cases for measurement recognition
- `evals/utils/eval-criteria.ts` - Update evaluation criteria to include measurements

### Notes

- This feature requires modifications to both the data model and the UI components
- Testing should cover various measurement expressions and edge cases
- The OpenAI prompt needs careful updating to ensure accurate measurement extraction

## Tasks

- [x] 1.0 Data Model and Type Definitions
  - [x] 1.1 Create `lib/types/grocery-types.ts` file with measurement interfaces
  - [x] 1.2 Define `Measurement` interface with `value` and `unit` properties
  - [x] 1.3 Define constants for supported measurement units (weight, volume, count)
  - [x] 1.4 Update `GroceryItemWithAction` interface to include optional `measurement` property
  - [x] 1.5 Ensure backward compatibility with existing code that doesn't use measurements

- [x] 2.0 Measurement Parsing and Utilities
  - [x] 2.1 Create `lib/utils/measurement-utils.ts` file
  - [x] 2.2 Implement function to parse measurement strings (e.g., "500g", "2L")
  - [x] 2.3 Implement function to format measurements for display
  - [x] 2.4 Create utility for unit normalization (e.g., "gram" → "g", "liter" → "L")
  - [x] 2.5 Implement function to detect measurement type (weight, volume, count)
  - [x] 2.6 Create utility for basic measurement arithmetic (for quantity modifications)
  - [x] 2.7 Add unit tests for measurement utilities

- [x] 3.0 OpenAI Integration and Prompts
  - [x] 3.1 Update `GROCERY_EXTRACTION_PROMPT` in `grocery-prompts.ts` to include measurement instructions
  - [x] 3.2 Update `GROCERY_RESPONSE_FORMAT` in `grocery-service.ts` to include measurement fields
  - [x] 3.3 Modify `extractGroceryItems` function to handle measurements in responses
  - [x] 3.4 Update `processGroceryActions` to handle measurements during add/modify operations
  - [x] 3.5 Enhance the API route handler in `parse_groceries/route.ts` to pass measurements
  - [x] 3.6 Add examples with measurements to the prompt
  - [x] 3.7 Test the updated prompt with various measurement expressions

- [x] 4.0 UI Components for Measurement Display
  - [x] 4.1 Update `GroceryItem` props interface to include measurement
  - [x] 4.2 Modify `GroceryItem` component to display measurement between quantity and item name
  - [x] 4.3 Update `GroceryList` component's item interface
  - [x] 4.4 Implement conditional rendering for items with/without measurements
  - [x] 4.5 Add appropriate styling for measurement display
  - [x] 4.6 Ensure accessibility is maintained with the new measurement display
  - [x] 4.7 Implement smart quantity controls that respect measurement units
  - [x] 4.8 Test UI with various measurement types and edge cases

- [x] 5.0 Testing and Evaluation
  - [x] 5.1 Create test cases for various measurement scenarios and merge into `grocery_test_data.jsonl`
  - [x] 5.2 Update evaluation criteria in `eval-criteria.ts` to check measurement accuracy
  - [x] 5.3 Add unit tests for new measurement-related functions
  - [x] 5.4 Test with various languages and measurement expressions
  - [x] 5.5 Test edge cases (fractional measurements, unusual units, etc.)
  - [x] 5.6 Verify backward compatibility with existing grocery items
  - [ ] 5.7 Test the full flow from voice input to UI display
  - [x] 5.8 Document known limitations or edge cases
  - [x] 5.9 Run full evaluation suite and fix any issues
