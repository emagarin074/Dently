import { verifyPasswordResetToken } from "@/app/actions/password-reset";
import { ResetPasswordClient } from "./reset-password-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <ResetPasswordClient
        token=""
        isValid={false}
        errorMessage="No reset token was provided. Please use the link sent to your email."
      />
    );
  }

  const verification = await verifyPasswordResetToken(token);

  return (
    <ResetPasswordClient
      token={token}
      isValid={verification.valid}
      errorMessage={verification.error}
      email={verification.email}
    />
  );
}
