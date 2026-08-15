import{backend}from"@/lib/backend";
export async function POST(request:Request){return backend("/api/v1/feedback",{method:"POST",body:await request.text()})}
