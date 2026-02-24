import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShareIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabaseClient'

function PublicacaoDetalhes() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase
      .from('publicacoes')
      .select('id,title,scheduled_at,scheduled_end_at,image_url,description')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!active) return
        if (error) setErr(error.message)
        else setItem(data)
        setLoading(false)
      })
    return () => { active = false }
  }, [id])

  const fmtTime = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const fmtDate = (iso) => new Date(iso).toLocaleDateString('pt-BR')

  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareMsg = item ? `${item.title} – ${pageUrl}` : pageUrl
  const waLink = `https://wa.me/?text=${encodeURIComponent(shareMsg)}`

  return (
    <div className="px-3 mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-gray-800">Publicação</div>
        <div className="flex items-center gap-2">
          <button className="bg-[#33C6C5] text-white text-xs font-semibold px-4 py-2 rounded-md" onClick={() => navigate(-1)}>Voltar</button>
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="bg-[#BFA5FF] text-gray-700 px-2 py-2 rounded-md hover:bg-[#a88ef0]">
            <ShareIcon className="w-4 h-4" />
          </a>
        </div>
      </div>
      {err && <div className="p-2 rounded-md bg-red-100 text-red-700 text-xs">{err}</div>}
      {loading && (
        <div className="space-y-3">
          <div className="shimmer w-full h-48 rounded-xl" />
          <div className="shimmer h-4 w-56 rounded-md" />
          <div className="shimmer h-3 w-40 rounded-md" />
          <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm text-xs text-gray-700">
            <div className="shimmer h-3 w-full rounded-md" />
            <div className="shimmer h-3 w-11/12 rounded-md mt-2" />
            <div className="shimmer h-3 w-10/12 rounded-md mt-2" />
          </div>
          <div className="shimmer h-8 w-28 rounded-md" />
        </div>
      )}
      {item && (
        <div className="space-y-3">
          <img src={item.image_url || '/banner-padrao.webp'} alt={item.title} className="w-full h-48 rounded-xl object-cover border border-gray-200" />
          <div className="text-lg font-bold text-gray-800 wrap-break-word">{item.title}</div>
          <div className="text-xs text-gray-700">
            {fmtDate(item.scheduled_at)} • {fmtTime(item.scheduled_at)}
            {item.scheduled_end_at ? ` – ${fmtTime(item.scheduled_end_at)}` : ''}
          </div>
          <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm text-xs text-gray-700 whitespace-pre-line wrap-break-word">{item.description}</div>
          
        </div>
      )}
    </div>
  )
}

export default PublicacaoDetalhes
