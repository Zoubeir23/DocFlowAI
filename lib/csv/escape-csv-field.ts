// Un champ commençant par l'un de ces caractères est interprété comme une
// formule par Excel/LibreOffice (injection CSV). `+` et `-` ne sont neutralisés
// que si la valeur n'est pas un simple nombre ou téléphone (ex. "+33 6...").
const ALWAYS_FORMULA_TRIGGERS = /^[=@\t\r]/;
const CONDITIONAL_FORMULA_TRIGGERS = /^[+-]/;
const SAFE_NUMERIC_VALUE = /^[+-][\d\s().\/-]*$/;

function needsFormulaGuard(value: string): boolean {
  if (ALWAYS_FORMULA_TRIGGERS.test(value)) return true;
  return CONDITIONAL_FORMULA_TRIGGERS.test(value) && !SAFE_NUMERIC_VALUE.test(value);
}

export function escapeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  let stringValue = String(value);

  if (needsFormulaGuard(stringValue)) {
    stringValue = "'" + stringValue;
  }

  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}
