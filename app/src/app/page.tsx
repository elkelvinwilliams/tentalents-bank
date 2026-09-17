import { currentUser } from "@/lib/auth";
import { loadContent, loadUserState } from "@/lib/app-data";
import AcademyApp from "@/components/AcademyApp";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await currentUser();
  const content = await loadContent();
  if (!user) {
    return <AcademyApp content={content} state={null} />;
  }
  const state = await loadUserState(user);
  return <AcademyApp content={content} state={state} />;
}
