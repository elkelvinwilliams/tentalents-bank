import { isAdmin, adminSignIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function signIn(formData: FormData) {
  "use server";
  const ok = await adminSignIn(String(formData.get("password") ?? ""));
  redirect(ok ? "/admin" : "/admin?bad=1");
}

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ bad?: string }> }) {
  const { bad } = await searchParams;
  if (!(await isAdmin())) {
    return (
      <div className="adminshell" style={{ maxWidth: 420 }}>
        <h1>Admin</h1>
        <p className="sub">Ten Talents Academy · content &amp; members</p>
        <form action={signIn} style={{ marginTop: 22 }}>
          <label className="flabel" htmlFor="pw">Admin password</label>
          <input id="pw" name="password" type="password" className="afield" autoFocus required />
          {bad && <div className="err" style={{ marginBottom: 14 }}>Wrong password.</div>}
          <button className="abtn" type="submit">Sign in</button>
        </form>
      </div>
    );
  }
  return (
    <div className="adminshell">
      <h1>Academy admin</h1>
      <p className="sub">Everything the app serves is edited here. Publish/unpublish controls what learners see.</p>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", marginTop: 24 }}>
        <Link className="card press" style={{ margin: 0, textDecoration: "none" }} href="/admin/content"><h3>Tracks &amp; lessons</h3><p>Create, edit, reorder, publish. Quiz builder per module.</p></Link>
        <Link className="card press" style={{ margin: 0, textDecoration: "none" }} href="/admin/glossary"><h3>Glossary</h3><p>Terms and definitions.</p></Link>
        <Link className="card press" style={{ margin: 0, textDecoration: "none" }} href="/admin/members"><h3>Members</h3><p>Accounts, plan status, progress.</p></Link>
      </div>
    </div>
  );
}
