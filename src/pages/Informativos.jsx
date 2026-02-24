import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function Informativos() {
  const [items, setItems] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  const escapeHtml = (s) =>
    String(s || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]))
  const linkify = (text) => {
    const escaped = escapeHtml(text)
    return escaped.replace(/(https?:\/\/[^\s]+)/g, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-[#33C6C5] underline">${url}</a>`)
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('informativos')
        .select('id,title,content,published_at,created_at')
        .order('created_at', { ascending: false })
      if (!mounted) return
      if (error) {
        setErr(error.message)
      } else {
        setItems(data || [])
      }
      setLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [])

  const fmtDate = (iso) => new Date(iso).toLocaleDateString('pt-BR')

  return (
    <div className="px-3 mt-4 space-y-4">
      <div className="text-sm font-bold text-gray-800">Informativos</div>
      {err && <div className="p-2 rounded-md bg-red-100 text-red-700 text-xs">{err}</div>}
      {loading && (
        <>
          {[1,2,3].map(i => (
            <div key={i} className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm text-xs text-gray-700 space-y-2">
              <div className="shimmer h-3 w-48 rounded-md" />
              <div className="shimmer h-3 w-full rounded-md" />
              <div className="shimmer h-3 w-5/6 rounded-md" />
            </div>
          ))}
        </>
      )}
      {items.map(i => (
        <div key={i.id} className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm text-xs text-gray-700 space-y-1">
          <div className="text-gray-800 font-semibold">{i.title}</div>
          <div className="whitespace-pre-line wrap-break-word" dangerouslySetInnerHTML={{ __html: linkify(i.content) }} />
          <div className="text-gray-500">{fmtDate(i.created_at)}</div>
        </div>
      ))}
    </div>
  )
}

export default Informativos
