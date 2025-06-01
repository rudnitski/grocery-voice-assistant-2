# Task List: Semantic Grocery Item Comparison

## Relevant Files

- `evals/utils/semantic-comparison.ts` - New service file for semantic comparison of grocery items using OpenAI API.
- `evals/utils/semantic-comparison.test.ts` - Unit tests for the semantic comparison service.
- `evals/utils/eval-criteria.ts` - Main evaluation logic that needs to be updated to support semantic comparison.
- `evals/utils/eval-criteria.test.ts` - Unit tests for the evaluation criteria.
- `evals/scripts/run-grocery-eval.ts` - Evaluation script that needs to be updated to support semantic comparison.
- `evals/README.md` - Documentation that needs to be updated with information about semantic comparison.

### Notes

- Unit tests should be run using `npx jest [path/to/test/file]` to ensure all functionality is properly tested.
- OpenAI API key should be loaded from environment variables, similar to how it's done in the existing codebase.
- Add caching to minimize API calls and improve performance during evaluation runs.

## Tasks

- [x] 1.0 Create Semantic Comparison Service
  - [x] 1.1 Create interface for semantic comparison results with isMatch, confidence, and reasoning fields
  - [x] 1.2 Design and implement prompt template for GPT-4o that includes extracted item, expected item, and usual groceries
  - [x] 1.3 Implement OpenAI API integration with proper error handling and retry logic
  - [x] 1.4 Implement caching mechanism to avoid redundant API calls for the same item comparisons
  - [x] 1.5 Add utility functions to sanitize and normalize grocery item names before comparison
  - [x] 1.6 Implement confidence threshold settings for determining valid matches
  
- [x] 2.0 Update Evaluation System
  - [x] 2.1 Modify `evaluateGroceryOutput` function to be async and support semantic comparison
  - [x] 2.2 Update matching logic to apply semantic comparison to all grocery items
  - [x] 2.3 Add support for passing the usual groceries list to the semantic comparison service
  - [x] 2.4 Ensure backward compatibility with existing test cases
  - [x] 2.5 Update evaluation scoring to count semantic matches as valid matches
  - [x] 2.6 Add optional flags to enable/disable semantic comparison
  
- [x] 3.0 Implement Enhanced Reporting
  - [x] 3.1 Extend evaluation results structure to include semantic match information
  - [x] 3.2 Update results display to show which items were matched semantically vs. exactly
  - [x] 3.3 Add confidence scores to the report for semantically matched items
  - [x] 3.4 Include reasoning from semantic comparison in detailed reports
  - [x] 3.5 Update summary statistics to reflect semantic matching improvements
  
- [ ] 4.0 Test and Validate Implementation
  - [ ] 4.1 Create unit tests for semantic comparison service
  - [ ] 4.2 Create integration tests for updated evaluation system
  - [ ] 4.3 Test with existing test cases to ensure backward compatibility
  - [ ] 4.4 Create test cases with known semantic variations to validate the new functionality
  - [ ] 4.5 Test performance with large grocery lists to assess API usage and runtime
  - [ ] 4.6 Validate that the semantic matching produces zero false positives or negatives
  
- [ ] 5.0 Update Documentation
  - [ ] 5.1 Update the evaluation README with information about semantic comparison
  - [ ] 5.2 Document the configuration options for enabling/disabling semantic comparison
  - [ ] 5.3 Add JSDoc comments to all new functions and interfaces
  - [ ] 5.4 Create examples of semantic matching in the documentation
  - [ ] 5.5 Document API usage considerations and caching behavior
