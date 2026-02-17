import SibApiV3Sdk from '@sendinblue/client';
import dotenv from 'dotenv';

dotenv.config();

console.log('='.repeat(60));
console.log('Testing Brevo Email Configuration');
console.log('='.repeat(60));
console.log('API Key:', process.env.BREVO_API_KEY?.substring(0, 20) + '...');
console.log('Sender Email:', process.env.BREVO_SENDER_EMAIL);
console.log('Sender Name:', process.env.BREVO_SENDER_NAME);
console.log('='.repeat(60));

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Set API key using the official method
apiInstance.setApiKey(
  SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

sendSmtpEmail.sender = {
  email: process.env.BREVO_SENDER_EMAIL,
  name: process.env.BREVO_SENDER_NAME,
};
sendSmtpEmail.to = [{ email: process.env.BREVO_SENDER_EMAIL }]; // Send to yourself
sendSmtpEmail.subject = 'Test Email - Auth System Configuration Test';
sendSmtpEmail.htmlContent = `
  <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #4F46E5;">Test Email from Auth System</h2>
      <p>If you receive this email, your Brevo configuration is working correctly!</p>
      <hr>
      <p><strong>Test Details:</strong></p>
      <ul>
        <li>Timestamp: ${new Date().toLocaleString()}</li>
        <li>Sender: ${process.env.BREVO_SENDER_EMAIL}</li>
        <li>API: Brevo/Sendinblue</li>
      </ul>
      <p style="color: #10B981; font-weight: bold;">Everything is configured correctly!</p>
    </body>
  </html>
`;

console.log('\nSending test email...\n');

apiInstance.sendTransacEmail(sendSmtpEmail)
  .then(data => {
    console.log('[SUCCESS] Email sent!');
    console.log('Response data:', JSON.stringify(data, null, 2));
    console.log('\nCheck your inbox:', process.env.BREVO_SENDER_EMAIL);
    console.log('Also check your spam/junk folder if you don\'t see it.');
  })
  .catch(error => {
    console.error('\n[FAILED] Email sending error');
    console.error('Status Code:', error.response?.statusCode);
    console.error('Error Body:', error.response?.body);
    console.error('Error Message:', error.message);
    
    if (error.response?.statusCode === 401) {
      console.error('\n[AUTH ERROR] Authentication Error - Possible causes:');
      console.error('1. Invalid API key');
      console.error('2. API key not active');
      console.error('3. Sender email not verified in Brevo account');
      console.error('\nNext steps:');
      console.error('   - Login to https://app.brevo.com');
      console.error('   - Check API Keys in Settings > SMTP & API');
      console.error('   - Verify sender email in Settings > Senders');
    }
  });
