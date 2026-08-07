export function adaptClienteReportRow(row) {
    return {
        clienteId: row.Cliente,
        nome: row.Nome,
        cidade: row.Cidade,
        bairro: row.Bairro,
        tipoCliente: row.Tipo_cliente,
        clienteT: row["Cliente T."],
        latitude: row.Latitude,
        longitude: row.Longitude,
        pesoBrutoKg: row["Peso Bruto"],
        pesoClienteKg: row["Peso Cliente"],
        volumeHl: row.Volume,
        valor: row.Valor,
        caixas: row["Caixa viagem"],
        pedidoId: row.Pedido,
        idadePedido: row.Idade,
        drop: row.Drop,
        soma: row.Soma,
    };
}
export function adaptPedidoReportRow(row) {
    return {
        pedidoId: row.Pedido,
        clienteId: row.Cliente,
        clienteNome: row.Nome,
        cidade: row.Cidade,
        motivo: row.Motivo,
        operacao: row.Operacao,
        setor: row.Setor,
        idadePedido: row["Idade do Pedido"],
        pesoBrutoKg: row["Peso Total"],
        pesoClienteKg: row["Peso Total"],
        volumeHl: row["Volume Marcacao"],
        caixas: row["Caixa viagem"],
        paletesFechados: row.Paletes_Fechados,
        palete: row.Palete,
        valor: row.Valor,
        drop: row.Drop,
        soma: row.Soma,
    };
}
export function adaptProdutoReportRow(row) {
    return {
        codProduto: row["Cod. Prod."],
        nomeProduto: row["Nome Prod."],
        categoria: null,
        quantidade: row.Quantidade,
        caixas: row.Quantidade,
        pesoKg: row["Peso Total"],
        volumeHl: 0,
        valor: 0,
        paletesFechados: row.Paletes_Fechados,
        pedidoId: row.Pedido,
        clienteId: row.Cliente,
    };
}
