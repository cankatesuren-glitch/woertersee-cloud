import { backend } from "@/lib/backend";
export async function PUT(
  request: Request,
  ctx: { params: Promise<{ categoryId: string }> },
) {
  const { categoryId } = await ctx.params;
  return backend(`/api/v1/admin/categories/${categoryId}`, {
    method: "PUT",
    body: await request.text(),
  });
}
export async function DELETE(
  _: Request,
  ctx: { params: Promise<{ categoryId: string }> },
) {
  const { categoryId } = await ctx.params;
  return backend(`/api/v1/admin/categories/${categoryId}`, {
    method: "DELETE",
  });
}
