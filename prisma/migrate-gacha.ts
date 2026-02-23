import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('--- Starting Gacha Migration ---')

  // 1. Create a default Category
  const category = await prisma.gachaCategory.create({
    data: {
      name: 'กาชาปองทั้งหมด',
      sortOrder: 1,
      isActive: true,
    }
  })
  console.log('Created Default Category:', category.id)

  // 2. Fetch old global settings to carry over the price
  const oldSettings = await prisma.gachaSettings.findFirst()
  const costType = oldSettings ? oldSettings.costType : 'CREDIT'
  const costAmount = oldSettings ? oldSettings.costAmount : 10

  // 3. Create a default Machine
  const machine = await prisma.gachaMachine.create({
    data: {
      name: 'ตู้สุ่มหลัก (Migrated)',
      categoryId: category.id,
      imageUrl: 'https://placehold.co/400x400/png?text=Main+Gacha',
      costType: costType,
      costAmount: costAmount,
      sortOrder: 1,
      isActive: true,
    }
  })
  console.log('Created Default Machine:', machine.id)

  // 4. Update all existing rewards to belong to this new machine
  // Since we haven't db pushed the new schema yet, Prisma Client doesn't know about gachaMachineId.
  // We must execute a raw SQL query.
  
  await prisma.$executeRaw`
    UPDATE GachaReward 
    SET gachaMachineId = ${machine.id}
  `
  console.log('Updated all existing rewards to belong to the new machine.')

  // Note: For GachaRollLog, since gachaMachineId is marked as optional (?) in schema.prisma, 
  // it won't crash DB push. We can leave old logs as having null machine IDs, or update them too.
  await prisma.$executeRaw`
    UPDATE GachaRollLog
    SET gachaMachineId = ${machine.id}
  `
  console.log('Updated all existing roll logs to belong to the new machine (optional).')

  console.log('--- Migration Completed Successfully ---')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
