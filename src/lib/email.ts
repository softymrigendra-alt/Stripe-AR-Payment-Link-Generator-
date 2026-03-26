import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import { formatAmount } from './validations';
import { InvoiceAttachment } from '@/types';

export async function sendPaymentLinkEmail(params: {
  customerName: string;
  customerEmail: string;
  description: string;
  amount: number;
  currency: string;
  paymentLink: string;
  expiresAt: Date;
  arCcEmail: string;
  companyName: string;
  invoiceAttachment?: InvoiceAttachment;
}): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const formattedAmount = formatAmount(params.amount, params.currency);
  const expiryFormatted = format(params.expiresAt, "EEE d MMM yyyy, h:mm a 'UTC'");
  const subject = `Payment Request – ${params.description} – ${formattedAmount}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: Arial, sans-serif; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #635bff 0%, #4f46e5 100%); padding: 32px 32px 24px;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">
        Payment Request
      </h1>
      <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px;">
        Secure payment powered by Stripe
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 32px;">
      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6;">
        Dear <strong>${params.customerName}</strong>,
      </p>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #555555;">
        Please find your payment link below. Click the button to complete your payment securely.
      </p>

      <!-- Details Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
        <tr>
          <td style="padding: 13px 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; width: 40%;">
            Invoice / Reference
          </td>
          <td style="padding: 13px 16px; background: #ffffff; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #111827;">
            ${params.description}
          </td>
        </tr>
        <tr>
          <td style="padding: 13px 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280;">
            Amount Due
          </td>
          <td style="padding: 13px 16px; background: #ffffff; border-bottom: 1px solid #e5e7eb; font-size: 20px; font-weight: 700; color: #111827;">
            ${formattedAmount}
          </td>
        </tr>
        <tr>
          <td style="padding: 13px 16px; background: #f9fafb; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280;">
            Link Expires
          </td>
          <td style="padding: 13px 16px; background: #ffffff; font-size: 14px; color: #dc2626; font-weight: 500;">
            ${expiryFormatted}
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${params.paymentLink}"
           style="display: inline-block; background: #635bff; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 700; letter-spacing: 0.2px;">
          Pay Now &rarr;
        </a>
      </div>

      <!-- Direct Link Fallback -->
      <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-bottom: 24px;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${params.paymentLink}" style="color: #635bff; word-break: break-all;">${params.paymentLink}</a>
      </p>

      <!-- Notice -->
      <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
          <strong>Important:</strong> This is a <strong>single-use link</strong>. It will expire after one successful payment or at the time shown above, whichever comes first. Do not share this link.
        </p>
      </div>

      <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you have any questions about this payment request, please contact our Accounts Receivable team by replying to this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 32px; text-align: center;">
      <p style="margin: 0; font-size: 13px; color: #6b7280;">
        Best regards,<br>
        <strong style="color: #374151;">${params.companyName} — Accounts Receivable Team</strong>
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `
Dear ${params.customerName},

You have a payment request from ${params.companyName}.

  Invoice / Reference : ${params.description}
  Amount Due          : ${formattedAmount}
  Link Expires        : ${expiryFormatted}

Click the link below to complete your payment securely:
  ${params.paymentLink}

IMPORTANT: This is a single-use link. It will expire after one successful payment or at the time indicated above, whichever comes first. Do not share this link.

If you have any questions, please contact our Accounts Receivable team.

Best regards,
${params.companyName} — Accounts Receivable Team
`.trim();

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"${params.companyName} AR" <${process.env.SMTP_FROM}>`,
    to: params.customerEmail,
    subject,
    text,
    html,
    ...(params.invoiceAttachment ? {
      attachments: [{
        filename: params.invoiceAttachment.name,
        content: Buffer.from(params.invoiceAttachment.data, 'base64'),
        contentType: params.invoiceAttachment.type,
      }]
    } : {}),
  };

  if (params.arCcEmail) {
    mailOptions.cc = params.arCcEmail;
  }

  await transporter.sendMail(mailOptions);
}

