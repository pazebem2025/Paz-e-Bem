import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Divider from "../components/Divider";
import Toast from "../components/Toast";
import { publicationTitles } from "../constants/publicationTitles";

const pad2 = (n) => String(n).padStart(2, "0");
const toDayKey = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const toDayKeyFromIso = (iso) => toDayKey(new Date(iso));
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const isSameMonth = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
const addMonths = (d, delta) => new Date(d.getFullYear(), d.getMonth() + delta, 1);
const weekdayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const findFirstEventKeyInMonth = (eventsByDay, monthDate) => {
  const y = monthDate.getFullYear();
  const m = monthDate.getMonth();
  let best = null;
  for (const k of eventsByDay.keys()) {
    const [ky, km] = k.split("-").map((v) => Number(v));
    if (ky !== y || km !== m + 1) continue;
    if (!best || k < best) best = k;
  }
  return best;
};

const selectDefaultDayForMonth = (eventsByDay, monthDate) => {
  const key = findFirstEventKeyInMonth(eventsByDay, monthDate);
  if (key) return key;
  return toDayKey(startOfMonth(monthDate));
};

function AdminPublicacoes() {
  const navigate = useNavigate()
  const location = useLocation()
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [scheduledAt, setScheduledAt] = useState(() => {
    const now = new Date();
    // adjust for timezone offset manually to get local iso string for input
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  })
  const [scheduledEndAt, setScheduledEndAt] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [existingImageUrl, setExistingImageUrl] = useState(null)
  const [err, setErr] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [toast, setToast] = useState({ visible: false, message: '', type: '' })

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };
  
  useEffect(() => {
    if (location.state?.message) {
      showToast(location.state.message, location.state.type || 'success');
      // Clear the state so it doesn't show again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const [activeMonth, setActiveMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDayKey, setSelectedDayKey] = useState(toDayKey(new Date()));

  const fileInputRef = useRef(null)

  const load = async () => {
    const { data, error } = await supabase
      .from("publicacoes")
      .select("id,title,scheduled_at,scheduled_end_at,image_url,description")
      .order("scheduled_at", { ascending: true });
    if (error) setErr(error.message);
    else setItems(data || []);
  };

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      
      const sessionValid = !!data.session;
      
      const localLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
      const loginTimestamp = localStorage.getItem('loginTimestamp');
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000; // 24 hours
      
      const localValid = localLoggedIn && loginTimestamp && (now - parseInt(loginTimestamp) < oneDay);

      if (!sessionValid && !localValid) {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('loginTimestamp');
        navigate('/login');
        return;
      }
    };
    check();
    let active = true;
    supabase
      .from("publicacoes")
      .select("id,title,scheduled_at,scheduled_end_at,image_url,description")
      .order("scheduled_at", { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setErr(error.message);
        else setItems(data || []);
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  const createItem = async () => {
    setErr("");
    let imageUrl = existingImageUrl;
    if (file) {
      const path = `publicacoes/${Date.now()}-${file.name}`;
      const up = await supabase.storage.from("images").upload(path, file);
      if (up.error) {
        setErr(up.error.message);
        return;
      }
      const pub = supabase.storage.from("images").getPublicUrl(path);
      imageUrl = pub.data.publicUrl;
    }
    const payload = {
      title,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString(),
      scheduled_end_at: scheduledEndAt ? new Date(scheduledEndAt).toISOString() : null,
      image_url: imageUrl,
      description,
    }
    const { error } = await supabase.from('publicacoes').insert(payload)
    if (error) { setErr(error.message); return }
    setTitle('')
    setScheduledAt('')
    setScheduledEndAt('')
    setDescription('')
    setFile(null)
    setExistingImageUrl(null)
    await load()
    showToast("Publicação criada com sucesso!");
  }


  const deleteItem = async (item) => {
    setErr("");
    if (item.image_url && item.image_url.includes("/images/")) {
      const idx = item.image_url.indexOf("/images/");
      const path = item.image_url.slice(idx + 8);
      await supabase.storage.from("images").remove([path]);
    }
    const { error } = await supabase
      .from("publicacoes")
      .delete()
      .eq("id", item.id);
    if (error) {
      setErr(error.message);
      return;
    }
    await load();
    showToast("Publicação excluída com sucesso!");
  };

  const duplicateItem = async (item) => {
    setErr("");
    let newImageUrl = item.image_url;

    // Try to copy image if it's in our storage to avoid issues when deleting
    if (item.image_url && item.image_url.includes("/images/")) {
      try {
        const idx = item.image_url.indexOf("/images/");
        const oldPath = decodeURIComponent(item.image_url.slice(idx + 8));
        const extension = oldPath.split('.').pop();
        const newPath = `publicacoes/${Date.now()}-copy.${extension}`;

        const { error: copyError } = await supabase.storage
          .from("images")
          .copy(oldPath, newPath);

        if (!copyError) {
          const { data: publicUrlData } = supabase.storage
            .from("images")
            .getPublicUrl(newPath);
          newImageUrl = publicUrlData.publicUrl;
        } else {
          console.error("Error copying image:", copyError);
        }
      } catch (e) {
        console.error("Exception copying image:", e);
      }
    }

    const payload = {
      title: item.title,
      scheduled_at: item.scheduled_at,
      scheduled_end_at: item.scheduled_end_at,
      image_url: newImageUrl,
      description: item.description,
    };
    const { data, error } = await supabase
      .from("publicacoes")
      .insert(payload)
      .select()
      .single();
      
    if (error) {
      showToast("Erro ao duplicar publicação: " + error.message, "error");
      return;
    }
    
    navigate(`/admin/publicacoes/${data.id}`, { 
      state: { message: "Publicação duplicada! Edite os detalhes abaixo.", type: "success" } 
    });
  };

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      if (!item?.scheduled_at) continue;
      const start = new Date(item.scheduled_at);
      const end = item.scheduled_end_at ? new Date(item.scheduled_end_at) : null;
      const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endDay =
        end && end.getTime() >= start.getTime()
          ? new Date(end.getFullYear(), end.getMonth(), end.getDate())
          : startDay;

      for (
        let d = new Date(startDay.getTime());
        d.getTime() <= endDay.getTime();
        d.setDate(d.getDate() + 1)
      ) {
        const k = toDayKey(d);
        const list = map.get(k);
        if (list) list.push(item);
        else map.set(k, [item]);
      }
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    }
    return map;
  }, [items]);

  const monthLabel = activeMonth.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const monthLabelTitle = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const firstOfMonth = startOfMonth(activeMonth);
  const firstDow = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - firstDow);

  const days = Array.from({ length: 42 }, (_, idx) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + idx);
    return d;
  });

  const onChangeMonth = (delta) => {
    const next = addMonths(activeMonth, delta);
    setActiveMonth(next);
  };

  const onPickDay = (dayDate) => {
    const key = toDayKey(dayDate);
    setSelectedDayKey(key);
    // Pre-fill the creation date
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const d = new Date(dayDate);
    d.setHours(h, m);
    // adjust for timezone offset manually to get local iso string for input
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setScheduledAt(localIso);
    
    if (!isSameMonth(dayDate, activeMonth)) {
      setActiveMonth(startOfMonth(dayDate));
    }
  };

  const todayKey = toDayKey(new Date());
  
  // Filter items based on selection
  // If a day is selected, show events for that day.
  // If no day is selected (which shouldn't happen with our logic, but just in case), show all?
  // Actually, let's just show the selected day's events.
  const displayedItems = selectedDayKey ? (eventsByDay.get(selectedDayKey) || []) : [];

  return (
    <div className="px-3 mt-4 space-y-4 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-gray-800">
          Admin • Publicações
        </div>
        <button
          className="bg-[#33C6C5] text-white text-xs font-semibold px-4 py-2 rounded-md"
          onClick={() => navigate("/admin")}
        >
          Voltar
        </button>
      </div>
      {err && (
        <div className="p-2 rounded-md bg-red-100 text-red-700 text-xs">
          {err}
        </div>
      )}

      {/* Create Form */}
      <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-2">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-gray-700">Título</div>
          <input className="w-full p-2 text-xs rounded-md border border-gray-300 text-gray-800 placeholder-gray-400" placeholder="Título da publicação" value={title} onChange={e => setTitle(e.target.value)} list="title-suggestions" />
          <datalist id="title-suggestions">
            {publicationTitles.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-700">Início do evento</div>
            <input className="w-full p-2 text-xs rounded-md border border-gray-300 text-gray-800 placeholder-gray-400" type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-700">Fim do evento (opcional)</div>
            <input className="w-full p-2 text-xs rounded-md border border-gray-300 text-gray-800 placeholder-gray-400" type="datetime-local" value={scheduledEndAt} onChange={e => setScheduledEndAt(e.target.value)} />
          </div>
        </div>
        <textarea className="w-full p-2 text-xs rounded-md border border-gray-300 text-gray-800 placeholder-gray-400 min-h-20 resize-y" placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} />
        <div className="space-y-1">
          <div className="text-xs font-semibold text-gray-700">Imagem (opcional)</div>
          <div className="flex items-center gap-2"> 
            <input className="hidden" type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} ref={fileInputRef} />
            <button className="bg-[#33C6C5] hover:bg-[#2bb7b6] text-white text-xs font-semibold px-4 py-2 rounded-md cursor-pointer" onClick={() => fileInputRef.current?.click()}>Escolher arquivo</button>
            {file && <span className="text-xs text-gray-600">{file.name}</span>}
          </div>
        </div>
        <button className="bg-[#33C6C5] text-white text-xs font-semibold px-4 py-2 rounded-md" onClick={createItem}>Criar</button>
      </div>

      <Divider />

      {/* Calendar View */}
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-700">{monthLabelTitle}</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChangeMonth(-1)}
              className="w-9 h-9 rounded-lg border border-gray-200 bg-white text-slate-600 hover:bg-slate-50 active:scale-95 flex items-center justify-center"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onChangeMonth(1)}
              className="w-9 h-9 rounded-lg border border-gray-200 bg-white text-slate-600 hover:bg-slate-50 active:scale-95 flex items-center justify-center"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 text-[11px] text-slate-500 font-semibold">
          {weekdayLabels.map((w) => (
            <div key={w} className="text-center">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((d) => {
            const key = toDayKey(d);
            const inMonth = isSameMonth(d, activeMonth);
            const isSelected = key === selectedDayKey;
            const isToday = key === todayKey;
            const count = eventsByDay.get(key)?.length || 0;

            const base =
              "relative h-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-all active:scale-95";
            const state = isSelected
              ? "bg-[#33C6C5] text-white"
              : inMonth
              ? "bg-slate-50 text-slate-700 hover:bg-slate-100"
              : "bg-white text-slate-300 hover:bg-slate-50";
            const ring = isToday && !isSelected ? "ring-1 ring-purple-300" : "";

            return (
              <button
                key={key}
                type="button"
                onClick={() => onPickDay(d)}
                className={`${base} ${state} ${ring}`}
              >
                {d.getDate()}
                {count > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                      isSelected ? "bg-white text-slate-700" : "bg-purple-600 text-white"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="text-[11px] text-slate-500">
          Selecione um dia para ver ou adicionar publicações
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-slate-700 capitalize">
          {(() => {
            const [y, m, d] = selectedDayKey.split("-").map(Number);
            return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            });
          })()}
        </div>
        {displayedItems.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            Nenhuma publicação neste dia
          </div>
        ) : (
          displayedItems.map((i) => (
            <div
              key={i.id}
              className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-2"
            >
              <div className="text-xs font-semibold text-gray-800">{i.title}</div>
              <div className="text-[10px] text-gray-500">
                {new Date(i.scheduled_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                {i.scheduled_end_at && ` - ${new Date(i.scheduled_end_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
              </div>
              <div className="flex gap-2">
                <button
                  className="bg-[#33C6C5] text-white text-xs font-semibold px-3 py-1 rounded-md"
                  onClick={() => navigate(`/admin/publicacoes/${i.id}`)}
                >
                  Editar
                </button>
                <button
                  className="bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-md"
                  onClick={() => duplicateItem(i)}
                >
                  Duplicar
                </button>
                <button
                  className="bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-md"
                  onClick={() => setConfirm(i)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {confirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-4 rounded-xl w-80 space-y-3 border border-gray-200">
            <div className="text-sm font-semibold text-gray-800">
              Confirmar exclusão
            </div>
            <div className="text-xs text-gray-700">
              Deseja excluir "{confirm.title}"?
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 text-xs rounded-md border border-gray-300"
                onClick={() => setConfirm(null)}
              >
                Cancelar
              </button>
              <button
                className="bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-md"
                onClick={() => {
                  deleteItem(confirm);
                  setConfirm(null);
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
      
      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, visible: false })}
        />
      )}
    </div>
  );
}

export default AdminPublicacoes;
