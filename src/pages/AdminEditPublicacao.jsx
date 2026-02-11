import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function AdminEditPublicacao() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduledEndAt, setScheduledEndAt] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [err, setErr] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      const ok =
        !!data.session || localStorage.getItem("adminLoggedIn") === "true";
      if (!ok) {
        navigate("/login");
        return;
      }
    };
    check();
    let active = true;
    supabase
      .from("publicacoes")
      .select("id,title,scheduled_at,scheduled_end_at,image_url,description")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setErr(error.message);
        else {
          setItem(data);
          setTitle(data.title || "");
          setScheduledAt(
            new Date(data.scheduled_at).toISOString().slice(0, 16),
          );
          setScheduledEndAt(
            data.scheduled_end_at
              ? new Date(data.scheduled_end_at).toISOString().slice(0, 16)
              : "",
          );
          setDescription(data.description || "");
        }
      });
    return () => {
      active = false;
    };
  }, [id, navigate]);

  const save = async () => {
    setErr("");
    let imageUrl = item?.image_url || null;
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
      scheduled_at: scheduledAt
        ? new Date(scheduledAt).toISOString()
        : new Date().toISOString(),
      scheduled_end_at: scheduledEndAt
        ? new Date(scheduledEndAt).toISOString()
        : null,
      description,
      image_url: imageUrl,
    };
    const { error } = await supabase
      .from("publicacoes")
      .update(payload)
      .eq("id", id);
    if (error) {
      setErr(error.message);
      return;
    }
    navigate("/admin/publicacoes");
  };

  return (
    <div className="px-3 mt-4 space-y-4 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-gray-800">
          Admin • Editar Publicação
        </div>
        <button
          className="bg-[#33C6C5] text-white text-xs font-semibold px-4 py-2 rounded-md"
          onClick={() => navigate("/admin/publicacoes")}
        >
          Voltar
        </button>
      </div>
      {err && (
        <div className="p-2 rounded-md bg-red-100 text-red-700 text-xs">
          {err}
        </div>
      )}
      {item && (
        <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-2">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-700">Título</div>
            <input
              className="w-full p-2 text-xs rounded-md border border-gray-300 text-gray-800 placeholder-gray-400"
              placeholder="Título da publicação"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-700">
              Início do evento
            </div>
            <input
              className="w-full p-2 text-xs rounded-md border border-gray-300 text-gray-800 placeholder-gray-400"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-700">
              Fim do evento (opcional)
            </div>
            <input
              className="w-full p-2 text-xs rounded-md border border-gray-300 text-gray-800 placeholder-gray-400"
              type="datetime-local"
              value={scheduledEndAt}
              onChange={(e) => setScheduledEndAt(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-700">Descrição</div>
            <textarea
              className="w-full p-2 text-xs rounded-md border border-gray-300 text-gray-800 placeholder-gray-400 min-h-40 resize-y"
              placeholder="Detalhes da publicação"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-700">
              Imagem (opcional)
            </div>
            <div className="flex items-center gap-2">
              <input
                className="hidden"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                ref={fileInputRef}
              />
              <button
                className="bg-[#33C6C5] hover:bg-[#2bb7b6] text-white text-xs font-semibold px-4 py-2 rounded-md cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                Escolher arquivo
              </button>
              {file && (
                <span className="text-xs text-gray-600">{file.name}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="bg-[#33C6C5] text-white text-xs font-semibold px-4 py-2 rounded-md"
              onClick={save}
            >
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminEditPublicacao;
