import { SignIn } from "@/features/auth/sign-in";
import { PageFadeIn } from "@/components/page-fade-in";

export default function SignInPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <PageFadeIn>
        <SignIn />
      </PageFadeIn>
    </main>
  );
}