export async function sendPaymentFailedEmail(params: {
  customerName: string;
  customerEmail: string;
  description: string;
  amount: number;
  currency: string;
  failureReason: string;
  retryLink: string;
  attemptsLeft: number;
  companyName: string;
  arCcEmail: string;
}): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const formattedAmount = formatAmount(params.amount, params.currency);
  const subject = `Payment Failed – ${params.description} – ${formattedAmount}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: Arial, sans-serif; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 32px 32px 24px;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">
        ✗ Payment Failed
      </h1>
      <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px;">
        Your payment could not be processed.
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 32px;">
      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6;">
        Dear <strong>${params.customerName}</strong>,
      </p>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #555555;">
        Unfortunately, your payment could not be completed. Please review the details below and try again.
      </p>

      <!-- Details Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
        <tr>
          <td style="padding: 13px 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; width: 40%;">
            Invoice / Reference
          </td>
          <td style="padding: 13px 16px; background: #ffffff; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #111827;">
            ${params.description}
          </td>
        </tr>
        <tr>
          <td style="padding: 13px 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280;">
            Amount
          </td>
          <td style="padding: 13px 16px; background: #ffffff; border-bottom: 1px solid #e5e7eb; font-size: 20px; font-weight: 700; color: #111827;">
            ${formattedAmount}
          </td>
        </tr>
        <tr>
          <td style="padding: 13px 16px; background: #f9fafb; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280;">
            Failure Reason
          </td>
          <td style="padding: 13px 16px; background: #fff5f5; font-size: 14px; color: #dc2626; font-weight: 500;">
            ${params.failureReason}
          </td>
        </tr>
      </table>

      <!-- Attempts Warning -->
      ${params.attemptsLeft > 0 ? `
      <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 13px; color: #92400e;">
          <strong>Attempts remaining:</strong> ${params.attemptsLeft} of 3
        </p>
      </div>` : `
      <div style="background: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 13px; color: #991b1b;">
          <strong>No attempts remaining.</strong> This payment link has been deactivated. Please contact our Accounts Receivable team.
        </p>
      </div>`}

      ${params.attemptsLeft > 0 ? `
      <!-- Retry Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${params.retryLink}"
           style="display: inline-block; background: #635bff; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 700; letter-spacing: 0.2px;">
          Retry Payment &rarr;
        </a>
      </div>
      <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-bottom: 24px;">
        If the button doesn't work, copy and paste this link:<br>
        <a href="${params.retryLink}" style="color: #635bff; word-break: break-all;">${params.retryLink}</a>
      </p>` : ''}

      <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you continue to experience issues, please contact our Accounts Receivable team by replying to this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 32px; text-align: center;">
      <p style="margin: 0; font-size: 13px; color: #6b7280;">
        Best regards,<br>
        <strong style="color: #374151;">${params.companyName} — Accounts Receivable Team</strong>
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `
Dear ${params.customerName},

Your payment could not be processed.

  Invoice / Reference : ${params.description}
  Amount              : ${formattedAmount}
  Failure Reason      : ${params.failureReason}

Attempts remaining: ${params.attemptsLeft} of 3
${params.attemptsLeft > 0 ? `\nPlease retry your payment using the link below:\n  ${params.retryLink}` : ''}

If you continue to experience issues, please contact our Accounts Receivable team.

Best regards,
${params.companyName} — Accounts Receivable Team
`.trim();

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"${params.companyName} AR" <${process.env.SMTP_FROM}>`,
    to: params.customerEmail,
    subject,
    text,
    html,
  };

  if (params.arCcEmail) {
    mailOptions.cc = params.arCcEmail;
  }

  await transporter.sendMail(mailOptions);
}

export async function sendReceiptEmail(params: {
  customerName: string;
  customerEmail: string;
  description: string;
  amount: number;
  currency: string;
  paidAt: Date;
  companyName: string;
  arCcEmail: string;
}): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const formattedAmount = formatAmount(params.amount, params.currency);
  const paidAtFormatted = format(params.paidAt, "EEE d MMM yyyy, h:mm a 'UTC'");
  const subject = `Payment Receipt – ${params.description} – ${formattedAmount}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: Arial, sans-serif; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 32px 24px;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">
        ✓ Payment Received
      </h1>
      <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px;">
        Thank you — your payment has been successfully processed.
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 32px;">
      <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6;">
        Dear <strong>${params.customerName}</strong>,
      </p>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #555555;">
        We have received your payment. Please keep this email as your receipt.
      </p>

      <!-- Details Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
        <tr>
          <td style="padding: 13px 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; width: 40%;">
            Invoice / Reference
          </td>
          <td style="padding: 13px 16px; background: #ffffff; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #111827;">
            ${params.description}
          </td>
        </tr>
        <tr>
          <td style="padding: 13px 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280;">
            Amount Paid
          </td>
          <td style="padding: 13px 16px; background: #ffffff; border-bottom: 1px solid #e5e7eb; font-size: 20px; font-weight: 700; color: #059669;">
            ${formattedAmount}
          </td>
        </tr>
        <tr>
          <td style="padding: 13px 16px; background: #f9fafb; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280;">
            Payment Date
          </td>
          <td style="padding: 13px 16px; background: #ffffff; font-size: 14px; color: #111827;">
            ${paidAtFormatted}
          </td>
        </tr>
      </table>

      <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you have any questions about this payment, please contact our Accounts Receivable team by replying to this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 32px; text-align: center;">
      <p style="margin: 0; font-size: 13px; color: #6b7280;">
        Best regards,<br>
        <strong style="color: #374151;">${params.companyName} — Accounts Receivable Team</strong>
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `
Dear ${params.customerName},

Your payment has been successfully received.

  Invoice / Reference : ${params.description}
  Amount Paid         : ${formattedAmount}
  Payment Date        : ${paidAtFormatted}

Please keep this email as your receipt.

If you have any questions, please contact our Accounts Receivable team.

Best regards,
${params.companyName} — Accounts Receivable Team
`.trim();

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"${params.companyName} AR" <${process.env.SMTP_FROM}>`,
    to: params.customerEmail,
    subject,
    text,
    html,
  };

  if (params.arCcEmail) {
    mailOptions.cc = params.arCcEmail;
  }

  await transporter.sendMail(mailOptions);
}
