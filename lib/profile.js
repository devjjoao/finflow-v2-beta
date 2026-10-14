"use client";

// -----------------------------------------------------------------------
// FinFlow — funções de perfil do usuário (tabela profiles + Storage)
// -----------------------------------------------------------------------

import { supabase } from "./supabaseClient";

// Tipos de imagem e tamanho máximo aceitos
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Busca o perfil do usuário na tabela profiles.
 */
export async function getProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[profile] erro ao buscar perfil:", error.message);
    return null;
  }
  return data;
}

/**
 * Cria ou atualiza o perfil (upsert por id).
 */
export async function upsertProfile(userId, { fullName }) {
  if (!userId) throw new Error("ID do usuário não fornecido.");

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        full_name: typeof fullName === "string" ? fullName.trim() : "",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) {
    console.error("[profile] erro ao salvar perfil:", error.message);
    throw new Error(error.message);
  }
  return data;
}

/**
 * Valida o arquivo de avatar no client.
 * Retorna mensagem de erro ou null se válido.
 */
export function validateAvatarFile(file) {
  if (!file) return "Nenhum arquivo selecionado.";
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Formato não permitido. Selecione uma imagem JPG, PNG ou WEBP.";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "A imagem excede o tamanho máximo de 2 MB.";
  }
  return null;
}

/**
 * Faz upload do avatar, remove o antigo, e atualiza avatar_url no perfil.
 */
export async function uploadAvatar(userId, file) {
  if (!userId) throw new Error("Usuário não identificado.");
  const validationError = validateAvatarFile(file);
  if (validationError) throw new Error(validationError);

  // Remove arquivo(s) antigo(s) da pasta do usuário para não acumular lixo
  await deleteAvatarFiles(userId);

  // Define extensão e caminho: {userId}/avatar.{ext}
  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1] || "png";
  const filePath = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    console.error("[profile] erro no upload:", uploadError.message);
    throw new Error("Falha ao enviar a foto. Tente novamente.");
  }

  // URL pública com cache-bust para forçar atualização visual
  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  // Atualiza o perfil com a nova URL
  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select();

  if (updateError) {
    console.error("[profile] erro ao atualizar avatar_url:", updateError.message);
    throw new Error("Foto enviada, mas houve erro ao salvar no perfil.");
  }

  // Se a linha ainda não existia, insere
  if (!updated || updated.length === 0) {
    await supabase.from("profiles").insert({
      id: userId,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    });
  }

  return avatarUrl;
}

/**
 * Remove o avatar do Storage e limpa avatar_url no perfil.
 */
export async function removeAvatar(userId) {
  if (!userId) throw new Error("Usuário não identificado.");
  await deleteAvatarFiles(userId);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    console.error("[profile] erro ao remover avatar_url:", error.message);
    throw new Error("Erro ao remover a foto do perfil.");
  }
}

/**
 * Deleta todos os arquivos na pasta do usuário no bucket avatars.
 * Chamado antes de upload ou remoção para não acumular lixo.
 */
export async function deleteAvatarFiles(userId) {
  if (!userId) return;
  const { data: files, error: listError } = await supabase.storage
    .from("avatars")
    .list(userId);

  if (listError) {
    console.error("[profile] erro ao listar arquivos:", listError.message);
    return;
  }

  if (files && files.length > 0) {
    const paths = files.map((f) => `${userId}/${f.name}`);
    const { error: deleteError } = await supabase.storage.from("avatars").remove(paths);
    if (deleteError) {
      console.error("[profile] erro ao deletar arquivos:", deleteError.message);
    }
  }
}
