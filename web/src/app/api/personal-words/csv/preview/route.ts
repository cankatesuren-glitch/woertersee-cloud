import{backend}from"@/lib/backend";
export async function POST(request:Request){return backend("/api/v1/personal-words/csv/preview",{method:"POST",body:await request.text(),headers:{"Content-Type":"text/csv"}})}
