import { decryptField, encryptField } from "@/lib/field-crypto";

export type SensitiveUserFields = {
  email?: string | null;
  qq?: string | null;
  startGgUniqueCode?: string | null;
};

export function encryptSensitiveUserFields<T extends SensitiveUserFields>(user: T): T {
  return {
    ...user,
    email: encryptField(user.email),
    qq: encryptField(user.qq),
    startGgUniqueCode: encryptField(user.startGgUniqueCode),
  };
}

export function decryptSensitiveUserFields<T extends SensitiveUserFields>(user: T): T {
  return {
    ...user,
    email: decryptField(user.email),
    qq: decryptField(user.qq),
    startGgUniqueCode: decryptField(user.startGgUniqueCode),
  };
}
