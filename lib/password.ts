export const MAX_PASSWORD_LENGTH = 100;

export function isValidPasswordLength(password: unknown) {
  return typeof password === "string" && password.length >= 8 && password.length <= MAX_PASSWORD_LENGTH;
}
