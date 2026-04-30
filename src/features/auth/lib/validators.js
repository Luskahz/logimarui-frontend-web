function isBlank(value) {
  return String(value ?? "").trim() === "";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
}

function isPositiveInteger(value) {
  return /^[1-9]\d*$/.test(String(value ?? "").trim());
}

export function validateAuthForm(fields, values) {
  const errors = {};

  for (const field of fields) {
    const value = values[field.name];
    const rules = field.validation || {};

    if (field.required && isBlank(value)) {
      errors[field.name] = "Preencha este campo para continuar.";
      continue;
    }

    if (isBlank(value)) {
      continue;
    }

    if (rules.isEmail && !isValidEmail(value)) {
      errors[field.name] = "Informe um e-mail valido.";
      continue;
    }

    if (rules.isPositiveInteger && !isPositiveInteger(value)) {
      errors[field.name] = "Informe uma matricula numerica valida.";
      continue;
    }

    if (rules.minLength && String(value).trim().length < rules.minLength) {
      errors[field.name] = `Use pelo menos ${rules.minLength} caracteres.`;
      continue;
    }

    if (rules.matchesField && value !== values[rules.matchesField]) {
      errors[field.name] = "Os valores informados nao coincidem.";
    }
  }

  return errors;
}
