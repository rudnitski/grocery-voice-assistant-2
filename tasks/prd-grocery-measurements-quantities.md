# Product Requirements Document: Grocery Measurements and Quantities Support

## 1. Introduction/Overview

The Grocery Voice Assistant currently processes quantities as simple numeric values (e.g., "3 apples" is stored as quantity: 3). However, users often express measurements in various units when referring to grocery items (e.g., "500 grams of flour", "2 liters of milk"). This feature will enhance the system to recognize, process, and display these measurements appropriately, making the grocery list more accurate and useful.

## 2. Goals

1. Enable the system to recognize and process common measurement units when users mention them in voice or text input
2. Display measurements alongside quantities in the UI for a more accurate representation of grocery items
3. Support various measurement types commonly used for groceries (weight, volume, count)
4. Maintain a consistent user experience across the application

## 3. User Stories

1. As a user, I want to say "add 500 grams of flour" and have the system correctly recognize and display "500g flour" in my grocery list.
2. As a user, I want to say "2 liters of milk" and have the system correctly recognize and display "2L milk" in my grocery list.
3. As a user, I want to modify the measurement of an item by saying "change flour to 250 grams" and have the system update accordingly.
4. As a user, I want the system to handle both measured items (e.g., "500g flour") and count-based items (e.g., "3 apples") simultaneously in my grocery list.

## 4. Functional Requirements

1. **Data Model Enhancement**
   1.1. Extend the `GroceryItemWithAction` interface to include an optional measurement object with value and unit fields
   1.2. Support the following measurement types:
      - Weight: grams (g), kilograms (kg), pounds (lb), ounces (oz)
      - Volume: milliliters (mL), liters (L), fluid ounces (fl oz), cups
      - Count: pieces, units (default when no measurement is specified)

2. **Measurement Parsing**
   2.1. Update the OpenAI prompt to recognize and extract measurement information from user input
   2.2. Enhance the response format to include measurement value and unit
   2.3. Support various ways users might express measurements (e.g., "500 grams", "half a kilo", "2 liters")
   2.4. Handle abbreviations and variations (e.g., "g", "gram", "grams")

3. **UI Updates**
   3.1. Modify the grocery item component to display measurement information between quantity and item name
   3.2. Format measurements appropriately (e.g., "500g", "2L", "3oz")
   3.3. Ensure the UI remains clean and readable with the addition of measurement information

4. **Measurement Modification**
   4.1. Allow users to modify measurements using natural language (e.g., "change flour to 250 grams")
   4.2. Process measurement modifications using the existing action framework ("add", "remove", "modify")

5. **Evaluation Framework Updates**
   5.1. Update the evaluation criteria to include measurement accuracy
   5.2. Create test cases specifically for measurement recognition and processing

## 5. Non-Goals (Out of Scope)

1. Advanced unit conversion (e.g., automatically converting between metric and imperial units)
2. Nutritional information based on measurements
3. Recipe integration or meal planning features
4. Precise measurement validation (users decide what measurements are reasonable)
5. Shopping price calculation based on measurements

## 6. Design Considerations

1. **UI Display Format**
   - For items with measurements: `[Quantity] [Measurement] [Item Name]` (e.g., "2 500g flour")
   - For items without measurements (count-based): `[Quantity] [Item Name]` (e.g., "3 apples")

2. **Measurement Formatting**
   - Use standard abbreviations where possible (g, kg, L, mL)
   - No space between value and unit (e.g., "500g" not "500 g")
   - Capitalize L for liters to distinguish from the number 1

## 7. Technical Considerations

1. **Data Model Changes**
   ```typescript
   interface Measurement {
     value: number;
     unit: string; // 'g', 'kg', 'L', 'mL', 'lb', 'oz', 'cup', etc.
   }

   interface GroceryItemWithAction {
     item: string;
     quantity: number;
     action?: 'add' | 'remove' | 'modify';
     measurement?: Measurement; // Optional measurement information
   }
   ```

2. **OpenAI Prompt Enhancement**
   - Update the GROCERY_EXTRACTION_PROMPT to include instructions for detecting and extracting measurements
   - Modify the response format to include measurement information

3. **Processing Logic**
   - Enhance the `processGroceryActions` function to handle measurements during add/modify operations
   - Ensure backward compatibility with items that don't have measurements

4. **UI Component Updates**
   - Modify the `GroceryItem` component to display measurement information
   - Update the item interface in `GroceryList` component

## 8. Success Metrics

1. **Accuracy**: The system correctly recognizes and processes at least 90% of common measurement expressions in test cases
2. **User Experience**: Users can seamlessly add, modify, and view items with measurements
3. **Compatibility**: Existing functionality continues to work correctly with the new measurement features

## 9. Open Questions

1. Should the system attempt to normalize measurements (e.g., convert "1000g" to "1kg")?
2. How should fractional measurements be handled in the UI (e.g., "0.5L" vs "500mL")?
3. Should the system support custom or less common measurement units?
