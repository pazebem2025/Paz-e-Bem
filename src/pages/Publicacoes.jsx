import { useEffect, useMemo, useState } from "react";
import EventCard from "../components/EventCard";
import Divider from "../components/Divider";
import { supabase } from "../lib/supabaseClient";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

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

function Publicacoes() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeMonth, setActiveMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDayKey, setSelectedDayKey] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("publicacoes")
        .select("id,title,scheduled_at,scheduled_end_at,image_url,description,created_at")
        .order("scheduled_at", { ascending: true });
      if (!mounted) return;
      if (error) {
        setErr(error.message);
      } else {
        const list = data || [];
        setItems(list);

        if (!list.length) {
          setSelectedDayKey((prev) => prev || toDayKey(new Date()));
        } else {
          const now = new Date();
          const upcoming =
            list.find((i) => i?.scheduled_at && new Date(i.scheduled_at) >= now) || list[0];
          const month = startOfMonth(new Date(upcoming.scheduled_at));
          const dayKey = toDayKeyFromIso(upcoming.scheduled_at);
          setActiveMonth(month);
          setSelectedDayKey((prev) => prev || dayKey);
        }
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const fmtTime = (iso) =>
    new Date(iso).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const fmtDate = (iso) => new Date(iso).toLocaleDateString("pt-BR");
  const fmtRange = (startIso, endIso) => {
    if (!endIso) return fmtTime(startIso);
    const start = new Date(startIso);
    const end = new Date(endIso);
    const sameDay =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();
    if (sameDay) return `${fmtTime(startIso)} – ${fmtTime(endIso)}`;
    return `${fmtDate(startIso)} ${fmtTime(startIso)} – ${fmtDate(endIso)} ${fmtTime(endIso)}`;
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

  const selectedEvents = selectedDayKey ? eventsByDay.get(selectedDayKey) || [] : [];
  const todayKey = toDayKey(new Date());

  const onChangeMonth = (delta) => {
    const next = addMonths(activeMonth, delta);
    setActiveMonth(next);
    setSelectedDayKey(selectDefaultDayForMonth(eventsByDay, next));
  };

  const onPickDay = (dayDate) => {
    const key = toDayKey(dayDate);
    setSelectedDayKey(key);
    if (!isSameMonth(dayDate, activeMonth)) {
      setActiveMonth(startOfMonth(dayDate));
    }
  };

  return (
    <div className="px-5 py-6 space-y-4">
      {err && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm font-medium border border-red-200">
          {err}
        </div>
      )}
      {loading && (
        <>
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="shimmer h-4 w-44 rounded" />
              <div className="flex items-center gap-2">
                <div className="shimmer h-8 w-8 rounded-lg" />
                <div className="shimmer h-8 w-8 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className="shimmer h-3 w-full rounded" />
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 42 }, (_, i) => (
                <div key={i} className="shimmer h-10 w-full rounded-lg" />
              ))}
            </div>
          </div>
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-sm overflow-hidden flex animate-pulse"
            >
              <div className="shimmer w-24 h-24" />
              <div className="flex-1 p-4 space-y-3">
                <div className="shimmer h-3 w-32 rounded" />
                <div className="shimmer h-3 w-24 rounded" />
                <div className="shimmer h-2 w-40 rounded" />
              </div>
            </div>
          ))}
        </>
      )}
      {!loading && (
        <>
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-700">{monthLabelTitle}</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChangeMonth(-1)}
                  className="w-9 h-9 rounded-lg border border-gray-200 bg-white text-slate-600 hover:bg-slate-50 active:scale-95 flex items-center justify-center"
                  aria-label="Mês anterior"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChangeMonth(1)}
                  className="w-9 h-9 rounded-lg border border-gray-200 bg-white text-slate-600 hover:bg-slate-50 active:scale-95 flex items-center justify-center"
                  aria-label="Próximo mês"
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
                    aria-label={`${d.toLocaleDateString("pt-BR")} (${count} publicações)`}
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
              Toque em um dia para ver as publicações
            </div>
          </div>

          <Divider />

          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Nenhuma publicação encontrada
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-700">
                {selectedDayKey
                  ? new Date(`${selectedDayKey}T00:00:00`).toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "Selecione um dia"}
              </div>
              {selectedEvents.length > 0 ? (
                selectedEvents.map((i) => (
                  <EventCard
                    key={i.id}
                    title={i.title}
                    time={
                      fmtRange(i.scheduled_at, i.scheduled_end_at)
                    }
                    date={fmtDate(i.scheduled_at)}
                    image={i.image_url || "/banner-padrao.webp"}
                    detailsTo={`/publicacoes/${i.id}`}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Nenhuma publicação neste dia
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Publicacoes;
