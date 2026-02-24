import { useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { NewspaperIcon, MegaphoneIcon, UsersIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabaseClient'

function Admin() {
  const navigate = useNavigate()
  const widgetRef = useRef(null)

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
      }
    }
    check()
  }, [navigate])

  useEffect(() => {
    // Carregar widget de usuários online
    if (widgetRef.current && !document.getElementById("_waurvx")) {
      const script1 = document.createElement("script");
      script1.id = "_waurvx";
      script1.innerHTML = 'var _wau = _wau || []; _wau.push(["dynamic", "yt62indnpd", "rvx", "33c6c5ffffff", "big"]);';
      widgetRef.current.appendChild(script1);

      const script2 = document.createElement("script");
      script2.src = "//waust.at/d.js";
      script2.async = true;
      widgetRef.current.appendChild(script2);
    }
  }, [])

  return (
    <div className="px-3 mt-4 space-y-4 max-w-md mx-auto">
      <div className="text-sm font-bold text-gray-800">Admin</div>
      <div className="grid grid-cols-2 gap-3">
        <Link to="/admin/publicacoes" className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm text-xs font-semibold text-gray-800 flex items-center justify-center gap-2">
          <NewspaperIcon className="w-5 h-5 text-[#33C6C5]" />
          <span>Publicações</span>
        </Link>
        <Link to="/admin/informativos" className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm text-xs font-semibold text-gray-800 flex items-center justify-center gap-2">
          <MegaphoneIcon className="w-5 h-5 text-[#33C6C5]" />
          <span>Informativos</span>
        </Link>
      </div>

      <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
          <UsersIcon className="w-4 h-4 text-[#33C6C5]" />
          <span>Usuários Online</span>
        </div>
        <div ref={widgetRef} className="flex justify-center"></div>
      </div>
    </div>
  )
}

export default Admin

