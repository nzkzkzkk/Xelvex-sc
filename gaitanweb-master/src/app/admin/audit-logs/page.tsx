import { ShieldCheck } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FilterSelect } from "@/components/admin/FilterControls";
import { Table, THead, Th, TBody, Tr, Td } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTH } from "@/lib/utils";
import { getAdminAuditLogs, getAuditEntities } from "@/lib/admin-queries";

function prettyMetadata(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; entity?: string }>;
}) {
  const { q, page, entity } = await searchParams;
  const [entities, { rows: logs, totalPages, page: currentPage, total }] = await Promise.all([
    getAuditEntities(),
    getAdminAuditLogs({ q, page: page ? Number(page) : 1, entity }),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="ประวัติการทำรายการ"
        description={`ทุกการแก้ไขโดยแอดมิน ${total} รายการ — รวมถึงการเปิดดูโค้ด`}
        searchPlaceholder="ค้นหา action / ID / ผู้ทำรายการ..."
        searchDefault={q}
        hiddenParams={{ entity }}
        filters={<FilterSelect name="entity" value={entity} allLabel="ทุกประเภท" options={entities.map((e) => ({ value: e, label: e }))} />}
      />

      {logs.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="ไม่พบประวัติการทำรายการ"
          description={q || entity ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง" : "เมื่อแอดมินแก้ไขสินค้า สต๊อก หรือคำสั่งซื้อ ประวัติจะแสดงที่นี่"}
        />
      ) : (
        <>
          <Table>
            <THead>
              <Th>เวลา</Th>
              <Th>ผู้ทำรายการ</Th>
              <Th>Action</Th>
              <Th>เป้าหมาย</Th>
              <Th>รายละเอียด</Th>
            </THead>
            <TBody>
              {logs.map((log) => {
                const meta = prettyMetadata(log.metadata);
                return (
                  <Tr key={log.id}>
                    <Td label="เวลา" className="whitespace-nowrap text-muted">{formatDateTH(log.createdAt)}</Td>
                    <Td primary>
                      <p className="font-medium">{log.actor}</p>
                      <p className="text-xs text-muted-2">{log.actorEmail}</p>
                    </Td>
                    <Td label="Action">
                      <code className="text-xs text-primary-soft">{log.action}</code>
                    </Td>
                    <Td label="เป้าหมาย">
                      <p className="text-muted">{log.entity}</p>
                      <code className="text-[10px] text-muted-2">{log.entityId}</code>
                    </Td>
                    <Td label="รายละเอียด">
                      {meta ? (
                        <details className="group">
                          <summary className="cursor-pointer text-xs text-muted hover:text-foreground">ดูข้อมูล</summary>
                          <pre className="mt-2 max-w-md overflow-x-auto rounded-md bg-surface-2 p-2 text-[11px] leading-relaxed text-muted">{meta}</pre>
                        </details>
                      ) : (
                        <span className="text-xs text-muted-2">—</span>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>

          <Pagination page={currentPage} totalPages={totalPages} basePath="/admin/audit-logs" query={{ q, entity }} />
        </>
      )}
    </div>
  );
}
