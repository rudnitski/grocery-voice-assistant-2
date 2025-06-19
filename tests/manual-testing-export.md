# Manual Testing Plan: Export Grocery List Feature

## Test Cases for Export Functionality

### 1. Happy Path: Export with Clipboard API (Task 5.1)
- **Preparation**: Add items to the grocery list (use mock data checkbox)
- **Test Steps**:
  1. Click the Copy button in the top-right of the Grocery List panel
  2. Verify that a success toast notification appears with "Copied!" message
  3. Paste the clipboard content elsewhere to verify the formatted list was copied
- **Expected Result**: Toast appears with success message; clipboard contains properly formatted list

### 2. Disabled State for Empty List (Task 5.2)
- **Preparation**: Ensure the grocery list is empty
- **Test Steps**:
  1. Observe the Copy button in the Grocery List panel
- **Expected Result**: Button should be visually disabled and not clickable

### 3. Fallback Dialog Test (Task 5.3)
- **Preparation**: Add items to the grocery list
- **Test Steps**:
  1. Simulate clipboard API failure by:
     - Testing in a browser context where clipboard access is restricted
     - OR click the Share button to open the dialog directly
  2. In the dialog, click the Copy button
  3. Verify that text is selected in the textarea
  4. Verify toast notification shows appropriate fallback message
- **Expected Result**: Dialog opens; text is selected; toast notification appears

### 4. Format Verification (Task 5.4)
- **Preparation**: Add various types of items to the grocery list
  - Items with simple quantities (e.g., "3 apples")
  - Items with measurements (e.g., "2 liters of milk")
- **Test Steps**:
  1. Click the Copy button to copy the list
  2. Paste and verify formatting
- **Expected Results**: 
  - List should be properly formatted with bullet points
  - Items with measurements should display the measurement correctly
  - Consistent spacing and formatting across all items

## Results Documentation

| Test Case | Pass/Fail | Notes |
|-----------|-----------|-------|
| Happy Path |          |       |
| Disabled State |     |       |
| Fallback Dialog |    |       |
| Format Verification | |      |
