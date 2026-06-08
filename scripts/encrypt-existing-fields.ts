import { PrismaClient } from "@prisma/client";
import { encryptField, isEncrypted } from "../src/lib/field-crypto";

const prisma = new PrismaClient();

async function main() {
  if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length < 32) {
    throw new Error("请先配置至少 32 位的 ENCRYPTION_KEY");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      qq: true,
      startGgUniqueCode: true,
    },
  });

  let updated = 0;

  for (const user of users) {
    const data: {
      email?: string | null;
      qq?: string | null;
      startGgUniqueCode?: string | null;
    } = {};

    if (user.email && !isEncrypted(user.email)) {
      data.email = encryptField(user.email);
    }
    if (user.qq && !isEncrypted(user.qq)) {
      data.qq = encryptField(user.qq);
    }
    if (user.startGgUniqueCode && !isEncrypted(user.startGgUniqueCode)) {
      data.startGgUniqueCode = encryptField(user.startGgUniqueCode);
    }

    if (Object.keys(data).length > 0) {
      await prisma.user.update({ where: { id: user.id }, data });
      updated += 1;
    }
  }

  console.log(`敏感字段加密完成：共检查 ${users.length} 名用户，更新 ${updated} 名用户`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
