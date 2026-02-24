import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const checkLogin = () => {
      const localLoggedIn = localStorage.getItem('adminLoggedIn') === 'true'
      const loginTimestamp = localStorage.getItem('loginTimestamp')
      const now = Date.now()
      const oneDay = 24 * 60 * 60 * 1000 // 24 hours
      
      const localValid = localLoggedIn && loginTimestamp && (now - parseInt(loginTimestamp) < oneDay)

      if (localValid) {
        navigate('/admin')
      }
    }
    checkLogin()
  }, [navigate])

  const FIXED_USER = 'matrizcc'
  const FIXED_PASS = 'admin123'
  const FIXED_EMAIL = 'matrizcc'

  const onSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    const input = email.trim()
    const pass = password.trim()
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input,
        password: pass,
      })
      if (error) {
        // fallback para login local fixo
        if (!((input === FIXED_USER || input === FIXED_EMAIL) && pass === FIXED_PASS)) {
          setErr('Credenciais inválidas')
          return
        }
        localStorage.setItem('adminLoggedIn', 'true')
        localStorage.setItem('loginTimestamp', Date.now().toString())
        navigate('/admin')
        return
      }
      if (data?.session) {
        localStorage.setItem('adminLoggedIn', 'true')
        localStorage.setItem('loginTimestamp', Date.now().toString())
        navigate('/admin')
        return
      }
      setErr('Não foi possível autenticar')
    } catch {
      setErr('Falha ao autenticar')
    }
  }

  return (
    <div className="px-3 mt-4 space-y-3">
      <h1 className="text-xl font-bold text-gray-800">Login</h1>
      {err && <div className="p-2 rounded-md bg-red-100 text-red-700 text-xs">{err}</div>}
      <form className="space-y-2" onSubmit={onSubmit}>
        <input className="w-full p-2 text-xs rounded-md border border-gray-300" placeholder="Usuário ou e-mail" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full p-2 text-xs rounded-md border border-gray-300" placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="bg-[#33C6C5] text-white text-xs font-semibold px-4 py-2 rounded-md">Entrar</button>
      </form>
    </div>
  )
}

export default Login
