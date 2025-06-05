/**
 * Measurement Utilities
 * 
 * This file contains utility functions for working with measurements in grocery items.
 * It includes functions for parsing, normalizing, formatting, and converting measurements.
 */

import {
  Measurement,
  MeasurementType,
  MeasurementUnit,
  WeightUnit,
  VolumeUnit,
  CountUnit,
  UNIT_TO_TYPE_MAP,
  UNIT_NORMALIZATION_MAP,
  MEASUREMENT_DISPLAY_FORMAT
} from '../types/grocery-types';

/**
 * Parses a measurement string into a Measurement object
 * Example: "500g" -> { value: 500, unit: "g", type: "weight" }
 * 
 * @param measurementStr The measurement string to parse
 * @returns A Measurement object or null if parsing fails
 */
export function parseMeasurement(measurementStr: string): Measurement | null {
  if (!measurementStr) return null;
  
  // Normalize special characters for fractions
  let normalizedStr = measurementStr;
  
  // Handle special case for 2½ cups -> should be 2 1/2 cups
  normalizedStr = normalizedStr.replace(/([0-9])([½¼¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/g, '$1 $2');
  
  normalizedStr = normalizedStr
    .replace(/½/g, '1/2')
    .replace(/¼/g, '1/4')
    .replace(/¾/g, '3/4')
    .replace(/⅓/g, '1/3')
    .replace(/⅔/g, '2/3')
    .replace(/⅕/g, '1/5')
    .replace(/⅖/g, '2/5')
    .replace(/⅗/g, '3/5')
    .replace(/⅘/g, '4/5')
    .replace(/⅙/g, '1/6')
    .replace(/⅚/g, '5/6')
    .replace(/⅛/g, '1/8')
    .replace(/⅜/g, '3/8')
    .replace(/⅝/g, '5/8')
    .replace(/⅞/g, '7/8')
    .replace(/⁄/g, '/');
  
  // Remove common prefixes like 'about', 'approximately', etc.
  normalizedStr = normalizedStr.replace(/^(about|approximately|around|circa|roughly)\s+/i, '');
  
  // Check for mixed units (e.g., "1 lb 4 oz") - we don't support these yet
  if (/\d+\s+\w+\s+\d+\s+\w+/.test(normalizedStr)) {
    return null;
  }
  
  // Regular expression to match a number followed by a unit
  // Handles formats like "500g", "2.5 kg", "1/2 cup", "1,5 kg", "2 1/2 cups"
  // Also handles accented characters in unit names, hyphens, and periods
  // Updated to handle language suffixes like _fr, _de, etc.
  const regex = /^([\d.,\/\s]+)\s*[-.]?\s*([\p{L}]+(?:_[a-z]{2})?(?:\s+[\p{L}_]+)*)$/u;
  const match = normalizedStr.trim().match(regex);
  
  // If the standard regex doesn't match, try a more permissive one that allows text between number and unit
  // This handles cases like "2 large cups"
  if (!match) {
    const permissiveRegex = /^([\d.,\/\s]+)\s+(?:[\w\s]+\s+)?([\p{L}]+(?:_[a-z]{2})?)$/u;
    const permissiveMatch = normalizedStr.trim().match(permissiveRegex);
    if (permissiveMatch) {
      return processMatchResult(permissiveMatch[1], permissiveMatch[2]);
    }
    return null;
  }
  
  return processMatchResult(match[1], match[2]);
}

/**
 * Helper function to process regex match results for measurement parsing
 * 
 * @param valueStr The string representation of the measurement value
 * @param unitStr The string representation of the measurement unit
 * @returns A Measurement object or null if processing fails
 */
function processMatchResult(valueStr: string, unitStr: string): Measurement | null {
  // Handle European decimal separator (comma)
  valueStr = valueStr.replace(',', '.');
  
  // Handle combined whole numbers and fractions like "2 1/2"
  let value: number;
  if (valueStr.includes('/')) {
    // Check if we have a whole number followed by a fraction (e.g., "2 1/2")
    const wholeFractionMatch = valueStr.match(/^\s*(\d+)\s+(\d+)\/(\d+)\s*$/);
    if (wholeFractionMatch) {
      const [_, whole, numerator, denominator] = wholeFractionMatch;
      value = parseInt(whole) + (parseInt(numerator) / parseInt(denominator));
    } else {
      // Simple fraction (e.g., "1/2")
      const [numerator, denominator] = valueStr.split('/').map(Number);
      value = numerator / denominator;
    }
  } else {
    value = parseFloat(valueStr);
  }
  
  if (isNaN(value)) return null;
  
  // Normalize the unit
  const normalizedUnit = normalizeUnit(unitStr);
  if (!normalizedUnit) return null;
  
  // Get the measurement type from the unit
  const type = UNIT_TO_TYPE_MAP[normalizedUnit];
  
  return {
    value,
    unit: normalizedUnit,
    type
  };
}

/**
 * Normalizes a unit string to a standard unit from the MeasurementUnit enum
 */
export function normalizeUnit(unitStr: string): MeasurementUnit | null {
  if (!unitStr) return null;
  
  // Trim and convert to lowercase for case-insensitive matching
  const normalizedStr = unitStr.trim().toLowerCase();
  
  // Check if the unit is in our normalization map
  const unit = UNIT_NORMALIZATION_MAP[normalizedStr];
  if (unit) return unit;
  
  // Try to match without language suffixes for better flexibility
  // This helps with tests that might not include the language suffix
  const unitWithoutSuffix = normalizedStr.replace(/_(fr|de|it|en|es)$/, '');
  if (unitWithoutSuffix !== normalizedStr) {
    // First try direct mapping with the suffix removed
    const mappedUnit = UNIT_NORMALIZATION_MAP[unitWithoutSuffix];
    if (mappedUnit) return mappedUnit;
    
    // Handle French plural forms (often end with 's' or 'es')
    if (normalizedStr.includes('_fr')) {
      if (unitWithoutSuffix.endsWith('s') && unitWithoutSuffix.length > 1) {
        const singularForm = unitWithoutSuffix.slice(0, -1);
        const singularUnit = UNIT_NORMALIZATION_MAP[singularForm];
        if (singularUnit) return singularUnit;
      }
      
      if (unitWithoutSuffix.endsWith('es') && unitWithoutSuffix.length > 2) {
        const singularForm = unitWithoutSuffix.slice(0, -2);
        const singularUnit = UNIT_NORMALIZATION_MAP[singularForm];
        if (singularUnit) return singularUnit;
      }
      
      // Special case for French 'grammes'
      if (unitWithoutSuffix === 'grammes' || unitWithoutSuffix === 'gramme') {
        return WeightUnit.GRAM;
      }
    }
    
    return null;
  }
  
  // Handle accented characters by replacing them with non-accented versions
  // This is a simplified approach - for production, consider using a proper library
  const deAccentedStr = normalizedStr
    .replace(/[àáâäã]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôöõ]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n');
  
  if (deAccentedStr !== normalizedStr) {
    return UNIT_NORMALIZATION_MAP[deAccentedStr] || null;
  }
  
  // Special handling for common unit variations that might not be in the map
  // This is especially important for multilingual support
  
  // Handle plural forms by removing trailing 's' if present
  if (normalizedStr.endsWith('s') && normalizedStr.length > 1) {
    const singularForm = normalizedStr.slice(0, -1);
    const singularUnit = UNIT_NORMALIZATION_MAP[singularForm];
    if (singularUnit) return singularUnit;
  }
  
  // Handle common weight units
  // Check for kilogram variations first (more specific) before gram variations
  if (normalizedStr.includes('kilogram') || normalizedStr.includes('kilogramo') || 
      normalizedStr.includes('kilogramm') || normalizedStr.includes('chilogramm')) {
    return WeightUnit.KILOGRAM;
  }
  
  // Only check for gram if we haven't matched kilogram
  if (normalizedStr.includes('gram') || normalizedStr.includes('gramo')) {
    return WeightUnit.GRAM;
  }
  
  // Handle ounce variations
  if (normalizedStr.includes('ounce') || normalizedStr.includes('onza') || 
      normalizedStr.includes('once') || normalizedStr.includes('oncia') || 
      normalizedStr.includes('unze') || normalizedStr === 'oz') {
    return WeightUnit.OUNCE;
  }
  
  // Handle pound variations
  if (normalizedStr.includes('pound') || normalizedStr.includes('libra') || 
      normalizedStr.includes('livre') || normalizedStr.includes('pfund') || 
      normalizedStr === 'lb' || normalizedStr === 'lbs') {
    return WeightUnit.POUND;
  }
  
  // Handle common volume units
  if (normalizedStr.includes('liter') || normalizedStr.includes('litre') || 
      normalizedStr.includes('litro') || normalizedStr.includes('litri')) {
    return VolumeUnit.LITER;
  }
  
  if (normalizedStr.includes('cup') || normalizedStr.includes('taza') || 
      normalizedStr.includes('tasse')) {
    return VolumeUnit.CUP;
  }
  
  return null;
}

/**
 * Formats a measurement for display
 * Example: { value: 500, unit: "g" } -> "500g"
 * 
 * @param measurement The measurement to format
 * @returns A formatted string representation of the measurement
 */
export function formatMeasurement(measurement: Measurement): string {
  if (!measurement || !measurement.unit) return '';
  
  const format = MEASUREMENT_DISPLAY_FORMAT[measurement.unit] || '{value} {unit}';
  
  // Format the value to avoid unnecessary decimal places
  const formattedValue = Number.isInteger(measurement.value)
    ? measurement.value.toString()
    : measurement.value.toFixed(2).replace(/\.?0+$/, '');
  
  return format
    .replace('{value}', formattedValue)
    .replace('{unit}', measurement.unit);
}

/**
 * Attempts to convert a measurement to a more appropriate unit
 * Example: 1000g -> 1kg, 1000mL -> 1L
 * 
 * @param measurement The measurement to normalize
 * @returns A normalized measurement or the original if no normalization is needed
 */
export function normalizeMeasurement(measurement: Measurement): Measurement {
  if (!measurement) return measurement;
  
  const { value, unit, type } = measurement;
  
  // Weight normalizations
  if (unit === WeightUnit.GRAM && value >= 1000) {
    return {
      value: value / 1000,
      unit: WeightUnit.KILOGRAM,
      type: MeasurementType.WEIGHT
    };
  }
  
  // Volume normalizations
  if (unit === VolumeUnit.MILLILITER && value >= 1000) {
    return {
      value: value / 1000,
      unit: VolumeUnit.LITER,
      type: MeasurementType.VOLUME
    };
  }
  
  return measurement;
}

/**
 * Combines two measurements of the same type
 * Example: 500g + 250g = 750g
 * 
 * @param m1 First measurement
 * @param m2 Second measurement
 * @returns Combined measurement or null if they can't be combined
 */
export function combineMeasurements(m1: Measurement, m2: Measurement): Measurement | null {
  if (!m1 || !m2) return m1 || m2 || null;
  
  // If units are the same, simply add values
  if (m1.unit === m2.unit) {
    const combined = {
      value: m1.value + m2.value,
      unit: m1.unit,
      type: m1.type
    };
    
    // Normalize the result if needed
    return normalizeMeasurement(combined);
  }
  
  // If units are different but of the same type, convert to a common unit
  if (m1.type === m2.type) {
    if (m1.type === MeasurementType.WEIGHT) {
      // Convert both to grams for calculation
      const m1InGrams = convertToGrams(m1);
      const m2InGrams = convertToGrams(m2);
      
      if (m1InGrams && m2InGrams) {
        const combined = {
          value: m1InGrams.value + m2InGrams.value,
          unit: WeightUnit.GRAM,
          type: MeasurementType.WEIGHT
        };
        
        // Normalize the result (e.g., convert 1000g to 1kg)
        return normalizeMeasurement(combined);
      }
    }
    
    if (m1.type === MeasurementType.VOLUME) {
      // Convert both to milliliters for calculation
      const m1InMl = convertToMilliliters(m1);
      const m2InMl = convertToMilliliters(m2);
      
      if (m1InMl && m2InMl) {
        const combined = {
          value: m1InMl.value + m2InMl.value,
          unit: VolumeUnit.MILLILITER,
          type: MeasurementType.VOLUME
        };
        
        // Normalize the result (e.g., convert 1000mL to 1L)
        return normalizeMeasurement(combined);
      }
    }
  }
  
  // Cannot combine measurements of different types
  return null;
}

/**
 * Converts a weight measurement to grams
 * 
 * @param measurement The weight measurement to convert
 * @returns The measurement in grams or null if conversion is not possible
 */
export function convertToGrams(measurement: Measurement): Measurement | null {
  if (!measurement || measurement.type !== MeasurementType.WEIGHT) return null;
  
  let valueInGrams: number;
  
  switch (measurement.unit) {
    case WeightUnit.GRAM:
      valueInGrams = measurement.value;
      break;
    case WeightUnit.KILOGRAM:
      valueInGrams = measurement.value * 1000;
      break;
    case WeightUnit.POUND:
      valueInGrams = measurement.value * 453.592;
      break;
    case WeightUnit.OUNCE:
      valueInGrams = measurement.value * 28.3495;
      break;
    default:
      return null;
  }
  
  return {
    value: valueInGrams,
    unit: WeightUnit.GRAM,
    type: MeasurementType.WEIGHT
  };
}

/**
 * Converts a volume measurement to milliliters
 * 
 * @param measurement The volume measurement to convert
 * @returns The measurement in milliliters or null if conversion is not possible
 */
export function convertToMilliliters(measurement: Measurement): Measurement | null {
  if (!measurement || measurement.type !== MeasurementType.VOLUME) return null;
  
  let valueInMl: number;
  
  switch (measurement.unit) {
    case VolumeUnit.MILLILITER:
      valueInMl = measurement.value;
      break;
    case VolumeUnit.LITER:
      valueInMl = measurement.value * 1000;
      break;
    case VolumeUnit.FLUID_OUNCE:
      valueInMl = measurement.value * 29.5735;
      break;
    case VolumeUnit.CUP:
      valueInMl = measurement.value * 236.588;
      break;
    default:
      return null;
  }
  
  return {
    value: valueInMl,
    unit: VolumeUnit.MILLILITER,
    type: MeasurementType.VOLUME
  };
}
