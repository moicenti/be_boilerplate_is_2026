export class AreaComunesResponseDto {
  areaId!: number;
  nombre!: string;
  reservas!: number;
  horasReservadas!: number;
  porcentaje!: number;

  static fromEntity(input: {
    areaId: number;
    nombre: string;
    reservas: number;
    horasReservadas: number;
    porcentaje: number;
  }): AreaComunesResponseDto {
    const dto = new AreaComunesResponseDto();
    dto.areaId = input.areaId;
    dto.nombre = input.nombre;
    dto.reservas = input.reservas;
    dto.horasReservadas = parseFloat(input.horasReservadas.toFixed(1));
    dto.porcentaje = parseFloat(input.porcentaje.toFixed(1));
    return dto;
  }
}
