// src/utils/BilingualTextProcessor.ts
// Utilidad para procesar textos bilingües del servidor

import { Language } from '../i18n';

export class BilingualTextProcessor {
  /**
   * Procesa un texto bilingüe del servidor y devuelve el texto en el idioma especificado
   * Formato esperado: "Texto en español:English text"
   * Si no tiene ":", devuelve el texto tal como está
   * 
   * @param bilingualText - Texto en formato "español:english" o texto normal
   * @param language - Idioma deseado ('es' | 'en')
   * @returns Texto en el idioma especificado o texto original si no es bilingüe
   */
  static extractText(bilingualText: string, language: Language): string {
    if (!bilingualText || typeof bilingualText !== 'string') {
      return bilingualText || '';
    }

    // Si no contiene el separador ":", devolver el texto tal como está
    if (!bilingualText.includes(':')) {
      return bilingualText;
    }

    // Dividir por el separador ':'
    const parts = bilingualText.split(':');
    
    if (parts.length < 2) {
      // Si no hay suficientes partes, devolver el texto original
      return bilingualText;
    }

    const spanishText = parts[0]?.trim() || '';
    const englishText = parts[1]?.trim() || '';

    // Seleccionar según el idioma
    switch (language) {
      case 'es':
        return spanishText || englishText; // Fallback a inglés si español está vacío
      case 'en':
        return englishText || spanishText; // Fallback a español si inglés está vacío
      default:
        return spanishText || bilingualText; // Por defecto español
    }
  }

  /**
   * Procesa múltiples textos bilingües en un objeto
   * 
   * @param obj - Objeto con propiedades que pueden contener textos bilingües
   * @param language - Idioma deseado
   * @param textFields - Array de nombres de campos que contienen texto bilingüe
   * @returns Objeto con textos procesados
   */
  static processObject<T extends Record<string, any>>(
    obj: T, 
    language: Language, 
    textFields: (keyof T)[]
  ): T {
    const processed = { ...obj };
    
    textFields.forEach(field => {
      if (processed[field] && typeof processed[field] === 'string') {
        processed[field] = this.extractText(processed[field] as string, language);
      }
    });

    return processed;
  }

  /**
   * Procesa un array de objetos con textos bilingües
   * 
   * @param array - Array de objetos
   * @param language - Idioma deseado
   * @param textFields - Campos que contienen texto bilingüe
   * @returns Array con textos procesados
   */
  static processArray<T extends Record<string, any>>(
    array: T[], 
    language: Language, 
    textFields: (keyof T)[]
  ): T[] {
    return array.map(item => this.processObject(item, language, textFields));
  }

  /**
   * Verifica si un texto tiene formato bilingüe
   * 
   * @param text - Texto a verificar
   * @returns true si tiene formato bilingüe
   */
  static isBilingualText(text: string): boolean {
    return typeof text === 'string' && text.includes(':') && text.split(':').length >= 2;
  }

  /**
   * Obtiene ambos idiomas de un texto bilingüe
   * 
   * @param bilingualText - Texto bilingüe
   * @returns Objeto con ambos idiomas
   */
  static getBothLanguages(bilingualText: string): { spanish: string; english: string } {
    if (!this.isBilingualText(bilingualText)) {
      return { spanish: bilingualText, english: bilingualText };
    }

    const parts = bilingualText.split(':');
    return {
      spanish: parts[0]?.trim() || '',
      english: parts[1]?.trim() || ''
    };
  }
}

export default BilingualTextProcessor;