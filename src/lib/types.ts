

export type Genero = 'Masculino' | 'Femenino';
export type PatientKind = 'titular' | 'beneficiario';

// --- NEW RBAC (Role-Based Access Control) Types ---
export interface Permission {
  id: string; // e.g., 'users.create'
  name: string; // e.g., 'Create Users'
  description: string;
  module: string; // e.g., 'Usuarios'
}

export interface Role {
  id: number | string;
  name: string;
  description: string;
  hasSpecialty: boolean;
  permissions?: Permission[]; // Populated when fetching a specific role
}
// --- End RBAC Types ---

export interface Specialty {
  id: number | string;
  name: string;
}

export interface User {
  id: number | string;
  username: string;
  role: { id: number | string, name: string };
  specialty?: Specialty;
  personaId?: number | string;
  persona?: Persona;
  name?: string;
  genero?: Genero;
  fechaNacimiento?: Date | string;
}

export interface Persona {
  id: number | string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  nacionalidad?: 'V' | 'E';
  cedulaNumero?: string;
  fechaNacimiento: Date;
  genero: Genero;
  telefono1?: string;
  telefono2?: string;
  email?: string;
  direccion?: string;
  representanteId?: number | string;
  createdAt?: string;
  // Computed properties, not in DB
  nombreCompleto?: string;
  cedula?: string;
}

export interface Paciente {
  id: number | string;
  personaId: number | string;
}

export interface Empresa {
  id: number | string;
  name: string;
  rif: string;
  telefono: string;
  direccion: string;
}

export interface UnidadServicio {
  id: number | string;
  name: string;
  category?: string | null;
  isActive?: boolean;
}

export interface Titular {
  id: number | string;
  personaId: number | string;
  unidadServicio: string;
  unidadServicioId?: number | string | null;
  numeroFicha?: string | null;
  // Denormalized fields for convenience
  persona: Persona;
  beneficiariosCount?: number;
}

export interface Beneficiario {
  id: number | string;
  personaId: number | string;
  titularId: number | string;
  persona: Persona;
  titular?: {
    id: number | string,
    persona: Persona,
  }
}

export interface BeneficiarioConTitular extends Beneficiario {
  titularNombre: string;
}

// For Check-in Search
export interface SearchResult {
  persona: Persona & { nombreCompleto: string; cedula: string; };
  // A person can be a titular, a beneficiary of one or more titulares, or both.
  titularInfo?: {
    id: number | string; // titular record id
    unidadServicio: string;
  };
  beneficiarioDe?: {
    titularId: number | string;
    titularNombre: string;
  }[];
}

// For Patient Queue
export type ServiceType = 'medicina familiar' | 'consulta pediatrica' | 'servicio de enfermeria';
export type AccountType = 'Empleado' | 'Afiliado Corporativo' | 'Privado';
export type PatientStatus =
  | 'Esperando'
  | 'En Consulta'
  | 'Completado'
  | 'Ausente'
  | 'En Tratamiento'
  | 'Cancelado'
  | 'Pospuesto'
  | 'Reevaluacion';


export interface Patient {
  id: number | string; // Unique ID for the queue entry
  personaId: number | string;
  pacienteId: number | string;
  name: string;
  kind: PatientKind;
  serviceType: ServiceType;
  accountType: AccountType;
  status: PatientStatus;
  checkInTime: Date;
  fechaNacimiento: Date;
  genero: Genero;
  isReintegro: boolean;
}


// For EHR / Consultation
export interface Cie10Code {
  code: string;
  description: string;
}

export interface Diagnosis {
  cie10Code: string;
  cie10Description: string;
}

export type DocumentType = 'laboratorio' | 'imagenologia' | 'informe medico' | 'otro';

export interface ConsultationDocument {
  id: number | string;
  consultationId: number | string;
  fileName: string;
  fileType: string;
  documentType: DocumentType;
  description: string;
  fileData: string; // as a data URI
  uploadedAt: Date;
}

export interface CreateConsultationDocumentInput extends Omit<ConsultationDocument, 'id' | 'consultationId' | 'uploadedAt'> { }


