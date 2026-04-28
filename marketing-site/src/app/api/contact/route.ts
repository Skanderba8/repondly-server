import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  const { name, phone, business, message } = await req.json()

  if (!name || !phone) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: `"Répondly Site" <${process.env.SMTP_USER}>`,
    to: process.env.CONTACT_EMAIL,
    subject: `Nouveau prospect: ${name}`,
    html: `
      <h2>Nouveau contact depuis repondly.com</h2>
      <p><strong>Nom:</strong> ${name}</p>
      <p><strong>Téléphone:</strong> ${phone}</p>
      <p><strong>Secteur:</strong> ${business || 'Non précisé'}</p>
      <p><strong>Message:</strong> ${message || 'Aucun'}</p>
    `,
  })

  return NextResponse.json({ success: true })
}