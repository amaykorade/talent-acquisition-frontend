import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SmtpClient } from 'npm:nodemailer';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, html } = await req.json() as EmailPayload;

    const smtp = new SmtpClient({
      host: Deno.env.get('SMTP_HOST'),
      port: Number(Deno.env.get('SMTP_PORT')),
      secure: true,
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASS'),
      },
    });

    await smtp.sendMail({
      from: Deno.env.get('SMTP_FROM'),
      to,
      subject,
      html,
    });

    return new Response(
      JSON.stringify({ message: 'Email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});