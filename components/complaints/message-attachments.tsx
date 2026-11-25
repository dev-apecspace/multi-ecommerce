'use client'

export function ComplaintMessageAttachments({ ids, names, endpoint }: { ids?: string[]; names?: string[]; endpoint: 'client'|'admin' }) {
  if (!ids?.length) return null
  const basePath = endpoint === 'admin' ? '/api/admin/complaints/evidence' : '/api/complaints/evidence'
  return <div className="mt-2 space-y-2">{ids.map((id, index) => {
    const name = names?.[index] || `Tệp ${index + 1}`
    const href = `${basePath}/${id}`
    const image = /\.(jpe?g|png|webp|gif)$/i.test(name)
    return image
      ? <a key={id} href={href} target="_blank" rel="noreferrer" className="block w-fit max-w-full overflow-hidden rounded-lg border bg-white" aria-label={`Mở ảnh ${name}`}><img src={href} alt={name} loading="lazy" className="max-h-72 max-w-full object-contain sm:max-w-sm"/><span className="block truncate px-2 py-1 text-xs text-muted-foreground">{name}</span></a>
      : <a key={id} href={href} target="_blank" rel="noreferrer" className="block text-xs text-orange-700 underline">{name}</a>
  })}</div>
}
