import { backend } from "@/lib/backend";
export async function PUT(
  request: Request,
  ctx: { params: Promise<{ wordId: string }> },
) {
  const { wordId } = await ctx.params;
  return backend(`/api/v1/admin/words/${wordId}`, {
    method: "PUT",
    body: await request.text(),
    headers: { "If-Match": request.headers.get("If-Match") ?? "0" },
  });
}
export async function DELETE(
  _: Request,
  ctx: { params: Promise<{ wordId: string }> },
) {
  const { wordId } = await ctx.params;
  return backend(`/api/v1/admin/words/${wordId}`, { method: "DELETE" });
}
