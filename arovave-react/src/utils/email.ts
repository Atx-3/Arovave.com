import { supabase } from '../lib/supabase';

type EmailType = 'welcome' | 'enquiry' | 'enquiry-update' | 'password-changed';

interface SendEmailParams {
    type: EmailType;
    to: string;
    userName?: string;
    productName?: string;
    enquiryId?: number;
    newStatus?: string;
}

/**
 * Send email via Supabase Edge Function
 * This function calls the send-email edge function which uses Resend API
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
    try {
        const { data, error } = await supabase.functions.invoke('send-email', {
            body: params
        });

        if (error) {
            console.error('❌ Error sending email:', error);
            return false;
        }

        console.log('✅ Email sent successfully:', data);
        return true;
    } catch (err) {
        console.error('❌ Email send failed:', err);
        return false;
    }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
    return sendEmail({
        type: 'welcome',
        to: email,
        userName
    });
}

/**
 * Send enquiry confirmation email
 */
export async function sendEnquiryEmail(
    email: string,
    userName: string,
    productName: string,
    enquiryId: number
): Promise<boolean> {
    return sendEmail({
        type: 'enquiry',
        to: email,
        userName,
        productName,
        enquiryId
    });
}

/**
 * Send enquiry status update email
 */
export async function sendEnquiryUpdateEmail(
    email: string,
    userName: string,
    productName: string,
    enquiryId: number,
    newStatus: string
): Promise<boolean> {
    return sendEmail({
        type: 'enquiry-update',
        to: email,
        userName,
        productName,
        enquiryId,
        newStatus
    });
}

/**
 * Send password changed confirmation email
 */
export async function sendPasswordChangedEmail(email: string, userName: string): Promise<boolean> {
    return sendEmail({
        type: 'password-changed',
        to: email,
        userName
    });
}
