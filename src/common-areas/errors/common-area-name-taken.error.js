export class CommonAreaNameTakenError extends Error {
    areaName;
    constructor(areaName) {
        super(`Ya existe un área común activa llamada "${areaName}".`);
        this.areaName = areaName;
        this.name = 'CommonAreaNameTakenError';
    }
}
