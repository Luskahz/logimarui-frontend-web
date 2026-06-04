function resolveProfileNameSource(profile) {
  return [
    profile?.username,
    profile?.userName,
    profile?.user_name,
    profile?.name,
    profile?.fullName,
    profile?.displayName,
    profile?.nome,
    profile?.nomeUsuario,
    profile?.nome_usuario,
  ].find((value) => typeof value === "string" && value.trim());
}

export function resolveSessionRoles(profile) {
  if (Array.isArray(profile?.roles) && profile.roles.length > 0) {
    return profile.roles;
  }

  return Array.isArray(profile?.authorities) ? profile.authorities : [];
}

export function resolveAuthorities(profile) {
  const candidates = [
    ...(Array.isArray(profile?.authorities) ? profile.authorities : []),
    ...(Array.isArray(profile?.roles) ? profile.roles : []),
  ];

  return Array.from(new Set(candidates.map(String)));
}

export function buildAvatarLabel(profile) {
  const nameSource = resolveProfileNameSource(profile);

  if (nameSource) {
    return nameSource.trim().slice(0, 2).toUpperCase();
  }

  return "LG";
}

export function resolveProfileName(profile) {
  const nameSource = resolveProfileNameSource(profile);

  return nameSource ? nameSource.trim() : "Conta Logimarui";
}

export function resolveAvatarUrl(profile) {
  const imageSource = [
    profile?.avatarUrl,
    profile?.photoUrl,
    profile?.imageUrl,
    profile?.profileImageUrl,
  ].find((value) => typeof value === "string" && value.trim());

  return imageSource ? imageSource.trim() : "";
}
