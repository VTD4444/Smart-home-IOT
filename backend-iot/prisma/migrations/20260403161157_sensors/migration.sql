-- CreateTable
CREATE TABLE "sensors" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_sensors" (
    "id" SERIAL NOT NULL,
    "sensor_id" INTEGER NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_sensors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_histories" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER NOT NULL,
    "action" VARCHAR(255) NOT NULL,
    "status" VARCHAR(255) NOT NULL,
    "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sensors_name_key" ON "sensors"("name");

-- CreateIndex
CREATE INDEX "data_sensors_sensor_id_create_at_idx" ON "data_sensors"("sensor_id", "create_at");

-- CreateIndex
CREATE UNIQUE INDEX "devices_name_key" ON "devices"("name");

-- CreateIndex
CREATE INDEX "action_histories_device_id_create_at_idx" ON "action_histories"("device_id", "create_at");

-- CreateIndex
CREATE INDEX "action_histories_status_create_at_idx" ON "action_histories"("status", "create_at");

-- AddForeignKey
ALTER TABLE "data_sensors" ADD CONSTRAINT "data_sensors_sensor_id_fkey" FOREIGN KEY ("sensor_id") REFERENCES "sensors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_histories" ADD CONSTRAINT "action_histories_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
