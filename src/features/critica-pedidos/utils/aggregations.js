export function buildCitySummary(clientes, pedidos) {
    const totalValor = pedidos.reduce((total, pedido) => total + pedido.valor, 0);
    const pedidosByCity = new Map();
    pedidos.forEach((pedido) => {
        const current = pedidosByCity.get(pedido.cidade) ?? [];
        current.push(pedido);
        pedidosByCity.set(pedido.cidade, current);
    });
    const clientsByCity = new Map();
    clientes.forEach((cliente) => {
        const current = clientsByCity.get(cliente.cidade) ?? [];
        current.push(cliente);
        clientsByCity.set(cliente.cidade, current);
    });
    return Array.from(clientsByCity.entries())
        .map(([cidade, cityClientes]) => {
        const cityPedidos = pedidosByCity.get(cidade) ?? [];
        const quantidadePdvs = new Set(cityClientes.map((cliente) => cliente.clienteId)).size;
        const entregas = new Set(cityPedidos.map((pedido) => pedido.pedidoId)).size;
        const caixas = cityPedidos.reduce((total, pedido) => total + pedido.caixas, 0);
        const valor = cityPedidos.reduce((total, pedido) => total + pedido.valor, 0);
        return {
            cidade,
            linear: quantidadePdvs > 0 ? caixas / quantidadePdvs : 0,
            entregas,
            quantidadePdvs,
            pesoClienteKg: cityClientes.reduce((total, cliente) => total + cliente.pesoClienteKg, 0),
            volumeHl: cityPedidos.reduce((total, pedido) => total + pedido.volumeHl, 0),
            caixas,
            valor,
            percentualValor: totalValor > 0 ? (valor / totalValor) * 100 : 0,
        };
    })
        .sort((a, b) => b.valor - a.valor);
}
export function aggregateProdutos(produtos) {
    const totals = produtos.reduce((acc, produto) => ({
        volumeHl: acc.volumeHl + produto.volumeHl,
        caixas: acc.caixas + produto.caixas,
        pesoKg: acc.pesoKg + produto.pesoKg,
        valor: acc.valor + produto.valor,
    }), { volumeHl: 0, caixas: 0, pesoKg: 0, valor: 0 });
    const aggregate = new Map();
    produtos.forEach((produto) => {
        const categoria = produto.categoria ?? "Sem categoria";
        const current = aggregate.get(categoria) ?? {
            categoria,
            volumeHl: 0,
            quantidade: 0,
            caixas: 0,
            pesoKg: 0,
            valor: 0,
            paletesFechados: 0,
        };
        current.quantidade += produto.quantidade;
        current.volumeHl += produto.volumeHl;
        current.caixas += produto.caixas;
        current.pesoKg += produto.pesoKg;
        current.valor += produto.valor;
        current.paletesFechados += produto.paletesFechados;
        aggregate.set(categoria, current);
    });
    return Array.from(aggregate.values())
        .map((produto) => ({
        ...produto,
        percentualVolume: totals.volumeHl > 0 ? (produto.volumeHl / totals.volumeHl) * 100 : 0,
        percentualCaixas: totals.caixas > 0 ? (produto.caixas / totals.caixas) * 100 : 0,
        percentualPeso: totals.pesoKg > 0 ? (produto.pesoKg / totals.pesoKg) * 100 : 0,
        percentualValor: totals.valor > 0 ? (produto.valor / totals.valor) * 100 : 0,
    }))
        .sort((a, b) => b.valor - a.valor);
}
export function rankOffenders(clientes) {
    return [...clientes]
        .sort((a, b) => b.pesoClienteKg + b.valor / 12 - (a.pesoClienteKg + a.valor / 12))
        .slice(0, 8)
        .map((cliente) => ({
        clienteId: cliente.clienteId,
        label: cliente.nome,
        cidade: cliente.cidade,
        pesoClienteKg: cliente.pesoClienteKg,
        volumeHl: cliente.volumeHl,
        caixas: cliente.caixas,
        valor: cliente.valor,
    }));
}
