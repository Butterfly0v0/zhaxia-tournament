import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const PREFIX = "enc:v1:";
const SCRYPT_SALT = "zhaxia-field-salt-v1";

function deriveKey(secret: string) {
  if (secret.length < 32) {
    throw new Error("加密密钥至少需要 32 个字符");
  }
  return scryptSync(secret, SCRYPT_SALT, 32);
}

function getKey() {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("生产环境必须配置 ENCRYPTION_KEY");
    }
    return null;
  }
  return deriveKey(secret);
}

export function isEncrypted(value: string) {
  return value.startsWith(PREFIX);
}

export function encryptFieldWithSecret(
  value: string | null | undefined,
  secret: string
): string | null {
  if (!value) return null;

  const key = deriveKey(secret);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptFieldWithSecret(
  value: string | null | undefined,
  secret: string
): string | null {
  if (!value) return null;
  if (!isEncrypted(value)) return value;

  const key = deriveKey(secret);
  const payload = value.slice(PREFIX.length);
  const [ivB64, authTagB64, dataB64] = payload.split(":");
  if (!ivB64 || !authTagB64 || !dataB64) {
    throw new Error("敏感字段密文格式无效");
  }

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const encrypted = Buffer.from(dataB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

export function encryptField(value: string | null | undefined): string | null {
  if (!value) return null;

  const key = getKey();
  if (!key) return value;

  return encryptFieldWithSecret(value, process.env.ENCRYPTION_KEY!);
}

export function decryptField(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!isEncrypted(value)) return value;

  const key = getKey();
  if (!key) {
    throw new Error("无法解密敏感字段：未配置 ENCRYPTION_KEY");
  }

  return decryptFieldWithSecret(value, process.env.ENCRYPTION_KEY!);
}

export function reencryptFieldWithSecrets(
  value: string | null | undefined,
  oldSecret: string,
  newSecret: string
): string | null {
  if (!value) return null;

  const plaintext = isEncrypted(value)
    ? decryptFieldWithSecret(value, oldSecret)
    : value;

  if (!plaintext) return null;
  return encryptFieldWithSecret(plaintext, newSecret);
}
