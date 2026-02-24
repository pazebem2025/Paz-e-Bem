import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function AdminInformativos() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [publishedAt, setPublishedAt] = useState('')
  const [err, setErr] = useState('')
  const [confirm, setConfirm] = useState(null)

  const load = async () => {
    const { data, error } = await supabase
      .from('informativos')
      .select('id,title,content,published_at')
      .order('published_at', { ascending: false })
    if (error) setErr(error.message)
    else setItems(data || [])
  }

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
      .order('published_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (error) setErr(error.message)
        else setItems(data || [])
      })
    return () => { active = false }
  }, [navigate])

  const createItem = async () => {
    setErr('')
    const payload = {
      title,
      content,
      published_at: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
    }
    const { error } = await supabase.from('informativos').insert(payload)
    if (error) { setErr(error.message); return }
    try {
      const link = `${window.location.origin}/informativos`
      await supabase.functions.invoke('notify', {
        body: {
          type: 'informativo',
          title,
          url: link,
        },
      })
    } catch (e) {
      console.error(e)
    }
    setTitle('')
    setContent('')
    setPublishedAt('')
    await load()
  }


  const deleteItem = async (id) => {
    setErr('')
    const { error } = await supabase.from('informativos').delete().eq('id', id)
    if (error) { setErr(error.message); return }
    await load()
  }

  return (
    <div className="px-3 mt-4 space-y-4 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-gray-800">Admin • Informativos</div>
        <button className="bg-[#33C6C5] text-white text-xs font-semibold px-4 py-2 rounded-md" onClick={() => navigate('/admin')}>Voltar</button>
      </div>
      {err && <div className="p-2 rounded-md bg-red-100 text-red-700 text-xs">{err}</div>}
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
        <button className="bg-[#33C6C5] text-white text-xs font-semibold px-4 py-2 rounded-md" onClick={createItem}>Criar</button>
      </div>
      <div className="space-y-3">
        {items.map(i => (
          <div key={i.id} className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-2">
            <div className="text-xs font-semibold text-gray-800">{i.title}</div>
            <div className="flex gap-2">
              <button className="bg-[#33C6C5] text-white text-xs font-semibold px-3 py-1 rounded-md" onClick={() => navigate(`/admin/informativos/${i.id}`)}>Editar</button>
              <button className="bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-md" onClick={() => setConfirm(i)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
      {confirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-4 rounded-xl w-80 space-y-3 border border-gray-200">
            <div className="text-sm font-semibold text-gray-800">Confirmar exclusão</div>
            <div className="text-xs text-gray-700">Deseja excluir "{confirm.title}"?</div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 text-xs rounded-md border border-gray-300" onClick={() => setConfirm(null)}>Cancelar</button>
              <button className="bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-md" onClick={() => { deleteItem(confirm.id); setConfirm(null) }}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminInformativos
