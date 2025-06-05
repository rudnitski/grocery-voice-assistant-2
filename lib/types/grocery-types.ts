/**
 * Grocery Types - Measurement Support
 * 
 * This file defines types and interfaces for grocery items with measurement support.
 * It includes definitions for various measurement units (weight, volume, count) and
 * the enhanced GroceryItemWithAction interface.
 */

/**
 * Measurement types supported by the application
 */
export enum MeasurementType {
  WEIGHT = 'weight',
  VOLUME = 'volume',
  COUNT = 'count'
}

/**
 * Weight units supported by the application
 */
export enum WeightUnit {
  GRAM = 'g',
  KILOGRAM = 'kg',
  POUND = 'lb',
  OUNCE = 'oz'
}

/**
 * Volume units supported by the application
 */
export enum VolumeUnit {
  MILLILITER = 'mL',
  LITER = 'L',
  FLUID_OUNCE = 'fl oz',
  CUP = 'cup'
}

/**
 * Count units (default when no measurement is specified)
 */
export enum CountUnit {
  PIECE = 'piece',
  UNIT = 'unit'
}

/**
 * All supported measurement units
 */
export type MeasurementUnit = WeightUnit | VolumeUnit | CountUnit;

/**
 * Measurement information for a grocery item
 */
export interface Measurement {
  value: number;
  unit: MeasurementUnit;
  type?: MeasurementType; // Can be inferred from the unit
}

/**
 * Grocery item with action and optional measurement
 * This extends the existing GroceryItemWithAction interface
 */
export interface GroceryItemWithMeasurement {
  item: string;
  quantity: number;
  action?: 'add' | 'remove' | 'modify';
  measurement?: Measurement;
}

/**
 * Map of units to their measurement types for easy lookup
 */
export const UNIT_TO_TYPE_MAP: Record<string, MeasurementType> = {
  // Weight units
  [WeightUnit.GRAM]: MeasurementType.WEIGHT,
  [WeightUnit.KILOGRAM]: MeasurementType.WEIGHT,
  [WeightUnit.POUND]: MeasurementType.WEIGHT,
  [WeightUnit.OUNCE]: MeasurementType.WEIGHT,
  
  // Volume units
  [VolumeUnit.MILLILITER]: MeasurementType.VOLUME,
  [VolumeUnit.LITER]: MeasurementType.VOLUME,
  [VolumeUnit.FLUID_OUNCE]: MeasurementType.VOLUME,
  [VolumeUnit.CUP]: MeasurementType.VOLUME,
  
  // Count units
  [CountUnit.PIECE]: MeasurementType.COUNT,
  [CountUnit.UNIT]: MeasurementType.COUNT
};

/**
 * Map of common unit variations to their standardized form
 * This helps normalize units from user input
 */
export const UNIT_NORMALIZATION_MAP: Record<string, MeasurementUnit> = {
  // Weight unit variations - English
  'gram': WeightUnit.GRAM,
  'grams': WeightUnit.GRAM,
  'g': WeightUnit.GRAM,
  'gr': WeightUnit.GRAM,
  
  'kilogram': WeightUnit.KILOGRAM,
  'kilograms': WeightUnit.KILOGRAM,
  'kilo': WeightUnit.KILOGRAM,
  'kilos': WeightUnit.KILOGRAM,
  'kg': WeightUnit.KILOGRAM,
  
  'pound': WeightUnit.POUND,
  'pounds': WeightUnit.POUND,
  'lb': WeightUnit.POUND,
  'lbs': WeightUnit.POUND,
  
  'ounce': WeightUnit.OUNCE,
  'ounces': WeightUnit.OUNCE,
  'oz': WeightUnit.OUNCE,
  
  // Volume unit variations - English
  'milliliter': VolumeUnit.MILLILITER,
  'milliliters': VolumeUnit.MILLILITER,
  'millilitre': VolumeUnit.MILLILITER,
  'millilitres': VolumeUnit.MILLILITER,
  'ml': VolumeUnit.MILLILITER,
  'mL': VolumeUnit.MILLILITER,
  
  'liter': VolumeUnit.LITER,
  'liters': VolumeUnit.LITER,
  'litre': VolumeUnit.LITER,
  'litres': VolumeUnit.LITER,
  'l': VolumeUnit.LITER,
  'L': VolumeUnit.LITER,
  
  'fluid ounce': VolumeUnit.FLUID_OUNCE,
  'fluid ounces': VolumeUnit.FLUID_OUNCE,
  'fl oz': VolumeUnit.FLUID_OUNCE,
  'floz': VolumeUnit.FLUID_OUNCE,
  
  'cup': VolumeUnit.CUP,
  'cups': VolumeUnit.CUP,
  
  // Count unit variations - English
  'piece': CountUnit.PIECE,
  'pieces': CountUnit.PIECE,
  'pc': CountUnit.PIECE,
  'pcs': CountUnit.PIECE,
  
  'unit': CountUnit.UNIT,
  'units': CountUnit.UNIT,
  
  // Spanish variations
  'gramo': WeightUnit.GRAM,
  'gramos': WeightUnit.GRAM,
  'kilogramo': WeightUnit.KILOGRAM,
  'kilogramos': WeightUnit.KILOGRAM,
  'libra': WeightUnit.POUND,
  'libras': WeightUnit.POUND,
  'onza': WeightUnit.OUNCE,
  'onzas': WeightUnit.OUNCE,
  'mililitro': VolumeUnit.MILLILITER,
  'mililitros': VolumeUnit.MILLILITER,
  'litro': VolumeUnit.LITER,
  'litros': VolumeUnit.LITER,
  'taza': VolumeUnit.CUP,
  'tazas': VolumeUnit.CUP,
  'pieza': CountUnit.PIECE,
  'piezas': CountUnit.PIECE,
  'unidad': CountUnit.UNIT,
  'unidades': CountUnit.UNIT,
  
  // French variations
  'gramme': WeightUnit.GRAM,
  'grammes': WeightUnit.GRAM,
  'kilogramme': WeightUnit.KILOGRAM,
  'kilogrammes': WeightUnit.KILOGRAM,
  'livre': WeightUnit.POUND,
  'livres': WeightUnit.POUND,
  'once_fr': WeightUnit.OUNCE,
  'onces': WeightUnit.OUNCE,
  'millilitre_fr': VolumeUnit.MILLILITER,
  'millilitres_fr': VolumeUnit.MILLILITER,
  'litre_fr': VolumeUnit.LITER,
  'litres_fr': VolumeUnit.LITER,
  'tasse': VolumeUnit.CUP,
  'tasses': VolumeUnit.CUP,
  'pièce': CountUnit.PIECE,
  'pièces': CountUnit.PIECE,
  'unité': CountUnit.UNIT,
  'unités': CountUnit.UNIT,
  
  // German variations
  'gramm': WeightUnit.GRAM,
  'kilogramm': WeightUnit.KILOGRAM,
  'pfund': WeightUnit.POUND,
  'unze': WeightUnit.OUNCE,
  'unzen': WeightUnit.OUNCE,
  'milliliter_de': VolumeUnit.MILLILITER,
  'liter_de': VolumeUnit.LITER,
  'tasse_de': VolumeUnit.CUP,
  'tassen': VolumeUnit.CUP,
  'stück': CountUnit.PIECE,
  'stücke': CountUnit.PIECE,
  'stuck': CountUnit.PIECE,
  'stucke': CountUnit.PIECE,
  'einheit': CountUnit.UNIT,
  'einheiten': CountUnit.UNIT,
  
  // Italian variations
  'grammo': WeightUnit.GRAM,
  'grammi': WeightUnit.GRAM,
  'chilogrammo': WeightUnit.KILOGRAM,
  'chilogrammi': WeightUnit.KILOGRAM,
  'oncia': WeightUnit.OUNCE,
  'millilitro': VolumeUnit.MILLILITER,
  'millilitri': VolumeUnit.MILLILITER,
  'litri': VolumeUnit.LITER,
  'tazza': VolumeUnit.CUP,
  'tazze': VolumeUnit.CUP,
  'pezzo': CountUnit.PIECE,
  'pezzi': CountUnit.PIECE,
  'unità': CountUnit.UNIT,
  'unita': CountUnit.UNIT
};

/**
 * Display formats for different measurement units
 * This determines how measurements are formatted in the UI
 */
export const MEASUREMENT_DISPLAY_FORMAT: Record<MeasurementUnit, string> = {
  // Weight units
  [WeightUnit.GRAM]: '{value}g',
  [WeightUnit.KILOGRAM]: '{value}kg',
  [WeightUnit.POUND]: '{value}lb',
  [WeightUnit.OUNCE]: '{value}oz',
  
  // Volume units
  [VolumeUnit.MILLILITER]: '{value}mL',
  [VolumeUnit.LITER]: '{value}L',
  [VolumeUnit.FLUID_OUNCE]: '{value}fl oz',
  [VolumeUnit.CUP]: '{value} cup',
  
  // Count units - typically not displayed as they're the default
  [CountUnit.PIECE]: '{value}',
  [CountUnit.UNIT]: '{value}'
};
