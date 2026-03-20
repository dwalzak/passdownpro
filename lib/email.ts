import nodemailer from 'nodemailer'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.passdownpro.app'
const FROM = process.env.SMTP_FROM ?? 'noreply@passdownpro.app'

// Create reusable SMTP transporter using Office 365 credentials from env
function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,        // smtp.office365.com
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,                       // STARTTLS on port 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      ciphers: 'SSLv3',
    },
  })
}

// ─── Manager notification email ──────────────────────────────────────────────

export async function sendApprovalRequestEmail({
  managerEmail,
  managerName,
  requesterName,
  requesterEmail,
  token,
}: {
  managerEmail: string
  managerName: string
  requesterName: string
  requesterEmail: string
  token: string
}) {
  const approveUrl = `${APP_URL}/api/user-approval?token=${token}&action=approve`
  const denyUrl = `${APP_URL}/api/user-approval?token=${token}&action=deny`

  const transporter = getTransporter()

  await transporter.sendMail({
    from: `"PassdownPro" <${FROM}>`,
    to: managerEmail,
    subject: `Access Request: ${requesterName} wants to join your plant`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #0d0d0f; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 18px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase;">PassdownPro</h1>
        </div>
        <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="margin-top: 0; font-size: 20px;">New Access Request</h2>
          <p style="color: #6b7280;">Hi ${managerName},</p>
          <p style="color: #6b7280;">A new user has requested access to your plant on PassdownPro:</p>

          <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-weight: 700; font-size: 16px;">${requesterName}</p>
            <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">${requesterEmail}</p>
          </div>

          <p style="color: #6b7280; font-size: 14px;">Click one of the buttons below to take action. These links are single-use.</p>

          <table cellpadding="0" cellspacing="0" style="margin-top: 24px;">
            <tr>
              <td style="padding-right: 12px;">
                <a href="${approveUrl}"
                   style="display: inline-block; background: #16a34a; color: #fff; text-decoration: none;
                          font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 8px;
                          text-transform: uppercase; letter-spacing: 0.05em;">
                  ✓ Approve Access
                </a>
              </td>
              <td>
                <a href="${denyUrl}"
                   style="display: inline-block; background: #dc2626; color: #fff; text-decoration: none;
                          font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 8px;
                          text-transform: uppercase; letter-spacing: 0.05em;">
                  ✗ Deny Access
                </a>
              </td>
            </tr>
          </table>

          <p style="color: #9ca3af; font-size: 12px; margin-top: 28px;">
            You can also manage requests in the
            <a href="${APP_URL}/dashboard/team" style="color: #f59e0b;">Team Management</a> page.
          </p>
        </div>
      </div>
    `,
  })
}

// ─── User approved email ──────────────────────────────────────────────────────

export async function sendAccessApprovedEmail({
  userEmail,
  userName,
}: {
  userEmail: string
  userName: string
}) {
  const transporter = getTransporter()

  await transporter.sendMail({
    from: `"PassdownPro" <${FROM}>`,
    to: userEmail,
    subject: 'Your PassdownPro access has been approved ✅',
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #0d0d0f; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 18px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase;">PassdownPro</h1>
        </div>
        <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="margin-top: 0; font-size: 20px;">You're In! 🎉</h2>
          <p style="color: #6b7280;">Hi ${userName},</p>
          <p style="color: #6b7280;">Your access to PassdownPro has been <strong style="color: #16a34a;">approved</strong> by the plant manager. You can now sign in and start submitting shift reports.</p>
          <a href="${APP_URL}/login"
             style="display: inline-block; background: #f59e0b; color: #0d0d0f; text-decoration: none;
                    font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 8px;
                    text-transform: uppercase; letter-spacing: 0.05em; margin-top: 16px;">
            Sign In Now →
          </a>
        </div>
      </div>
    `,
  })
}

// ─── User denied email ────────────────────────────────────────────────────────

export async function sendAccessDeniedEmail({
  userEmail,
  userName,
}: {
  userEmail: string
  userName: string
}) {
  const transporter = getTransporter()

  await transporter.sendMail({
    from: `"PassdownPro" <${FROM}>`,
    to: userEmail,
    subject: 'PassdownPro — Access Request Update',
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #0d0d0f; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 18px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase;">PassdownPro</h1>
        </div>
        <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="margin-top: 0; font-size: 20px;">Access Request Update</h2>
          <p style="color: #6b7280;">Hi ${userName},</p>
          <p style="color: #6b7280;">Unfortunately, your access request has been <strong style="color: #dc2626;">denied</strong> by the plant manager.</p>
          <p style="color: #6b7280; font-size: 14px;">If you believe this is a mistake, please contact your plant manager directly.</p>
        </div>
      </div>
    `,
  })
}
