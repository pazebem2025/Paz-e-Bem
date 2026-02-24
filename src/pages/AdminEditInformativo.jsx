import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function AdminEditInformativo() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [publishedAt, setPublishedAt] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession()
      
      const sessionValid = !!data.session
      
      const localLoggedIn = localStorage.getItem('adminLoggedIn') === 'true'
      const loginTimestamp = localStorage.getItem('loginTimestamp')
      const now = Date.now()
      const oneDay = 24 * 60 * 60 * 1000 // 24 hours
      
      const localValid = localLoggedIn && loginTimestamp && (now - parseInt(loginTimestamp) < oneDay)

      if (!sessionValid && !localValid) {
        localStorage.removeItem('adminLoggedIn')
        localStorage.removeItem('loginTimestamp')
        navigate('/login')
        return
      }
    }
    check()
    let active = true
    supabase
      .from('informativos')
      .select('id,title,content,published_at')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!active) return
        if (error) setErr(error.message)
        else {
          setItem(data)
          setTitle(data.title || '')
          setContent(data.content || '')
          setPublishedAt(new Date(data.published_at).toISOString().slice(0,16))
        }
      })
    return () => { active = false }
  }, [id, navigate])

  const save = async () => {
    setErr('')
    const payload = {
      title,
      content,
      published_at: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
    }
    const { error } = await supabase.from('informativos').update(payload).eq('id', id)
    if (error) { setErr(error.message); return }
    navigate('/admin/informativos')
  }

  return (
    <div className="px-3 mt-4 space-y-4 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-gray-800">Admin • Editar Informativo</div>
        <button className="bg-[#33C6C5] text-white text-xs font-semibold px-4 py-2 rounded-md" onClick={() => navigate('/admin/informativos')}>Voltar</button>
      </div>
      {err && <div className="p-2 rounded-md bg-red-100 text-red-700 text-xs">{err}</div>}
      {item && (
        <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-2">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-700">Título</div>
            <input className="w-full p-2 text-xs rounded-md border border-gray-300 text-gray-800 placeholder-gray-400" placeholder="Título do informativo" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-700">Conteúdo</div>
            <textarea className="w-full p-2 text-xs rounded-md border border-gray-300 text-gray-800 placeholder-gray-400 min-h-40 resize-y" placeholder="Texto do informativo (links são clicáveis)" value={content} onChange={e => setContent(e.target.value)} />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-700">Data de publicação</div>
            <input className="w-full p-2 text-xs rounded-md border border-gray-300 text-gray-800 placeholder-gray-400" type="datetime-local" value={publishedAt} onChange={e => setPublishedAt(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button className="bg-[#33C6C5] text-white text-xs font-semibold px-4 py-2 rounded-md" onClick={save}>Salvar</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminEditInformativo

