import type { ReactElement, ReactNode } from "react";

import { sendEmail } from "@/lib/mail";

type SendEmailSafelyParams = {
  to: string;
  subject: string;
  template: ReactElement | ReactNode;
  from?: string;
  errorContext?: string;
};

async function sendEmailSafely({
  to,
  subject,
  template,
  from = "noreply@example.com",
  errorContext = "email",
}: SendEmailSafelyParams): Promise<boolean> {
  try {
    await sendEmail({
      payload: {
        subject,
        to,
        from,
      },
      template,
    });
    return true;
  } catch (error) {
    console.error(`Error sending ${errorContext}:`, error);
    return false;
  }
}

export { sendEmailSafely };
export type { SendEmailSafelyParams };
