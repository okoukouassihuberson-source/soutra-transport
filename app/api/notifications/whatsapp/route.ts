import { NextResponse } from 'next/server'

/**
 * ROUTE API : Envoi de Billet via WhatsApp (Twilio)
 * 
 * CONFIGURATION REQUISE dans .env.local :
 * TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
 * TWILIO_AUTH_TOKEN="your_auth_token"
 * TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"  (Numéro Twilio Sandbox ou Business)
 * NEXT_PUBLIC_APP_URL="https://votre-domaine.com"  (Pour le lien QR)
 */

export async function POST(request: Request) {
  try {
    const { 
      passengerPhone, 
      passengerName, 
      ticketId, 
      seatNumber,
      route: tripRoute, 
      carPlate,
      price,
      departureTime,
      companyName
    } = await request.json()

    // Validation des champs
    if (!passengerPhone || !ticketId || !passengerName) {
      return NextResponse.json({ error: "Numéro de téléphone, nom et ID du ticket sont obligatoires." }, { status: 400 })
    }

    // Normalisation du numéro (format Côte d'Ivoire : 0X XX XX XX XX -> +225 0X XX XX XX XX)
    let normalizedPhone = passengerPhone.replace(/[\s\-().]/g, '')
    if (normalizedPhone.startsWith('0') && !normalizedPhone.startsWith('+')) {
      normalizedPhone = '+225' + normalizedPhone
    } else if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+225' + normalizedPhone
    }

    const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${ticketId}`
    
    // Message formaté pour le passager
    const messageBody = `
✅ *VOTRE BILLET SOUTRA TRANSPORT*
━━━━━━━━━━━━━━━━━━━━━
🚌 *Compagnie :* ${companyName}
👤 *Passager :* ${passengerName}
🛣️ *Trajet :* ${tripRoute}
🚗 *Car :* ${carPlate}
💺 *Siège N° :* ${seatNumber}
⏰ *Départ :* ${departureTime}
💰 *Tarif :* ${price} FCFA
━━━━━━━━━━━━━━━━━━━━━
🔖 *Code de Billet : ${ticketId}*

Scannez ce lien à l'embarquement :
${ticketUrl}

*Conservez ce message jusqu'à votre arrivée à destination.*
`.trim()

    // Vérification des crédentials Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM

    if (!accountSid || !authToken || !fromNumber) {
      // Mode Dégradé : On retourne le lien WhatsApp Web pour usage manuel
      const whatsappLink = `https://wa.me/${normalizedPhone.replace('+', '')}?text=${encodeURIComponent(messageBody)}`
      return NextResponse.json({ 
        success: false, 
        degradedMode: true,
        whatsappLink,
        message: "Twilio non configuré. Utilisez ce lien WhatsApp Web pour envoi manuel."
      })
    }

    // Appel à l'API Twilio pour envoi automatique
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    const twilioBody = new URLSearchParams({
      From: fromNumber,
      To: `whatsapp:${normalizedPhone}`,
      Body: messageBody,
    })

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: twilioBody,
    })

    const twilioData = await twilioResponse.json()

    if (!twilioResponse.ok) {
      throw new Error(twilioData.message || "Erreur Twilio lors de l'envoi.")
    }

    return NextResponse.json({ 
      success: true, 
      messageSid: twilioData.sid,
      message: `Billet envoyé avec succès sur ${normalizedPhone}`
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
