export function onlyDigits(value) {
  return String(value ?? "").replace(/\D+/g, "");
}

export function formatCpf(value) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
    6,
    9,
  )}-${digits.slice(9)}`;
}

export function isValidCpf(value) {
  const digits = onlyDigits(value);

  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  let sum = 0;

  for (let index = 0; index < 9; index += 1) {
    sum += Number(digits[index]) * (10 - index);
  }

  let firstVerifier = (sum * 10) % 11;

  if (firstVerifier === 10) {
    firstVerifier = 0;
  }

  if (firstVerifier !== Number(digits[9])) {
    return false;
  }

  sum = 0;

  for (let index = 0; index < 10; index += 1) {
    sum += Number(digits[index]) * (11 - index);
  }

  let secondVerifier = (sum * 10) % 11;

  if (secondVerifier === 10) {
    secondVerifier = 0;
  }

  return secondVerifier === Number(digits[10]);
}
