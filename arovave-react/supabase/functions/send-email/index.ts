// @ts-ignore - Deno runtime import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// @ts-ignore - Deno runtime API
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "Arovave Global <noreply@arovave.com>";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email templates
const getWelcomeEmail = (userName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Arovave Global</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background-color: #000000; padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px;">
          AROVAVE GLOBAL
        </h1>
        <p style="color: #888888; margin: 10px 0 0 0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
          Direct Factory Access
        </p>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 50px 30px;">
        <h2 style="color: #000000; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">
          Welcome, ${userName}! 🎉
        </h2>
        <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
          Thank you for joining Arovave Global. You've just unlocked direct access to verified Indian manufacturers.
        </p>
        <div style="background-color: #f8f8f8; border-radius: 12px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #000000; margin: 0 0 15px 0; font-size: 16px; font-weight: 700;">
            What You Can Do Now:
          </h3>
          <ul style="color: #666666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>Browse our curated product catalog</li>
            <li>Submit enquiries directly to manufacturers</li>
            <li>Track your enquiry status in real-time</li>
            <li>Get factory-direct pricing without middlemen</li>
          </ul>
        </div>
        <a href="https://arovave.com/catalog" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
          Browse Products
        </a>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
        <p style="color: #999999; font-size: 12px; margin: 0;">
          Arovave Global Exports<br>
          MDH 5/25, Sector H, Jankipuram, Lucknow, UP 226021
        </p>
        <p style="color: #999999; font-size: 11px; margin: 15px 0 0 0;">
          © 2024 Arovave Global. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const getEnquiryEmail = (userName: string, productName: string, enquiryId: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enquiry Received - Arovave Global</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background-color: #000000; padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px;">
          AROVAVE GLOBAL
        </h1>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 50px 30px;">
        <div style="background-color: #dcfce7; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 25px;">
          <span style="font-size: 30px;">✓</span>
        </div>
        <h2 style="color: #000000; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">
          Enquiry Received!
        </h2>
        <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
          Hi ${userName}, we've received your enquiry and our team is reviewing it.
        </p>
        <div style="background-color: #f8f8f8; border-radius: 12px; padding: 25px; margin: 25px 0;">
          <p style="color: #999999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">
            Enquiry #${enquiryId}
          </p>
          <h3 style="color: #000000; margin: 0 0 15px 0; font-size: 18px; font-weight: 700;">
            ${productName}
          </h3>
          <p style="color: #666666; font-size: 14px; margin: 0;">
            Status: <span style="background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">Pending Review</span>
          </p>
        </div>
        <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 25px 0;">
          <strong>What happens next?</strong><br>
          Our team will contact you within 24-48 hours with factory details, pricing, and next steps.
        </p>
        <a href="https://arovave.com/enquiries" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
          Track Enquiry
        </a>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
        <p style="color: #999999; font-size: 12px; margin: 0;">
          Questions? Reply to this email or contact us at export@arovave.com
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const getEnquiryUpdateEmail = (userName: string, productName: string, enquiryId: number, newStatus: string) => {
  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    'pending': { bg: '#fef3c7', text: '#92400e', label: 'Pending Review' },
    'contacted': { bg: '#dbeafe', text: '#1e40af', label: 'Contacted' },
    'completed-win': { bg: '#dcfce7', text: '#166534', label: 'Completed - Success' },
    'completed-loss': { bg: '#fee2e2', text: '#991b1b', label: 'Completed' },
    'cancelled': { bg: '#f3f4f6', text: '#374151', label: 'Cancelled' },
  };
  const status = statusColors[newStatus] || statusColors['pending'];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enquiry Update - Arovave Global</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background-color: #000000; padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px;">
          AROVAVE GLOBAL
        </h1>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 50px 30px;">
        <h2 style="color: #000000; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">
          Enquiry Status Updated
        </h2>
        <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
          Hi ${userName}, there's an update on your enquiry.
        </p>
        <div style="background-color: #f8f8f8; border-radius: 12px; padding: 25px; margin: 25px 0;">
          <p style="color: #999999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">
            Enquiry #${enquiryId}
          </p>
          <h3 style="color: #000000; margin: 0 0 15px 0; font-size: 18px; font-weight: 700;">
            ${productName}
          </h3>
          <p style="color: #666666; font-size: 14px; margin: 0;">
            New Status: <span style="background-color: ${status.bg}; color: ${status.text}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${status.label}</span>
          </p>
        </div>
        <a href="https://arovave.com/enquiries" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
          View Details
        </a>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
        <p style="color: #999999; font-size: 12px; margin: 0;">
          Questions? Contact us at export@arovave.com
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

const getPasswordChangedEmail = (userName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed - Arovave Global</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background-color: #000000; padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px;">
          AROVAVE GLOBAL
        </h1>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 50px 30px;">
        <div style="background-color: #dbeafe; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 25px;">
          <span style="font-size: 30px;">🔒</span>
        </div>
        <h2 style="color: #000000; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">
          Password Changed Successfully
        </h2>
        <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
          Hi ${userName}, your password has been successfully updated.
        </p>
        <div style="background-color: #fef3c7; border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #f59e0b;">
          <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 500;">
            ⚠️ If you didn't make this change, please contact us immediately at export@arovave.com
          </p>
        </div>
        <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
          Changed on: ${new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
        <p style="color: #999999; font-size: 12px; margin: 0;">
          This is an automated security notification.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, to, userName, productName, enquiryId, newStatus } = await req.json();

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    if (!to || !type) {
      throw new Error("Missing required fields: to, type");
    }

    let subject = "";
    let html = "";

    switch (type) {
      case "welcome":
        subject = "Welcome to Arovave Global! 🎉";
        html = getWelcomeEmail(userName || "there");
        break;
      case "enquiry":
        subject = `Enquiry Received - ${productName || "Product"}`;
        html = getEnquiryEmail(userName || "there", productName || "Product", enquiryId || 0);
        break;
      case "enquiry-update":
        subject = `Enquiry Update - ${productName || "Your Enquiry"}`;
        html = getEnquiryUpdateEmail(userName || "there", productName || "Product", enquiryId || 0, newStatus || "pending");
        break;
      case "password-changed":
        subject = "Password Changed - Arovave Global";
        html = getPasswordChangedEmail(userName || "there");
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Email send error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
