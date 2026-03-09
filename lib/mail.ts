import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export const sendEmail = async ({
    to,
    subject,
    react,
}: {
    to: string | string[];
    subject: string;
    react: React.ReactElement;
}) => {
    try {
        const { data, error } = await resend.emails.send({
            from: "SnailShop <noreply@yourdomain.com>", // Replace with your verified domain
            to,
            subject,
            react,
        });

        if (error) {
            console.error("Failed to send email:", error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error };
    }
};
