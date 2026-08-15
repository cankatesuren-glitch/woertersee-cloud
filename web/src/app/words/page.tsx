import{auth,signIn}from"@/auth";import WordsClient from"./words-client";import"./words.css";
export const dynamic="force-dynamic";
export default async function WordsPage(){const session=await auth();if(!session)return <main className="words-signin"><h1>Sign in to manage your words.</h1><form action={async()=>{"use server";await signIn("keycloak",{redirectTo:"/words"})}}><button className="primary">Sign in</button></form></main>;return <WordsClient/>}
