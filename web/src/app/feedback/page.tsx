import{auth,signIn}from"@/auth";import FeedbackForm from"./feedback-form";
export const dynamic="force-dynamic";
export default async function FeedbackPage(){const session=await auth();if(!session)return <main className="signin"><h1>Sign in to send feedback.</h1><form action={async()=>{"use server";await signIn("keycloak",{redirectTo:"/feedback"})}}><button className="primary">Sign in</button></form></main>;return <FeedbackForm/>}
