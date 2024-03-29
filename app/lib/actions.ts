'use server'

//Todas las funciones que se exportan en este archivo son de servidor y por lo tanto no se ejecuta ni se envian al cliente.
import { z } from 'zod'
import { sql } from '@vercel/postgres'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const createInvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string()
})

const createInvoiceFormSchema = createInvoiceSchema.omit({ id: true, date: true })

export async function createInvoice (formData: FormData) {
    // const rawFormData = Object.fromEntries(formData.entries())
    const { customerId, amount, status } = createInvoiceFormSchema.parse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status')
    })

    //transformamos para evitar errores de redondeo
    const amountInCents = amount * 100

    //Creamos la fecha
    const [date] = new Date().toISOString().split('T')

    await sql `
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `

    revalidatePath('/dashboard/invoices')
    redirect('/dashboard/invoices')
}