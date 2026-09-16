export function buildRequestDefaultForm(requestMeta) {
  const requestType = requestMeta?.type_default || "nova_rotina";
  const sourceOptions =
    requestMeta?.source_options_by_type?.[requestType] ||
    requestMeta?.source_options ||
    [];
  const updateOptions =
    requestMeta?.update_options_by_type?.[requestType] ||
    requestMeta?.update_options ||
    [];

  return {
    tipoSolicitacao: requestType,
    solicitante: "",
    rotinaNome: "",
    origemTipo: sourceOptions[0]?.id || "",
    origemDetalhe: "",
    descricaoAtualizacao: "",
    atualizacaoTipo: updateOptions[0]?.id || "",
    atualizacaoDetalhe: "",
  };
}

export function serializeRequestForm(form) {
  return {
    tipo_solicitacao: form.tipoSolicitacao,
    solicitante: form.solicitante,
    rotina_nome: form.rotinaNome,
    origem_tipo: form.origemTipo,
    origem_detalhe: form.origemDetalhe,
    descricao_atualizacao: form.descricaoAtualizacao,
    atualizacao_tipo: form.atualizacaoTipo,
    atualizacao_detalhe: form.atualizacaoDetalhe,
  };
}
