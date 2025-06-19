import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
const PORT = 5000;  // Changed to port 5000
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || 'AIzaSyBTonhTarTAjqZWhtuuA3OQgMetfudmQVU');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Middleware
app.use(cors({
  origin: ['https://chatbot-three-eta-74.vercel.app', 'https://chatbot-c23f.vercel.app'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
}));


app.use(express.json());
app.get('/', (req, res) => {
  res.send('✅ Backend is running...');
});


// Email configuration for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'shabbirzain314@gmail.com', // Use your email here
    pass: process.env.EMAIL_PASS || 'your-app-password' // Use your app password here
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000
});
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const prompt = `You are an AI assistant for a professional coaching program website.

Current message: "${message}"

Please respond in a helpful, professional, and encouraging manner.

Use the following response rules depending on what the user is asking:

1. If the user asks about pricing, cost, packages, budget, or what's included — provide the following information:

"Our basic package is affordable and priced at $200. With this package, we'll provide you with 7-8 booked clients who will pay for your services. Our pricing is reasonable, and you can expect to earn at least $1,000 to $2,000 monthly.

Additionally, we're currently offering a special deal until the end of June. For just $250, we'll create a website for your coaching services, tailored to your preferences. This deal also includes 7-8 booked appointments.

We'll assign an experienced appointment setter to work on your behalf, finding clients who are interested in purchasing your coaching program services. We'll utilize platforms such as Facebook, LinkedIn, Gmail, and others to identify potential clients."

You can also visit our website to learn more: https://appointment-studio.netlify.app

2. If the user is asking to book a meeting or consultation, kindly guide them to provide their name and email address.

3. If they ask about coaching services in general, explain the benefits of working with a professional coach — clarity, accountability, and personal growth.

Keep responses friendly, conversational, and under 150 words.`;


    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ response: text });
  } catch (error) {
    console.error('Error with Gemini AI:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});


// Book meeting endpoint (simplified without Calendly)
app.post('/api/book-meeting', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Simulate a successful meeting scheduling with a mock URL
    const schedulingUrl = `https://calendly.com/appointmentstudio1/${Math.random().toString(36).substring(7)}`;

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

    // Email options for client
    const clientEmailOptions = {
      from: process.env.EMAIL_USER || 'shabbirzain314@gmail.com',
      to: email,
      subject: 'Meeting Booking Confirmation - Coaching Program',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Meeting Booking Confirmation</h2>
          <p>Dear ${name},</p>
          <p>Thank you for your interest in our coaching program! We're excited to connect with you.</p>
          <p>Please complete your booking by clicking the link below:</p>
          <a href="${schedulingUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Complete Your Booking</a>
          <p>If you have any questions before our meeting, please don't hesitate to reach out.</p>
          <p>Best regards,<br>The Coaching Team</p>
        </div>
      `
    };

    // Email options for the business owner (yourself)
    const businessEmailOptions = {
      from: process.env.EMAIL_USER || 'shabbirzain314@gmail.com',
      to: process.env.EMAIL_USER || 'shabbirzain314@gmail.com',
      subject: 'New Meeting Booking Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #14B8A6;">New Meeting Booking Request</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Booking Link:</strong> <a href="${schedulingUrl}">${schedulingUrl}</a></p>
          <p>A confirmation email has been sent to the client with the booking link.</p>
        </div>
      `
    };

    // Send email notifications to both the client and the business owner
    try {
      await Promise.all([
        transporter.sendMail(clientEmailOptions),
        transporter.sendMail(businessEmailOptions)
      ]);

      res.json({
        message: 'Meeting booking initiated successfully! Check your email for the booking link.',
        schedulingUrl
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      res.json({
        message: 'Meeting booking link generated successfully! Please use the link below to complete your booking.',
        schedulingUrl,
        note: 'Email notification failed, but your booking link is ready.'
      });
    }
  } catch (error) {
    console.error('Error booking meeting:', error);
    res.status(500).json({ error: 'Failed to book meeting. Please try again.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
