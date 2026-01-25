import type { SentMessageInfo } from "nodemailer";
import type { ReactElement, ReactNode } from "react";

import { render } from "@react-email/render";
import nodemailer from "nodemailer";

import { APP_CONFIG } from "@/lib/config/app.config";
import { env } from "@/lib/env.server";

type EmailPayload = {
  to: string | string[];
  subject: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
};

type EmailProps = {
  payload: EmailPayload;
  template: ReactElement | ReactNode;
};

const DEFAULT_FROM = `${APP_CONFIG.name} <noreply@example.com>`;

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const sendEmail = async ({
  payload,
  template,
}: EmailProps): Promise<SentMessageInfo> => {
  const html = await render(template);
  const text = await render(template, { plainText: true });

  return transporter.sendMail({
    from: env.SMTP_FROM ?? payload.from ?? DEFAULT_FROM,
    to: payload.to,
    subject: payload.subject,
    cc: payload.cc,
    bcc: payload.bcc,
    replyTo: payload.replyTo,
    html,
    text,
  });
};
