// app/merci/page.tsx
import { redirect } from 'next/navigation'

export default function Merci({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(searchParams || {})) {
    if (Array.isArray(v)) v.forEach(val => qs.append(k, val))
    else if (v != null) qs.set(k, v)
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  redirect(`/merci2${suffix}`)
}
