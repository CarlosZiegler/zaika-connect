import { ApplicationConfirmationEmail } from "@/components/emails/application-confirmation-email";
import { APP_CONFIG } from "@/lib/config/app.config";
import { sendEmail } from "@/lib/resend";

type SendApplicationConfirmationParams = {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
};

const DEFAULT_FROM = `${APP_CONFIG.name} <noreply@example.com>`;

export async function sendApplicationConfirmation({
  candidateEmail,
  candidateName,
  jobTitle,
}: SendApplicationConfirmationParams): Promise<boolean> {
  try {
    await sendEmail({
      payload: {
        from: DEFAULT_FROM,
        to: candidateEmail,
        subject: `Application Received - ${jobTitle}`,
        text: `Thank you for applying for the ${jobTitle} position. We've received your application and will review it shortly.`,
      },
      template: ApplicationConfirmationEmail({ candidateName, jobTitle }),
    });
    return true;
  } catch (error) {
    console.error("Failed to send application confirmation email:", error);
    return false;
  }
}
