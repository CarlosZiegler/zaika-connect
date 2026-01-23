import { Heading, Section, Text } from "@react-email/components";

import { EmailLayout } from "./layout-email";

type ApplicationConfirmationEmailProps = {
  candidateName: string;
  jobTitle: string;
};

export function ApplicationConfirmationEmail({
  candidateName,
  jobTitle,
}: ApplicationConfirmationEmailProps) {
  return (
    <EmailLayout preview={`Application received for ${jobTitle}`}>
      <Heading className="mb-4 font-bold text-2xl text-gray-800">
        Application Received
      </Heading>

      <Text className="text-gray-600">Hi {candidateName},</Text>

      <Text className="text-gray-600">
        Thank you for applying for the <strong>{jobTitle}</strong> position.
        We've received your application and our team will review it shortly.
      </Text>

      <Section className="my-6 rounded-lg bg-gray-50 p-4">
        <Text className="m-0 font-semibold text-gray-700">What's next?</Text>
        <Text className="mb-0 text-gray-600 text-sm">
          Our hiring team will carefully review your application. If your
          qualifications match our requirements, we'll reach out to schedule the
          next steps. This process typically takes 5-7 business days.
        </Text>
      </Section>

      <Text className="text-gray-600">
        In the meantime, if you have any questions about the position or our
        company, feel free to reply to this email.
      </Text>

      <Text className="mt-6 text-gray-600">
        Best regards,
        <br />
        The Hiring Team
      </Text>
    </EmailLayout>
  );
}

ApplicationConfirmationEmail.PreviewProps = {
  candidateName: "John Doe",
  jobTitle: "Senior Software Engineer",
} satisfies ApplicationConfirmationEmailProps;

export default ApplicationConfirmationEmail;
