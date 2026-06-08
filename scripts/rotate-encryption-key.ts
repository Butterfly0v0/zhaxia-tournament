import { PrismaClient } from "@prisma/client";
import { reencryptFieldWithSecrets } from "../src/lib/field-crypto";

const prisma = new PrismaClient();

const SENSITIVE_FIELDS = ["email", "qq", "startGgUniqueCode"] as const;

async function main() {
  const oldSecret = process.env.ENCRYPTION_KEY_OLD;
  const newSecret = process.env.ENCRYPTION_KEY;

  if (!oldSecret || oldSecret.length < 32) {
    throw new Error("请设置至少 32 位的 ENCRYPTION_KEY_OLD（当前使用的旧密钥）");
  }
  if (!newSecret || newSecret.length < 32) {
    throw new Error("请设置至少 32 位的 ENCRYPTION_KEY（轮换后的新密钥）");
  }
  if (oldSecret === newSecret) {
    throw new Error("ENCRYPTION_KEY_OLD 与 ENCRYPTION_KEY 不能相同");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      qq: true,
      startGgUniqueCode: true,
    },
  });

  let updatedUsers = 0;
  let rotatedFields = 0;

  for (const user of users) {
    const data: {
      email?: string | null;
      qq?: string | null;
      startGgUniqueCode?: string | null;
    } = {};

    for (const field of SENSITIVE_FIELDS) {
      const value = user[field];
      if (!value) continue;

      try {
        const reencrypted = reencryptFieldWithSecrets(value, oldSecret, newSecret);
        if (reencrypted !== value) {
          data[field] = reencrypted;
          rotatedFields += 1;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "未知错误";
        throw new Error(`用户 ${user.id} 的 ${field} 轮换失败：${message}`);
      }
    }

    if (Object.keys(data).length > 0) {
      await prisma.user.update({ where: { id: user.id }, data });
      updatedUsers += 1;
    }
  }

  console.log(
    `密钥轮换完成：共检查 ${users.length} 名用户，更新 ${updatedUsers} 名用户，重加密 ${rotatedFields} 个字段`
  );
  console.log("请将 .env 中的 ENCRYPTION_KEY 保留为新密钥，并删除 ENCRYPTION_KEY_OLD 后重启应用。");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
