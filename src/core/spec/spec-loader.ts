/**
 * Spec-Driven Declarative Engine: SpecLoader
 * Carga, parseo y validación de archivos YAML y JSON de especificación SaaS.
 */

import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { SaaSSpecSchema, ValidatedSaaSSpec, validateSemanticIntegrity } from './spec-validator.js';

export interface SpecLoadResult {
  success: boolean;
  spec?: ValidatedSaaSSpec;
  errors?: string[];
  warnings?: string[];
}

export class SpecLoader {
  /**
   * Parsea y valida una especificación desde una cadena de texto (YAML o JSON).
   */
  public static loadFromString(
    content: string,
    format: 'yaml' | 'json' = 'yaml',
    knownSkills?: Set<string> | string[]
  ): SpecLoadResult {
    let parsedRaw: unknown;

    try {
      if (format === 'json') {
        parsedRaw = JSON.parse(content);
      } else {
        parsedRaw = parseYaml(content);
      }
    } catch (parseError: any) {
      return {
        success: false,
        errors: [`Error sintáctico al parsear ${format.toUpperCase()}: ${parseError.message}`],
      };
    }

    // 1. Validación estructural estricta con Zod
    const zodResult = SaaSSpecSchema.safeParse(parsedRaw);
    if (!zodResult.success) {
      const formattedErrors = zodResult.error.errors.map((err) => {
        const path = err.path.length > 0 ? err.path.join('.') : 'root';
        return `[${path}]: ${err.message}`;
      });

      return {
        success: false,
        errors: formattedErrors,
      };
    }

    const validatedSpec = zodResult.data;

    // 2. Verificación de integridad semántica cruzada
    const semanticCheck = validateSemanticIntegrity(validatedSpec, knownSkills);
    if (!semanticCheck.valid) {
      return {
        success: false,
        errors: semanticCheck.errors,
        warnings: semanticCheck.warnings,
      };
    }

    // Congelar objeto para garantizar inmutabilidad
    Object.freeze(validatedSpec);

    return {
      success: true,
      spec: validatedSpec,
      warnings: semanticCheck.warnings,
    };
  }

  /**
   * Carga y valida una especificación directamente desde una ruta de archivo.
   */
  public static async loadFromFile(
    filePath: string,
    knownSkills?: Set<string> | string[]
  ): Promise<SpecLoadResult> {
    try {
      const fileContent = await readFile(filePath, 'utf-8');
      const ext = extname(filePath).toLowerCase();
      const format = ext === '.json' ? 'json' : 'yaml';

      return this.loadFromString(fileContent, format, knownSkills);
    } catch (fileError: any) {
      return {
        success: false,
        errors: [`Error al leer el archivo '${filePath}': ${fileError.message}`],
      };
    }
  }
}
