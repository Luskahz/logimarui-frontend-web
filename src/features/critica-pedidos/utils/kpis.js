function sum(values) {
    return values.reduce((total, value) => total + value, 0);
}
export function calculateDashboardKpis(clientes, pedidos) {
    const quantidadePdvs = new Set(clientes.map((cliente) => cliente.clienteId)).size;
    const quantidadePedidos = new Set(pedidos.map((pedido) => pedido.pedidoId)).size;
    const pesoClienteKg = sum(clientes.map((cliente) => cliente.pesoClienteKg));
    const pesoBrutoKg = sum(clientes.map((cliente) => cliente.pesoBrutoKg));
    const volumeHl = sum(pedidos.map((pedido) => pedido.volumeHl));
    const caixas = sum(pedidos.map((pedido) => pedido.caixas));
    const valor = sum(pedidos.map((pedido) => pedido.valor));
    const paletesFechados = sum(pedidos.map((pedido) => pedido.paletesFechados));
    const pedidosComMotivo = pedidos.filter((pedido) => pedido.motivo);
    const motCaixas = sum(pedidosComMotivo.map((pedido) => pedido.caixas));
    const pesoMot = sum(pedidosComMotivo.map((pedido) => pedido.pesoBrutoKg));
    return {
        pesoClienteKg,
        pesoBrutoKg,
        volumeHl,
        quantidadePdvs,
        quantidadePedidos,
        caixas,
        valor,
        paletesFechados,
        cxPltFechado: paletesFechados > 0 ? caixas / paletesFechados : 0,
        linear: quantidadePdvs > 0 ? caixas / quantidadePdvs : 0,
        linearEntregas: quantidadePedidos > 0 ? caixas / quantidadePedidos : 0,
        ansHl: pesoBrutoKg > 0 ? (volumeHl * 100) / pesoBrutoKg : 0,
        motCaixas,
        entreMot: pedidosComMotivo.length,
        pesoMot,
    };
}
