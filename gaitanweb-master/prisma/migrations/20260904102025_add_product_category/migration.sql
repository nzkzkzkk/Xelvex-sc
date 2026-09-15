-- AlterTable
ALTER TABLE "products" ADD COLUMN     "category" TEXT;

-- AlterTable
ALTER TABLE "store_settings" ALTER COLUMN "storeName" SET DEFAULT 'Xelvex';
