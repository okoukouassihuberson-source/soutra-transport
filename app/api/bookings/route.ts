import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

function generateQRCode(): string {
  return `TK-${randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
}

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin()
  try {
    const {
      companyId,
      passengerName,
      passengerPhone,
      tripId,
      seatNumber,
      priceTicket,
      amountReceived,
      paymentMethod,
      conductorId,
    } = await request.json()

    if (!companyId || !passengerName || !seatNumber || !priceTicket) {
      return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 })
    }

    // Vérifier que le siège n'est pas déjà pris pour ce trajet
    if (tripId) {
      const { data: existing } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .eq('trip_id', tripId)
        .eq('seat_number', seatNumber)
        .eq('status', 'confirmed')
        .single()

      if (existing) {
        return NextResponse.json({ error: `Le siège ${seatNumber} est déjà réservé pour ce trajet.` }, { status: 409 })
      }
    }

    const qrCode = generateQRCode()
    const changeReturned = Math.max(0, (amountReceived || priceTicket) - priceTicket)
    const isFraud = amountReceived !== undefined && amountReceived < priceTicket

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert([{
        company_id: companyId,
        trip_id: tripId || null,
        passenger_name: passengerName,
        passenger_phone: passengerPhone || null,
        seat_number: String(seatNumber),
        qr_code: qrCode,
        status: 'confirmed',
        price_ticket: priceTicket,
        amount_received: amountReceived || priceTicket,
        change_returned: changeReturned,
        payment_method: paymentMethod || 'Espèces',
        conductor_id: conductorId || null,
        is_fraud_flag: isFraud,
      }])
      .select()
      .single()

    if (error) throw error

    // Mise à jour des sièges occupés du trajet si applicable
    if (tripId) {
      try {
        await supabaseAdmin.rpc('increment_seats_booked', { trip_id_param: tripId })
      } catch {
        // Fonction SQL optionnelle, on ignore l'erreur
      }
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        qrCode: booking.qr_code,
        passengerName: booking.passenger_name,
        seatNumber: booking.seat_number,
        changeReturned: booking.change_returned,
        isFraud: booking.is_fraud_flag,
      }
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
