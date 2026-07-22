import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { ConfiguratorFlow } from "@/components/configurator/configurator-flow";
import { getAnswers, getLatestSession } from "@/lib/db/configurator";
import { getNicheForStudent } from "@/lib/db/niches";
import { getStudentByClerkId } from "@/lib/db/students";
import type {
  ConfiguratorAnswers,
  ConfiguratorNicheContent,
} from "@/lib/configurator-types";

export default async function ConfiguratorPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const student = await getStudentByClerkId(user.id);
  if (!student) redirect("/sign-in");

  const [session, niche] = await Promise.all([
    getLatestSession(student.id),
    getNicheForStudent(student.id),
  ]);
  const answers = session
    ? ((await getAnswers(session.id)) as ConfiguratorAnswers)
    : {};

  const nicheContent: ConfiguratorNicheContent = {
    targetExamples: niche.vocabulary.target_examples ?? [],
    palettes: niche.default_palette ?? [],
    avatarStyles: niche.vocabulary.avatar_styles ?? [],
    bannerStyles: niche.vocabulary.banner_styles ?? [],
  };

  return (
    <ConfiguratorFlow
      initialAnswers={answers}
      initialStep={session?.current_step ?? "target"}
      initialCompleted={session?.status === "completed"}
      niche={nicheContent}
    />
  );
}
