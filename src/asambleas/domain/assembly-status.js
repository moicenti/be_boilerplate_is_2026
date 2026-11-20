export const AssemblyStatus = {
    BORRADOR: 'BORRADOR',
    PROGRAMADA: 'PROGRAMADA',
    ABIERTA: 'ABIERTA',
    CERRADA: 'CERRADA',
};
export function topicStatus(topic, published, now) {
    if (!published)
        return AssemblyStatus.BORRADOR;
    if (now < topic.opensAt)
        return AssemblyStatus.PROGRAMADA;
    if (now < topic.closesAt)
        return AssemblyStatus.ABIERTA;
    return AssemblyStatus.CERRADA;
}
export function assemblyStatus(topics, published, now) {
    if (!published)
        return AssemblyStatus.BORRADOR;
    const statuses = topics.map((topic) => topicStatus(topic, true, now));
    if (statuses.includes(AssemblyStatus.ABIERTA))
        return AssemblyStatus.ABIERTA;
    if (statuses.length > 0 &&
        statuses.every((s) => s === AssemblyStatus.CERRADA)) {
        return AssemblyStatus.CERRADA;
    }
    return AssemblyStatus.PROGRAMADA;
}
