"use client";

import { useState, useEffect, useRef } from "react";
import {
  Camera,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Lock,
  Upload,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import {
  validateAvatarFile,
  uploadAvatar,
  removeAvatar,
  upsertProfile,
} from "@/lib/profile";
import Avatar from "@/components/Avatar";

export default function ProfilePage() {
  const { user, profile, loadingProfile, refreshProfile } = useAuth();
  const fileInputRef = useRef(null);

  // Estados do formulário de nome
  const [fullName, setFullName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState("");

  // Estados de foto e preview
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState("");
  const [photoError, setPhotoError] = useState("");

  // Sincroniza o nome do perfil quando carregado
  useEffect(() => {
    if (profile?.full_name !== undefined) {
      setFullName(profile.full_name || "");
    } else if (user?.user_metadata?.full_name || user?.user_metadata?.name) {
      setFullName(user.user_metadata.full_name || user.user_metadata.name);
    }
  }, [profile, user]);

  // Limpa o Object URL de preview ao desmontar ou trocar
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Manipula seleção de novo arquivo de foto
  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError("");
    setPhotoSuccess("");

    const error = validateAvatarFile(file);
    if (error) {
      setPhotoError(error);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
  }

  // Cancela o preview pendente
  function handleCancelPreview() {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setPhotoError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Salva a nova foto selecionada no Supabase Storage
  async function handleSavePhoto() {
    if (!selectedFile || !user?.id) return;
    setSavingPhoto(true);
    setPhotoError("");
    setPhotoSuccess("");

    try {
      await uploadAvatar(user.id, selectedFile);
      await refreshProfile();
      handleCancelPreview();
      setPhotoSuccess("Foto de perfil atualizada com sucesso!");
      setTimeout(() => setPhotoSuccess(""), 4000);
    } catch (err) {
      setPhotoError(err.message || "Erro ao enviar foto.");
    } finally {
      setSavingPhoto(false);
    }
  }

  // Remove a foto do Supabase Storage
  async function handleRemovePhoto() {
    if (!user?.id) return;
    setRemovingPhoto(true);
    setPhotoError("");
    setPhotoSuccess("");

    try {
      await removeAvatar(user.id);
      await refreshProfile();
      handleCancelPreview();
      setPhotoSuccess("Foto removida com sucesso!");
      setTimeout(() => setPhotoSuccess(""), 4000);
    } catch (err) {
      setPhotoError(err.message || "Erro ao remover foto.");
    } finally {
      setRemovingPhoto(false);
    }
  }

  // Salva o nome editado
  async function handleSaveName(e) {
    e.preventDefault();
    if (!user?.id) return;
    setSavingName(true);
    setNameError("");
    setNameSuccess(false);

    try {
      await upsertProfile(user.id, { fullName });
      await refreshProfile();
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 4000);
    } catch (err) {
      setNameError(err.message || "Erro ao atualizar nome.");
    } finally {
      setSavingName(false);
    }
  }

  const effectiveAvatarSrc = previewUrl || profile?.avatar_url;
  const hasSavedPhoto = Boolean(profile?.avatar_url);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Cabeçalho da página */}
      <div>
        <h1 className="font-display font-bold text-2xl tracking-tight text-slate-800 dark:text-ink">
          Meu Perfil
        </h1>
        <p className="text-sm text-slate-500 dark:text-ink-muted mt-1">
          Gerencie suas informações pessoais e sua foto de exibição.
        </p>
      </div>

      {/* Cartão de Foto de Perfil */}
      <div className="card p-6 md:p-8 flex flex-col gap-6">
        <div>
          <h2 className="font-display font-semibold text-base text-slate-800 dark:text-ink">
            Foto de Perfil
          </h2>
          <p className="text-xs text-slate-400 dark:text-ink-faint mt-0.5">
            Esta foto será exibida no cabeçalho e nos menus da sua conta.
          </p>
        </div>

        {photoSuccess ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-positive/10 border border-positive/30 text-positive text-sm">
            <Check size={16} className="shrink-0" />
            <span>{photoSuccess}</span>
          </div>
        ) : null}

        {photoError ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-negative/10 border border-negative/30 text-negative text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{photoError}</span>
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar com badge se estiver em preview */}
          <div className="relative shrink-0">
            <Avatar
              src={effectiveAvatarSrc}
              name={fullName}
              email={user?.email}
              size="xl"
              className="ring-4 ring-light-border dark:ring-base-border shadow-md"
            />
            {previewUrl ? (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full bg-brand text-white text-[10px] font-semibold shadow-sm">
                Pré-visualização
              </span>
            ) : null}
          </div>

          <div className="flex-1 flex flex-col gap-3 text-center sm:text-left">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Ações quando há preview pendente */}
            {previewUrl ? (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={handleSavePhoto}
                  disabled={savingPhoto}
                  className="btn-primary"
                >
                  {savingPhoto ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                  <span>{savingPhoto ? "Salvando..." : "Salvar foto"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelPreview}
                  disabled={savingPhoto}
                  className="btn-ghost"
                >
                  <X size={16} />
                  <span>Cancelar</span>
                </button>
              </div>
            ) : (
              /* Ações padrão */
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={savingPhoto || removingPhoto}
                  className="btn-ghost focus-ring"
                >
                  <Camera size={16} />
                  <span>{hasSavedPhoto ? "Trocar foto" : "Escolher foto"}</span>
                </button>

                {hasSavedPhoto ? (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={savingPhoto || removingPhoto}
                    className="btn-ghost !text-negative hover:!border-negative/50 focus-ring"
                    title="Remover foto atual"
                  >
                    {removingPhoto ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    <span>{removingPhoto ? "Removendo..." : "Remover foto"}</span>
                  </button>
                ) : null}
              </div>
            )}

            <p className="text-xs text-slate-400 dark:text-ink-faint">
              Formatos aceitos: JPG, PNG ou WEBP. Tamanho máximo: 2 MB.
            </p>
          </div>
        </div>
      </div>

      {/* Cartão de Informações Pessoais */}
      <div className="card p-6 md:p-8">
        <div className="mb-6">
          <h2 className="font-display font-semibold text-base text-slate-800 dark:text-ink">
            Informações Pessoais
          </h2>
          <p className="text-xs text-slate-400 dark:text-ink-faint mt-0.5">
            Atualize como você prefere ser identificado no FinFlow.
          </p>
        </div>

        {nameSuccess ? (
          <div className="flex items-center gap-2 p-3 mb-5 rounded-lg bg-positive/10 border border-positive/30 text-positive text-sm">
            <Check size={16} className="shrink-0" />
            <span>Nome atualizado com sucesso!</span>
          </div>
        ) : null}

        {nameError ? (
          <div className="flex items-center gap-2 p-3 mb-5 rounded-lg bg-negative/10 border border-negative/30 text-negative text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{nameError}</span>
          </div>
        ) : null}

        <form onSubmit={handleSaveName} className="flex flex-col gap-5">
          {/* Campo Nome */}
          <div>
            <label className="label-eyebrow !px-0 block mb-1.5" htmlFor="fullName">
              Nome de exibição
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setNameSuccess(false);
              }}
              placeholder="Digite seu nome completo"
              maxLength={100}
              className="input"
              disabled={loadingProfile || savingName}
            />
          </div>

          {/* Campo E-mail (somente leitura) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label-eyebrow !px-0 block" htmlFor="email">
                E-mail
              </label>
              <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-ink-faint">
                <Lock size={12} />
                Somente leitura
              </span>
            </div>
            <input
              id="email"
              type="email"
              value={user?.email || ""}
              readOnly
              disabled
              className="input opacity-70 cursor-not-allowed bg-slate-100 dark:bg-base-card"
            />
            <p className="text-[11px] text-slate-400 dark:text-ink-faint mt-1.5">
              O e-mail é utilizado para login e identificação da sua conta.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingName || loadingProfile}
              className="btn-primary w-full sm:w-auto"
            >
              {savingName ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>{savingName ? "Salvando..." : "Salvar alterações"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
