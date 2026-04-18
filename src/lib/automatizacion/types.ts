export type EstadoJob = 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADO' | 'FALLIDO' | 'REQUIERE_MANUAL'

export interface ResultadoAutomatizacion {
  ok: boolean
  refOrganismo?: string
  screenshotUrls: string[]
  logs: string[]
  error?: string
}

export interface DatosNacimiento {
  nombre: string
  apellido1: string
  apellido2?: string
  fechaNacimiento: string
  lugarNacimiento: string
  provinciaNacimiento: string
  nombrePadre?: string
  nombreMadre?: string
  tipoCertificado: string   // 'Literal' | 'Extracto' | 'Plurilingüe'
  finalidad: string
  // Tipo de solicitante en el formulario MJ:
  //   '1' = Inscrito (el propio interesado)  '4' = Tercero (default CertiDocs)
  tipoSolicitante?: '1' | '4'
  // Calidad del tercero (solo si tipoSolicitante='4'):
  //   '1'=Familiar '2'=Representante legal '3'=Autorizado '4'=Otros
  calidadTercero?: '1' | '2' | '3' | '4'
  solNombre: string
  solApellido1: string
  solApellido2?: string
  solDni: string
  solTelefono: string
  solDireccion: string
  solCp: string
  solMunicipio: string
  solProvincia: string
}

export interface DatosMatrimonio {
  c1Nombre: string
  c1Apellido1: string
  c1Apellido2?: string
  c2Nombre: string
  c2Apellido1: string
  c2Apellido2?: string
  fechaMatrimonio: string
  lugarMatrimonio: string
  provinciaMatrimonio: string
  tipoCertificado: string
  finalidad: string
  solNombre: string
  solApellido1: string
  solApellido2?: string
  solDni: string
  solTelefono: string
  solDireccion: string
  solCp: string
  solMunicipio: string
  solProvincia: string
}

export interface DatosDefuncion {
  nombre: string
  apellido1: string
  apellido2?: string
  fechaDefuncion: string
  lugarDefuncion: string
  provinciaDefuncion: string
  nombrePadre?: string
  nombreMadre?: string
  tipoCertificado: string
  finalidad: string
  solNombre: string
  solApellido1: string
  solApellido2?: string
  solDni: string
  solTelefono: string
  solDireccion: string
  solCp: string
  solMunicipio: string
  solProvincia: string
}

export interface DatosAntecedentesPenales {
  // Datos del interesado (persona sobre quien se solicita el certificado)
  nombre: string
  apellido1: string
  apellido2?: string
  fechaNacimiento: string
  tipoDocumento: 'DNI' | 'NIE' | 'Pasaporte'
  numeroDocumento: string
  // Opciones del certificado
  finalidad: string
  modalidad: 'Ordinario' | 'Urgente'
  // Solicitante
  solNombre: string
  solApellido1: string
  solApellido2?: string
  solDni: string
  solTelefono: string
  solDireccion: string
  solCp: string
  solMunicipio: string
  solProvincia: string
}

export interface DatosVidaLaboral {
  // El informe se solicita en nombre del propio afiliado autenticado en Cl@ve
  tipoInforme?: 'completo' | 'fecha'
  fechaConsulta?: string   // DD/MM/YYYY — solo si tipoInforme === 'fecha'
  metodoEnvio?: 'email' | 'postal' | 'descarga'
  emailEnvio?: string      // si metodoEnvio === 'email' y difiere del autenticado
  // Datos del solicitante (para logs y trazabilidad)
  solNombre: string
  solApellido1: string
  solApellido2?: string
  solDni: string
  solTelefono: string
  solDireccion: string
  solCp: string
  solMunicipio: string
  solProvincia: string
  solEmail: string
}

export interface DatosFallecido {
  nombre: string
  apellido1: string
  apellido2?: string
  fechaDefuncion: string
  lugarDefuncion: string
  provinciaDefuncion: string
  finalidad: string
  solNombre: string
  solApellido1: string
  solApellido2?: string
  solDni: string
  solTelefono: string
  solDireccion: string
  solCp: string
  solMunicipio: string
  solProvincia: string
}
