# Measurement Parsing Limitations and Edge Cases

This document outlines the known limitations and edge cases of the multilingual measurement parsing system in the Grocery Voice Assistant.

## Supported Features

The measurement parsing system currently supports:

- Basic metric units (g, kg, ml, L) in multiple languages
- Imperial units (oz, lb, fl oz, cups) in multiple languages
- Fractional measurements (e.g., "1/2 cup", "2 1/2 kg")
- Different decimal separators (dot and comma)
- Various unit formats (e.g., "500g", "2.5 kg", "1,5 L")
- Text between numbers and units (e.g., "2 large cups")
- Prefixes like "about", "approximately", etc.
- Language-specific unit variations and plurals

## Known Limitations

### Mixed Units

- **Not Supported**: Expressions with mixed units like "1 lb 4 oz" or "1 L 250 ml" are not currently parsed
- **Current Behavior**: Returns `null` for these expressions
- **Future Enhancement**: Could implement conversion to a single unit and combine values

### Complex Ranges

- **Limited Support**: Expressions like "2-3 kg" or "between 4 and 5 cups" are not fully supported
- **Current Behavior**: May extract only the first number or return `null`
- **Future Enhancement**: Could implement range detection and store min/max values

### Uncommon Units

- **Limited Support**: Uncommon units like "pinch", "dash", "handful" have limited support
- **Current Behavior**: May not be recognized or normalized correctly
- **Future Enhancement**: Add support for more qualitative measurements

### Language-Specific Challenges

- **Italian**: Plural forms often change from 'o' to 'i' (e.g., "litro" → "litri")
- **French**: Plural forms often end with 's' or 'es' (e.g., "gramme" → "grammes")
- **Current Solution**: Special handling for common plural forms, but may not cover all cases

### Unit Ambiguity

- **Potential Issue**: Some abbreviated units may be ambiguous (e.g., "c" could be cup or centiliter)
- **Current Behavior**: Uses most common interpretation based on context
- **Future Enhancement**: Could use context or user preferences to disambiguate

## Edge Cases Handled

- **Unusual Formats**: Handles formats like "500-g", "2.L", "1/2cup" (no space)
- **Language Suffixes**: Supports units with language suffixes like "grammes_fr" or "liter_de"
- **Accented Characters**: Normalizes accented characters in unit names
- **Plural Forms**: Handles common plural forms in various languages

## Testing Coverage

- Unit tests cover basic functionality, multilingual support, and common edge cases
- Comprehensive multilingual tests for Spanish, French, German, and Italian
- Tests for imperial units in multiple languages
- Tests for fractional and complex measurement expressions

## Recommendations for Users

- Use standard unit abbreviations when possible (g, kg, L, ml)
- Avoid mixing units in a single measurement
- For complex measurements, split into multiple items
- Be explicit about units when using voice input