export interface SignosVitales {
  taSistolica?: number;
  taDiastolica?: number;
  taBrazo?: 'izquierdo' | 'derecho';
  taPosicion?: 'sentado' | 'acostado';
  fc?: number;
  fcRitmo?: 'regular' | 'irregular';
  fr?: number;
  temp?: number;
  tempUnidad?: 'C' | 'F';
  tempSitio?: 'oral' | 'axilar' | 'rectal' | 'timpanica';
  peso?: number;
  pesoUnidad?: 'kg' | 'lb';
  talla?: number;
  tallaUnidad?: 'cm' | 'in';
  imc?: number;
  satO2?: number;
  satO2Ambiente?: boolean; // true for aire ambiente, false for O2 supplement
  satO2Flujo?: number; // L/min if satO2Ambiente is false
  dolor?: number; // Scale 0-10
}


export interface AntecedentesPersonales {
  patologicos?: string;
  quirurgicos?: string;
  alergicos?: string[];
  alergicosOtros?: string;
  medicamentos?: string;
  habitos?: string[];
  habitosOtros?: string;
}

export interface AntecedentesGinecoObstetricos {
  menarquia?: number;
  ciclos?: string;
  fum?: Date;
  g?: number;
  p?: number;
  a?: number;
  c?: number;
  metodoAnticonceptivo?: string;
  noAplica?: boolean;
}

export interface AntecedentesPediatricos {
  prenatales?: string;
  natales?: string;
  postnatales?: string;
  inmunizaciones?: string;
  desarrolloPsicomotor?: string;
}

export interface MotivoConsulta {
  sintomas: string[];
  otros?: string;
}

// For Treatment Log (Refactored)
export type TreatmentOrderItemStatus = 'Pendiente' | 'Administrado' | 'Omitido' | 'Solo Récipe';
export type TreatmentOrderStatus = 'Pendiente' | 'En Progreso' | 'Completado' | 'Cancelado';

export interface TreatmentExecution {
  id: string;
  treatmentOrderItemId: string;
  executionTime: Date;
  observations: string;
  executedBy: string;
}

export interface TreatmentOrderItem {
  id: string;
  treatmentOrderId: string;
  medicamentoProcedimiento: string;
  dosis?: string;
  via?: string;
  frecuencia?: string;
  duracion?: string;
  instrucciones?: string;
  status: TreatmentOrderItemStatus;
  executions?: TreatmentExecution[];
}

export interface TreatmentOrder {
  id: string;
  pacienteId: string;
  consultationId: string;
  status: TreatmentOrderStatus;
  createdAt: Date;
  items: TreatmentOrderItem[];
  // Denormalized for display
  paciente?: Persona & { nombreCompleto?: string };
  diagnosticoPrincipal?: string;
  orderedBy?: string;
}

export interface CreateTreatmentItemInput extends Omit<TreatmentOrderItem, 'id' | 'treatmentOrderId' | 'status' | 'executions'> {
  requiereAplicacionInmediata?: boolean;
}

export interface Consultation {
  id: string;
  pacienteId: string;
  paciente?: Persona & { nombreCompleto?: string };
  waitlistId?: string;
  consultationDate: Date;
  motivoConsulta?: MotivoConsulta;
  enfermedadActual?: string;
  revisionPorSistemas?: string;
  antecedentesPersonales?: AntecedentesPersonales;
  antecedentesFamiliares?: string;
  antecedentesGinecoObstetricos?: AntecedentesGinecoObstetricos;
  antecedentesPediatricos?: AntecedentesPediatricos;
  signosVitales?: SignosVitales;
  examenFisicoGeneral?: string;
  enfermedadActualNinguno?: boolean;
  revisionPorSistemasNinguno?: boolean;
  treatmentPlan: string;
  treatmentPlanNotApplicable?: boolean;
  diagnosticoLibre?: string;
  diagnosticoLibreNinguno?: boolean;
  reposo?: string;
  diagnoses: Diagnosis[];
  documents?: ConsultationDocument[];
  treatmentOrder?: TreatmentOrder;
  surveyInvitationToken?: string;
  invoice?: Invoice;
  radiologyOrders?: string;
  isReintegro?: boolean;
  occupationalReferral?: any;
}

