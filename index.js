app.post('/api/book-meeting', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Simulate a successful meeting scheduling with a mock URL
    const schedulingUrl = `http://localhost:5000/booking/${Math.random().toString(36).substring(7)}`;

    // Verify the transporter before sending emails
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError);
      return res.json({
        message: 'Meeting booking link generated successfully! Please use the link below to complete your booking.',
        schedulingUrl,
        note: 'Email notifications are temporarily unavailable.'
      });
    }

    // Email sending logic here...
    
    // Send the email notifications
    await Promise.all([
      transporter.sendMail(clientEmailOptions),
      transporter.sendMail(businessEmailOptions)
    ]);

    res.json({
      message: 'Meeting booking initiated successfully! Check your email for the booking link.',
      schedulingUrl,
      status: 'Backend is running correctly!'  // Added status here
    });
  } catch (error) {
    console.error('Error booking meeting:', error);
    res.status(500).json({ error: 'Failed to book meeting. Please try again.' });
  }
});
