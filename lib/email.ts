import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false // Allow self-signed certificates
    }
});

// Log SMTP configuration on startup (without password)
console.log('SMTP Configuration:', {
    host: process.env.SMTP_SERVER,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    from: process.env.FROM_EMAIL,
    configured: !!(process.env.SMTP_SERVER && process.env.SMTP_USER && process.env.SMTP_PASS)
});
