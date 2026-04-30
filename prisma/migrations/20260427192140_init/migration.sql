-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "hasSpecialty" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" INTEGER NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "specialties" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "roleId" INTEGER NOT NULL,
    "specialtyId" INTEGER,
    "personaId" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas" (
    "id" SERIAL NOT NULL,
    "primerNombre" TEXT NOT NULL,
    "segundoNombre" TEXT,
    "primerApellido" TEXT NOT NULL,
    "segundoApellido" TEXT,
    "nacionalidad" TEXT,
    "cedulaNumero" TEXT,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "genero" TEXT NOT NULL,
    "telefono1" TEXT,
    "telefono2" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "representanteId" INTEGER,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacientes" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades_servicio" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "unidades_servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "titulares" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "unidadServicioId" INTEGER NOT NULL,
    "numeroFicha" TEXT,

    CONSTRAINT "titulares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiarios" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "titularId" INTEGER NOT NULL,

    CONSTRAINT "beneficiarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresas" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "rif" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "pacienteId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL,
    "appointmentId" TEXT,
    "isReintegro" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultations" (
    "id" SERIAL NOT NULL,
    "pacienteId" INTEGER NOT NULL,
    "waitlistId" INTEGER,
    "consultationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivoConsulta" JSONB,
    "enfermedadActual" TEXT,
    "revisionPorSistemas" TEXT,
    "antecedentesPersonales" JSONB,
    "antecedentesFamiliares" TEXT,
    "antecedentesGinecoObstetricos" JSONB,
    "antecedentesPediatricos" JSONB,
    "signosVitales" JSONB,
    "examenFisicoGeneral" TEXT,
    "treatmentPlan" TEXT,
    "radiologyOrders" TEXT,
    "surveyInvitationToken" TEXT,
    "reposo" TEXT,
    "isReintegro" BOOLEAN NOT NULL DEFAULT false,
    "occupationalReferral" JSONB,

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_diagnoses" (
    "id" SERIAL NOT NULL,
    "consultationId" INTEGER NOT NULL,
    "cie10Code" TEXT NOT NULL,
    "cie10Description" TEXT NOT NULL,

    CONSTRAINT "consultation_diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_documents" (
    "id" SERIAL NOT NULL,
    "consultationId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "description" TEXT,
    "fileData" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cie10_codes" (
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "cie10_codes_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "treatment_orders" (
    "id" SERIAL NOT NULL,
    "pacienteId" INTEGER NOT NULL,
    "consultationId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pendiente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "treatment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_order_items" (
    "id" SERIAL NOT NULL,
    "treatmentOrderId" INTEGER NOT NULL,
    "medicamentoProcedimiento" TEXT NOT NULL,
    "dosis" TEXT,
    "via" TEXT,
    "frecuencia" TEXT,
    "duracion" TEXT,
    "instrucciones" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pendiente',

    CONSTRAINT "treatment_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_executions" (
    "id" SERIAL NOT NULL,
    "treatmentOrderItemId" INTEGER NOT NULL,
    "executionTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observations" TEXT NOT NULL,
    "executedBy" TEXT NOT NULL,

    CONSTRAINT "treatment_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_orders" (
    "id" SERIAL NOT NULL,
    "pacienteId" INTEGER NOT NULL,
    "consultationId" INTEGER NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Pendiente',

    CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_order_items" (
    "id" SERIAL NOT NULL,
    "labOrderId" INTEGER NOT NULL,
    "testName" TEXT NOT NULL,

    CONSTRAINT "lab_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surveys" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_questions" (
    "id" SERIAL NOT NULL,
    "surveyId" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,

    CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_invitations" (
    "token" TEXT NOT NULL,
    "consultationId" INTEGER NOT NULL,
    "surveyId" INTEGER NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_invitations_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "survey_responses" (
    "id" SERIAL NOT NULL,
    "invitationToken" TEXT NOT NULL,
    "questionId" INTEGER NOT NULL,
    "answerValue" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" SERIAL NOT NULL,
    "consultationId" INTEGER NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pendiente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_positions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "riskLevel" TEXT,
    "risks" TEXT,

    CONSTRAINT "job_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupational_incidents" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "incidentType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "witnesses" TEXT,
    "actionsTaken" TEXT,
    "reportedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "occupational_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupational_health_evaluations" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "pacienteId" INTEGER,
    "jobPositionId" INTEGER,
    "companyId" INTEGER,
    "evaluationDate" TIMESTAMP(3) NOT NULL,
    "patientType" TEXT NOT NULL,
    "consultationPurpose" TEXT NOT NULL,
    "jobDescription" TEXT,
    "occupationalRisks" TEXT NOT NULL,
    "riskDetails" TEXT NOT NULL,
    "personalHistory" TEXT NOT NULL,
    "familyHistory" TEXT NOT NULL,
    "lifestyle" TEXT NOT NULL,
    "mentalHealth" TEXT,
    "vitalSigns" TEXT NOT NULL,
    "anthropometry" TEXT NOT NULL,
    "physicalExamFindings" TEXT NOT NULL,
    "diagnoses" TEXT NOT NULL,
    "fitnessForWork" TEXT NOT NULL,
    "occupationalRecommendations" TEXT NOT NULL,
    "generalHealthPlan" TEXT NOT NULL,
    "interconsultation" TEXT,
    "nextFollowUp" TIMESTAMP(3),

    CONSTRAINT "occupational_health_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "specialties_name_key" ON "specialties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_personaId_key" ON "users"("personaId");

-- CreateIndex
CREATE INDEX "personas_cedulaNumero_idx" ON "personas"("cedulaNumero");

-- CreateIndex
CREATE INDEX "personas_primerNombre_primerApellido_idx" ON "personas"("primerNombre", "primerApellido");

-- CreateIndex
CREATE UNIQUE INDEX "personas_nacionalidad_cedulaNumero_key" ON "personas"("nacionalidad", "cedulaNumero");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_personaId_key" ON "pacientes"("personaId");

-- CreateIndex
CREATE INDEX "pacientes_personaId_idx" ON "pacientes"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_servicio_name_key" ON "unidades_servicio"("name");

-- CreateIndex
CREATE UNIQUE INDEX "titulares_personaId_key" ON "titulares"("personaId");

-- CreateIndex
CREATE INDEX "titulares_unidadServicioId_idx" ON "titulares"("unidadServicioId");

-- CreateIndex
CREATE UNIQUE INDEX "beneficiarios_personaId_titularId_key" ON "beneficiarios"("personaId", "titularId");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_rif_key" ON "empresas"("rif");

-- CreateIndex
CREATE INDEX "waitlist_status_idx" ON "waitlist"("status");

-- CreateIndex
CREATE INDEX "waitlist_checkInTime_idx" ON "waitlist"("checkInTime");

-- CreateIndex
CREATE INDEX "waitlist_pacienteId_idx" ON "waitlist"("pacienteId");

-- CreateIndex
CREATE INDEX "consultations_consultationDate_idx" ON "consultations"("consultationDate");

-- CreateIndex
CREATE INDEX "consultations_pacienteId_idx" ON "consultations"("pacienteId");

-- CreateIndex
CREATE UNIQUE INDEX "survey_invitations_consultationId_key" ON "survey_invitations"("consultationId");

-- CreateIndex
CREATE UNIQUE INDEX "services_name_key" ON "services"("name");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_consultationId_key" ON "invoices"("consultationId");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "specialties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_representanteId_fkey" FOREIGN KEY ("representanteId") REFERENCES "personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulares" ADD CONSTRAINT "titulares_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulares" ADD CONSTRAINT "titulares_unidadServicioId_fkey" FOREIGN KEY ("unidadServicioId") REFERENCES "unidades_servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiarios" ADD CONSTRAINT "beneficiarios_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiarios" ADD CONSTRAINT "beneficiarios_titularId_fkey" FOREIGN KEY ("titularId") REFERENCES "titulares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_waitlistId_fkey" FOREIGN KEY ("waitlistId") REFERENCES "waitlist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_diagnoses" ADD CONSTRAINT "consultation_diagnoses_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_documents" ADD CONSTRAINT "consultation_documents_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_orders" ADD CONSTRAINT "treatment_orders_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_orders" ADD CONSTRAINT "treatment_orders_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_order_items" ADD CONSTRAINT "treatment_order_items_treatmentOrderId_fkey" FOREIGN KEY ("treatmentOrderId") REFERENCES "treatment_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_executions" ADD CONSTRAINT "treatment_executions_treatmentOrderItemId_fkey" FOREIGN KEY ("treatmentOrderItemId") REFERENCES "treatment_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_order_items" ADD CONSTRAINT "lab_order_items_labOrderId_fkey" FOREIGN KEY ("labOrderId") REFERENCES "lab_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_invitations" ADD CONSTRAINT "survey_invitations_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_invitations" ADD CONSTRAINT "survey_invitations_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_invitationToken_fkey" FOREIGN KEY ("invitationToken") REFERENCES "survey_invitations"("token") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "survey_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupational_incidents" ADD CONSTRAINT "occupational_incidents_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupational_incidents" ADD CONSTRAINT "occupational_incidents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupational_health_evaluations" ADD CONSTRAINT "occupational_health_evaluations_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupational_health_evaluations" ADD CONSTRAINT "occupational_health_evaluations_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupational_health_evaluations" ADD CONSTRAINT "occupational_health_evaluations_jobPositionId_fkey" FOREIGN KEY ("jobPositionId") REFERENCES "job_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupational_health_evaluations" ADD CONSTRAINT "occupational_health_evaluations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
