import { SignIn } from "@clerk/nextjs";
export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-blue-950">
      <SignIn />
    </div>
  );
}