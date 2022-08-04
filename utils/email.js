const nodemailer = require('nodemailer');

const sendEmail = async options => {
  //Create a transporter

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  //configure email options
  const emailOptions = {
    from: 'Gaurav Deshwal <gaurav.deshwal@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
  };
  //send email
  await transporter.sendMail(emailOptions);
};

module.exports = sendEmail;
