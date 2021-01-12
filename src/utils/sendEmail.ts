import nodemailer from 'nodemailer';

export const sendEmail = async (to: string, subject:string, html: string) => {

  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: '"Example" <example@gmail.com>',
    to,
    subject,
    html,
  });
};
