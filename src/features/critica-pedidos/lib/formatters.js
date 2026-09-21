const numberFormatter = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
});
const decimalFormatter = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
});
export function formatNumber(value) {
    return numberFormatter.format(value);
}
export function formatDecimal(value) {
    return decimalFormatter.format(value);
}
export function formatCurrency(value) {
    return currencyFormatter.format(value);
}
export function formatWeight(value) {
    if (Math.abs(value) >= 1000) {
        return `${formatDecimal(value / 1000)} t`;
    }
    return `${formatNumber(value)} kg`;
}
export function formatVolume(value) {
    return `${formatDecimal(value)} hl`;
}
export function formatPercent(value) {
    return `${formatDecimal(value)}%`;
}
