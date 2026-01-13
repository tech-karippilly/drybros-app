// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.driver.deleteMany();
  await prisma.franchise.deleteMany();

  const franchises = await prisma.franchise.createMany({
    data: [
      {
        code: "CLT_MAIN",
        name: "Calicut Main",
        city: "Calicut",
        address: "Some address here",
        phone: "9999999999",
      },
      {
        code: "EKM_MAIN",
        name: "Ernakulam Main",
        city: "Ernakulam",
        address: "Some address here",
        phone: "8888888888",
      },
    ],
  });

  // Fetch created franchises with IDs
  const clt = await prisma.franchise.findUnique({
    where: { code: "CLT_MAIN" },
  });
  const ekm = await prisma.franchise.findUnique({
    where: { code: "EKM_MAIN" },
  });

  await prisma.driver.createMany({
    data: [
      {
        fullName: "Ramesh K",
        phone: "9000000001",
        franchiseId: clt.id,
      },
      {
        fullName: "Suresh P",
        phone: "9000000002",
        franchiseId: clt.id,
      },
      {
        fullName: "Ajay M",
        phone: "9000000003",
        franchiseId: ekm.id,
      },
    ],
  });

  console.log("Seed completed");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
