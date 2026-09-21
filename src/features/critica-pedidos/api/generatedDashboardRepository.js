import clientesGenerated from "@/features/critica-pedidos/data/generated/clientes.generated.json";
import metadataGenerated from "@/features/critica-pedidos/data/generated/metadata.generated.json";
import pedidosGenerated from "@/features/critica-pedidos/data/generated/pedidos.generated.json";
import produtosGenerated from "@/features/critica-pedidos/data/generated/produtos.generated.json";
const clientes = clientesGenerated;
const pedidos = pedidosGenerated;
const produtos = produtosGenerated;
function uniqueSorted(values) {
    return Array.from(new Set(values.filter((value) => Boolean(value)))).sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
}
function buildFilterOptions() {
    return {
        motivo: uniqueSorted(pedidos.map((pedido) => pedido.motivo)),
        idadePedido: uniqueSorted(pedidos.map((pedido) => pedido.idadePedido)),
        cidade: uniqueSorted(clientes.map((cliente) => cliente.cidade)),
        bairro: uniqueSorted(clientes.map((cliente) => cliente.bairro)),
        clienteT: uniqueSorted(clientes.map((cliente) => cliente.clienteT)),
        operacao: uniqueSorted(pedidos.map((pedido) => pedido.operacao)),
        setor: uniqueSorted(pedidos.map((pedido) => pedido.setor)),
        tipoCliente: uniqueSorted(clientes.map((cliente) => cliente.tipoCliente)),
        palete: uniqueSorted(pedidos.map((pedido) => pedido.palete)),
        drop: uniqueSorted(clientes.map((cliente) => cliente.drop)),
        soma: uniqueSorted(clientes.map((cliente) => cliente.soma)),
        idade: uniqueSorted(clientes.map((cliente) => cliente.idadePedido)),
    };
}
export const generatedDashboardRepository = {
    getClientes: () => clientes,
    getPedidos: () => pedidos,
    getProdutos: () => produtos,
    getFilterOptions: buildFilterOptions,
};
export const dashboardMetadata = metadataGenerated;
