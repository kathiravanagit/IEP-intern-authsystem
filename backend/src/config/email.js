import SibApiV3Sdk from '@sendinblue/client';

export const sendEmail = async ({ to, subject, htmlContent }) => {
  // Initialize API instance and set API key (done here to ensure env vars are loaded)
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  apiInstance.setApiKey(
    SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY
  );

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.sender = {
    email: process.env.BREVO_SENDER_EMAIL,
    name: process.env.BREVO_SENDER_NAME,
  };
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;

  try {
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`[OK] Email sent successfully to ${to}`);
    return result;
  } catch (error) {
    console.error('[ERROR] Email sending failed:');
    console.error('Status:', error.response?.statusCode);
    console.error('Message:', error.response?.body?.message || error.message);
    console.error('Code:', error.response?.body?.code);
    throw new Error(`Failed to send email: ${error.response?.body?.message || error.message}`);
  }
};