export interface CreateConsultationInput extends Omit<Consultation, 'id' | 'consultationDate' | 'diagnoses' | 'documents' | 'treatmentOrder' | 'surveyInvitationToken' | 'invoice'> {
  diagnoses: Diagnosis[];
  documents?: CreateConsultationDocumentInput[];
  treatmentItems?: CreateTreatmentItemInput[];
  renderedServices?: Service[];
  radiologyOrder?: string;
  reposo?: string;
  isReintegro?: boolean;
  occupationalReferral?: any;
  enfermedadActualNinguno?: boolean;
  revisionPorSistemasNinguno?: boolean;
  treatmentPlanNotApplicable?: boolean;
  diagnosticoLibre?: string;
  diagnosticoLibreNinguno?: boolean;
}

export interface PacienteConInfo extends Persona {
  roles: string[];
  nombreCompleto: string;
}

export interface CreateTreatmentExecutionInput {
  treatmentOrderItemId: string;
  observations: string;
}

// --- Lab Orders ---
export interface LabOrder {
  id: string;
  pacienteId: string;
  consultationId: string;
  orderDate: Date;
  status: 'Pendiente' | 'Completado';
  tests: string[];
  // Denormalized for display
  paciente: Persona & { nombreCompleto?: string; cedula?: string; };
  diagnosticoPrincipal?: string;
  treatmentPlan?: string;
}

export type HistoryEntry =
  | { type: 'consultation'; data: Consultation }
  | { type: 'lab_order'; data: LabOrder };

// For AI Patient Summary
export interface PatientSummary {
  knownAllergies: string[];
  chronicOrImportantDiagnoses: string[];
  currentMedications: string[];
}

// --- Surveys ---
export type SurveyQuestionType = 'escala_1_5' | 'si_no' | 'texto_abierto';

export interface SurveyQuestion {
  id: string;
  surveyId: string;
  questionText: string;
  questionType: SurveyQuestionType;
  displayOrder: number;
}

export interface Survey {
  id: string;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  questions?: SurveyQuestion[];
}

export interface SurveyInvitation {
  token: string;
  consultationId: string;
  surveyId: string;
  isCompleted: boolean;
  createdAt: Date;
}

export interface SurveyResponse {
  id: string;
  invitationToken: string;
  questionId: string;
  answerValue: string;
  submittedAt: Date;
}

export interface PublicSurveyData {
  survey: Survey;
  consultationDate: Date;
}

// --- Billing ---
export interface Service {
  id: number | string;
  name: string;
  description: string | null;
  price: number | any; // Prisma returns Decimal
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  serviceId: string;
  serviceName: string;
  price: number;
}

export interface Invoice {
  id: string;
  consultationId: string;
  totalAmount: number;
  status: 'Pendiente' | 'Pagada' | 'Anulada';
  createdAt: Date;
  items?: InvoiceItem[];
}


// --- Occupational Health ---
export interface OccupationalHealthEvaluation {
  id: string;
  personaId: string;
  companyId?: string;
  companyName?: string;
  evaluationDate: Date;
  patientType: string;
  consultationPurpose: string;
  jobPosition: string;
  jobDescription: string;
  occupationalRisks: string[] | string; // Array in form, string in DB
  riskDetails: string;
  personalHistory: string;
  familyHistory: string;
  lifestyle: any; // JSON string in DB
  mentalHealth?: string;
  vitalSigns: any; // JSON string in DB
  anthropometry: any; // JSON string in DB
  physicalExamFindings: string;
  diagnoses: Diagnosis[] | string; // Array in form, string in DB
  fitnessForWork: 'Apto' | 'Apto con Restricciones' | 'No Apto';
  occupationalRecommendations: string;
  generalHealthPlan: string;
  interconsultation?: string;
  nextFollowUp?: Date;
}

// --- Reports ---
export interface MorbidityReportRow {
  cie10Code: string;
  cie10Description: string;
  frequency: number;
}

export interface OperationalReportData {
  totalConsultations: number;
  newPeopleRegistered: number;
  consultationsByService: { serviceType: ServiceType; count: number }[];
  demographics: {
    byGender: { men: number; women: number };
    byAgeGroup: { children: number; adults: number; seniors: number };
  };
}

// --- System Settings ---
export interface Setting {
  key: string;
  value: string;
}
