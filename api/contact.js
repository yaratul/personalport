export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields (name, email, subject, message)' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'a367a5001@smtp-brevo.com';
  const receiverEmail = process.env.BREVO_RECEIVER_EMAIL || 'ratul41g@gmail.com';

  if (!apiKey) {
    console.error('Missing BREVO_API_KEY environment variable.');
    return res.status(500).json({ error: 'Mail server configuration error.' });
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'yaratul.com Contact', email: senderEmail },
        to: [{ email: receiverEmail, name: 'Yaser Ahmmed Ratul' }],
        replyTo: { email: email, name: name },
        subject: `[yaratul.com Contact]: ${subject}`,
        htmlContent: `
          <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0284c7; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-top: 0;">New Inquiry</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Subject:</strong> ${subject}</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #f1f5f9; margin-top: 15px;">
              <p style="margin: 0; font-weight: bold; margin-bottom: 8px; color: #475569;">Message:</p>
              <p style="margin: 0; white-space: pre-line; line-height: 1.5;">${message}</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 0.8rem; color: #64748b; text-align: center; margin: 0;">This email was sent from your portfolio website yaratul.com contact form.</p>
          </div>
        `
      })
    });

    const responseText = await response.text();
    let responseData = {};
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { message: responseText };
    }

    if (!response.ok) {
      console.error('Brevo API Error:', responseData);
      return res.status(response.status).json({ error: responseData.message || 'Failed to send email via Brevo' });
    }

    return res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Serverless mail handler error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
