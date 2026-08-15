import { auth, signIn } from "@/auth";
import PlayClient from "./play-client";
import "./play.css";
export const dynamic = "force-dynamic";
export default async function PlayPage(){const session=await auth();if(!session)return <main className="signin"><a className="brand" href="/">Wörter<span>See</span></a><section><p className="eyebrow">YOUR PROGRESS, IN SYNC</p><h1>Sign in to start learning.</h1><p>Your games and difficult words will follow you across devices.</p><form action={async()=>{"use server";await signIn("keycloak",{redirectTo:"/play"});}}><button className="primary">Sign in with WörterSee</button></form><small>Local demo: demo / local-demo-only</small></section></main>;return <PlayClient userName={session.user?.name??"Learner"}/>}
