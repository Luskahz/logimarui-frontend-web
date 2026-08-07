function normalize(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim();
}
function contains(value, search) {
    const normalizedSearch = normalize(search);
    return normalizedSearch.length === 0 || normalize(value).includes(normalizedSearch);
}
function matchesSelected(value, selected) {
    return selected.length === 0 || selected.includes(value ?? "");
}
function matchesCliente(cliente, filters) {
    return (contains(cliente.cidade, filters.cidade) &&
        contains(cliente.bairro, filters.bairro) &&
        contains(cliente.nome, filters.nomeCliente) &&
        contains(cliente.pedidoId, filters.pedido) &&
        matchesSelected(cliente.clienteT, filters.clienteT) &&
        matchesSelected(cliente.tipoCliente, filters.tipoCliente) &&
        matchesSelected(cliente.idadePedido, filters.idade) &&
        matchesSelected(cliente.drop, filters.drop) &&
        matchesSelected(cliente.soma, filters.soma));
}
function matchesPedido(pedido, filters) {
    return (contains(pedido.pedidoId, filters.pedido) &&
        matchesSelected(pedido.motivo, filters.motivo) &&
        matchesSelected(pedido.idadePedido, filters.idadePedido) &&
        matchesSelected(pedido.operacao, filters.operacao) &&
        matchesSelected(pedido.setor, filters.setor) &&
        matchesSelected(pedido.palete, filters.palete) &&
        matchesSelected(pedido.drop, filters.drop) &&
        matchesSelected(pedido.soma, filters.soma));
}
export function applyDashboardFilters(data, filters) {
    const clientesById = new Map(data.clientes.map((cliente) => [cliente.clienteId, cliente]));
    const pedidos = data.pedidos.filter((pedido) => {
        const cliente = clientesById.get(pedido.clienteId);
        return Boolean(cliente) && matchesCliente(cliente, filters) && matchesPedido(pedido, filters);
    });
    const allowedClientIds = new Set(pedidos.map((pedido) => pedido.clienteId));
    const allowedPedidoIds = new Set(pedidos.map((pedido) => pedido.pedidoId));
    const clientes = data.clientes.filter((cliente) => allowedClientIds.has(cliente.clienteId) && matchesCliente(cliente, filters));
    const produtos = data.produtos.filter((produto) => allowedPedidoIds.has(produto.pedidoId));
    return {
        clientes,
        pedidos,
        produtos,
    };
}
