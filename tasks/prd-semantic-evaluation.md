# Product Requirements Document: Semantic Grocery Item Comparison

## Overview
The Grocery Voice Assistant currently evaluates the accuracy of extracted grocery items using exact string matching (case-insensitive). This approach is limited when dealing with natural language variations where the same item might be described in different ways. This PRD outlines a new feature to enhance the evaluation system with semantic comparison using GPT-4o to determine if two differently named items actually refer to the same grocery item.

## Problem Statement
Current evaluation limitations:
1. Different phrasings of the same item (e.g., "red apples" vs "apples red") are considered different items
2. Items with different qualifiers (e.g., "milk" vs "whole milk") may refer to the same product but are treated as distinct
3. Minor spelling variations or word ordering cause mismatches
4. Language flexibility and cultural/regional naming differences are not accommodated

## User Stories
1. As a developer, I want to evaluate my grocery extraction model with semantic understanding so that I can measure its true accuracy beyond exact string matching.
2. As a developer, I want to see detailed confidence scores for semantic matches so that I can assess the quality of the matches.
3. As a developer, I want to run evaluations with the usual command and see improved scores that reflect semantic understanding.

## Goals
1. Improve the accuracy of grocery item comparison during evaluation to achieve 100% success rate
2. Apply semantic comparison to all grocery items, not just when exact matching fails
3. Leverage the context of the usual groceries list for better disambiguation
4. Maintain compatibility with the existing evaluation framework
5. Provide confidence scores for item matches to support detailed analysis

## Non-Goals
1. This feature will not be used during actual grocery parsing/extraction, only in the evaluation system
2. Will not attempt to correct or modify the original grocery items
3. Will not change the user-facing interface or experience
4. Will not require special handling for specific types of grocery items

## Functional Requirements

### FR1: Semantic Comparison Service
1.1. Create a new service that uses the OpenAI API (GPT-4o) to compare two grocery items
1.2. The service must determine if the items refer to the same grocery product, despite naming differences
1.3. The service must return a confidence score and reasoning for each comparison
1.4. The service must incorporate the usual groceries list as context when available

### FR2: Integration with Evaluation System
2.1. Apply semantic comparison to all grocery items being evaluated
2.2. Update the scoring algorithm to consider semantic matches as valid matches
2.3. Track and report both exact matches and semantic matches
2.4. Maintain backward compatibility with existing test cases and evaluation framework

### FR3: Enhanced Reporting
3.1. Update the evaluation reports to show semantic matching results
3.2. Provide confidence scores for semantically matched items
3.3. Indicate which items were matched semantically vs. exactly

## Technical Implementation

### Semantic Comparison Prompt
Design a prompt for GPT-4o that:
1. Presents the extracted item and expected item for comparison
2. Includes the usual groceries list as context
3. Asks the model to determine if they refer to the same grocery item
4. Requests a confidence score (0-1) and reasoning for the decision
5. Structures the response as a consistent JSON object

### Evaluation Flow
1. For each expected item, check if it matches an actual item using semantic comparison
2. Use the confidence score to determine if the match is valid
3. Include semantic matches in the evaluation score
4. Update reporting to indicate which matches were semantic vs. exact

### API Considerations
1. Minimize token usage by keeping prompts concise
2. Implement proper error handling for API failures
3. Add caching to avoid redundant API calls for the same item comparisons
4. Consider batch processing to reduce API calls when comparing multiple items

## Success Metrics
1. Achieve 100% success rate in evaluation tests with semantic variations
2. Zero false negatives (items incorrectly marked as mismatches) in the test suite
3. Zero false positives (different items incorrectly marked as matches) in the test suite
4. Acceptable performance when running the evaluation script

## Rollout Plan
1. Implement the semantic comparison service
2. Modify the evaluation system to use the semantic comparison service
3. Run the evaluation script using standard command-line options
4. Update documentation to explain the new feature

## Future Considerations
1. Fine-tune or train a dedicated model for grocery item comparison
2. Expand the system to handle other types of semantic matching (actions, quantities)
3. Create a database of known equivalent items to reduce API calls
4. Consider integrating semantic understanding into the actual grocery parsing process
