// app/success/page.js
import { redirect } from 'next/navigation'

export default function Success({ searchParams }) {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(searchParams || {})) {
    if (Array.isArray(v)) v.forEach(val => qs.append(k, val))
    else if (v != null) qs.set(k, v)
  }
  redirect(`/merci2${qs.toString() ? `?${qs.toString()}` : ''}`)
}
