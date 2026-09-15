import { z } from "zod";

export const registerSchema = z.object({
  displayName: z.string().trim().min(2, "กรุณากรอกชื่อที่ใช้แสดง").max(60),
  email: z.string().trim().toLowerCase().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านอย่างน้อย 6 ตัวอักษร").max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1, "ตะกร้าว่างเปล่า")
    .max(20),
  paymentMethod: z.enum(["truemoney", "promptpay", "card"]),
});

export const paymentWebhookSchema = z.object({
  orderNumber: z.string().min(1),
  transactionId: z.string().min(1),
  provider: z.string().min(1),
  amount: z.number().int().positive(),
  status: z.enum(["SUCCESS", "FAILED"]),
});

// ---------------------------------------------------------------
// Admin mutations
// ---------------------------------------------------------------

// Either a path in /public ("/products/x.jpg") or an absolute http(s) URL.
const imageRef = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//i.test(v), "รูปภาพต้องเป็น URL (https://...) หรือ path ที่ขึ้นต้นด้วย /")
  .optional()
  .or(z.literal(""));

const idList = z.array(z.string().min(1)).min(1, "กรุณาเลือกอย่างน้อย 1 รายการ").max(200);

export const createProductSchema = z.object({
  gameId: z.string().min(1, "กรุณาเลือกเกม"),
  title: z.string().trim().min(2, "กรุณากรอกชื่อสินค้า").max(120),
  subtitle: z.string().trim().max(60).optional().or(z.literal("")),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  price: z.number().int().min(1, "ราคาต้องมากกว่า 0").max(1_000_000),
  image: imageRef,
  sortOrder: z.number().int().min(0).max(9999).optional(),
  autoDelivery: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const bulkProductSchema = z.object({
  ids: idList,
  isActive: z.boolean(),
});

export const bulkStockSchema = z.object({
  ids: idList,
  status: z.enum(["AVAILABLE", "DISABLED"]),
});

export const orderActionSchema = z.object({
  action: z.enum(["cancel", "mark_paid", "retry_delivery", "refund"]),
});

export const updateUserSchema = z
  .object({
    isActive: z.boolean().optional(),
    role: z.enum(["CUSTOMER", "ADMIN"]).optional(),
  })
  .refine((v) => v.isActive !== undefined || v.role !== undefined, "ไม่มีข้อมูลให้แก้ไข");

export const addStockSchema = z.object({
  productId: z.string().min(1),
  // One code per line, blank lines ignored.
  codes: z
    .string()
    .transform((raw) =>
      raw
        .split("\n")
        .map((c) => c.trim())
        .filter(Boolean)
    )
    .refine((codes) => codes.length > 0, "กรุณากรอกอย่างน้อย 1 โค้ด")
    .refine((codes) => codes.length <= 500, "เพิ่มได้ครั้งละไม่เกิน 500 โค้ด"),
});

export const createGameSchema = z.object({
  name: z.string().trim().min(2, "กรุณากรอกชื่อเกม").max(60),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "กรุณากรอก slug")
    .max(60)
    .regex(/^[a-z0-9-]+$/, "slug ใช้ได้เฉพาะตัวพิมพ์เล็ก ตัวเลข และขีดกลาง"),
  coverImage: imageRef,
});

export const updateGameSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  coverImage: imageRef,
  isActive: z.boolean().optional(),
});

export const updateSettingsSchema = z.object({
  storeName: z.string().trim().min(1).max(80),
  supportEmail: z.string().trim().email("อีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  discordUrl: z.string().trim().url("URL ไม่ถูกต้อง").optional().or(z.literal("")),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().toLowerCase().email("อีเมลไม่ถูกต้อง"),
});

export const confirmPasswordResetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "รหัสผ่านอย่างน้อย 6 ตัวอักษร").max(72),
});
