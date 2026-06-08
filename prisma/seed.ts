import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash,
      nickname: "管理员",
      role: "ADMIN",
    },
  });

  const games = [
    { name: "街霸6", slug: "street-fighter-6", description: "Street Fighter 6" },
    { name: "拳皇15", slug: "kof-xv", description: "THE KING OF FIGHTERS XV" },
    { name: "罪恶装备", slug: "guilty-gear-strive", description: "GUILTY GEAR -STRIVE-" },
  ];

  for (const game of games) {
    await prisma.game.upsert({
      where: { slug: game.slug },
      update: {},
      create: game,
    });
  }

  const tiers = [
    { name: "S级赛事", code: "S", description: "最高等级赛事", sortOrder: 1 },
    { name: "A级赛事", code: "A", description: "高级赛事", sortOrder: 2 },
    { name: "B级赛事", code: "B", description: "中级赛事", sortOrder: 3 },
    { name: "C级赛事", code: "C", description: "入门级赛事", sortOrder: 4 },
  ];

  const pointTables: Record<string, number[]> = {
    S: [100, 70, 50, 35, 25, 20, 15, 10],
    A: [60, 40, 28, 20, 14, 10, 7, 5],
    B: [30, 20, 14, 10, 7, 5, 3, 2],
    C: [15, 10, 7, 5, 3, 2, 1, 1],
  };

  for (const tier of tiers) {
    const created = await prisma.eventTier.upsert({
      where: { code: tier.code },
      update: {},
      create: tier,
    });

    const points = pointTables[tier.code] ?? [];
    for (let i = 0; i < points.length; i++) {
      await prisma.pointRule.upsert({
        where: {
          tierId_placement: {
            tierId: created.id,
            placement: i + 1,
          },
        },
        update: { points: points[i] },
        create: {
          tierId: created.id,
          placement: i + 1,
          points: points[i],
        },
      });
    }
  }

  console.log("Seed completed: admin/admin123, games, tiers, point rules");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
