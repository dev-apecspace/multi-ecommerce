import { redirect } from 'next/navigation'

export default async function ComplaintRedirectPage({ searchParams }: { searchParams: Promise<{ case?: string }> }) {
  const params = await searchParams
  const caseId = params.case ? `?case=${encodeURIComponent(params.case)}` : ''
  redirect(`/client/ho-tro${caseId}`)
}
