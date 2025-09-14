// app/success/page.js
import { redirect } from 'next/navigation'

export default function Success({ searchParams }) {
  const qs = new URLSearchParams()
  const sp = searchParams ?? {}

  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) v.forEach(val => qs.append(k, String(val)))
    else if (v != null) qs.set(k, String(v))
  }

  redirect(`/merci2${qs.toString() ? `?${qs.toString()}` : ''}`)
}
