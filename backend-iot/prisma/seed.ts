import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const sensors = ['temperature', 'humidity', 'light', 'motion']
  const devices = ['fan', 'dehumidifier', 'living_room_light', 'alarm_siren', 'aux_led']

  for (const name of sensors) {
    await prisma.sensors.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  for (const name of devices) {
    await prisma.devices.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
