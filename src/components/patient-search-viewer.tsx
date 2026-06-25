'use client';

import * as React from 'react';
import { HceSearch } from './hce-search';
import { Persona } from '@/lib/types';
import { getFullPersonaProfile } from '@/actions/patient-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { calculateAge } from '@/lib/utils';
import { Loader2, User, Phone, MapPin, Mail, Calendar, Activity, ClipboardList, ShieldAlert, Award } from 'lucide-react';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function PatientSearchViewer() {
    const [selectedPersonaId, setSelectedPersonaId] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [profile, setProfile] = React.useState<any>(null);

    const handleSelect = async (persona: Persona | null) => {
        if (!persona) {
            setSelectedPersonaId(null);
            setProfile(null);
            return;
        }
        setSelectedPersonaId(persona.id);
        setLoading(true);
        try {
            const data = await getFullPersonaProfile(persona.id);
            setProfile(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl text-primary font-bold">Buscador Universal de Pacientes</CardTitle>
                    <CardDescription>Busque cualquier persona registrada por nombre completo o cédula.</CardDescription>
                </CardHeader>
                <CardContent>
                    <HceSearch onPersonaSelect={handleSelect} className="max-w-2xl" />
                </CardContent>
            </Card>

            {loading && (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                </div>
            )}

            {!loading && profile && profile.persona && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Tarjeta Principal de Datos Personales */}
                    <Card className="col-span-1 md:col-span-2 border-border/50 shadow-md overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <User className="h-32 w-32" />
                        </div>
                        <CardHeader className="bg-gradient-to-r from-blue-500/10 to-transparent border-b border-border/50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge variant="outline" className="mb-2 bg-blue-50 text-blue-700 border-blue-200">Datos Personales</Badge>
                                    <CardTitle className="text-3xl font-extrabold text-foreground mb-1">
                                        {profile.persona.nombreCompleto}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                        <span>C.I. {profile.persona.cedula}</span>
                                        <span>•</span>
                                        <span>{calculateAge(profile.persona.fechaNacimiento)} años</span>
                                        <span>•</span>
                                        <span>{profile.persona.genero}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-muted-foreground mt-4">
                                        Registrado el {format(new Date(profile.persona.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
                                <div className="p-6 space-y-4">
                                    <h4 className="font-bold text-foreground/80 flex items-center gap-2 mb-4">
                                        <Phone className="h-4 w-4 text-primary" /> Contacto
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="font-semibold w-24 text-muted-foreground shrink-0">Teléfono 1:</div>
                                            <div className="font-medium text-foreground">{profile.persona.telefono1 || 'No especificado'}</div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="font-semibold w-24 text-muted-foreground shrink-0">Teléfono 2:</div>
                                            <div className="font-medium text-foreground">{profile.persona.telefono2 || 'No especificado'}</div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="font-semibold w-24 text-muted-foreground shrink-0">Email:</div>
                                            <div className="font-medium text-foreground flex items-center gap-2">
                                                {profile.persona.email ? (
                                                    <>
                                                        <Mail className="h-3 w-3 opacity-50" />
                                                        {profile.persona.email}
                                                    </>
                                                ) : 'No especificado'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <h4 className="font-bold text-foreground/80 flex items-center gap-2 mb-4">
                                        <MapPin className="h-4 w-4 text-emerald-500" /> Ubicación
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="font-semibold w-24 text-muted-foreground shrink-0">Nacionalidad:</div>
                                            <div className="font-medium text-foreground">{profile.persona.nacionalidad === 'V' ? 'Venezolano(a)' : profile.persona.nacionalidad === 'E' ? 'Extranjero(a)' : 'No especificado'}</div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="font-semibold w-24 text-muted-foreground shrink-0">Fecha Nac.:</div>
                                            <div className="font-medium text-foreground flex items-center gap-2">
                                                <Calendar className="h-3 w-3 opacity-50" />
                                                {format(profile.persona.fechaNacimiento, "dd/MM/yyyy")}
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="font-semibold w-24 text-muted-foreground shrink-0">Dirección:</div>
                                            <div className="font-medium text-foreground leading-relaxed">{profile.persona.direccion || 'No especificada'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Roles y Dependencias */}
                    <Card className="border-border/50 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <ShieldAlert className="h-24 w-24" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Award className="h-5 w-5 text-indigo-500" /> Relaciones en Sistema
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Como Titular</h4>
                                {profile.titularInfo ? (
                                    <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge className="bg-indigo-500">Es Titular</Badge>
                                        </div>
                                        <div className="text-sm space-y-1">
                                            <p><span className="font-medium text-muted-foreground">Unidad Servicio:</span> {profile.titularInfo.unidadServicio}</p>
                                            <p><span className="font-medium text-muted-foreground">Número de Ficha:</span> {profile.titularInfo.numeroFicha || 'N/A'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-foreground/50 italic">No está registrado como titular.</p>
                                )}
                            </div>

                            <div className="h-px bg-border/50 w-full" />

                            <div>
                                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Como Beneficiario</h4>
                                {profile.beneficiarioInfo && profile.beneficiarioInfo.length > 0 ? (
                                    <div className="space-y-3">
                                        {profile.beneficiarioInfo.map((b: any, i: number) => (
                                            <div key={i} className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-xl p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge className="bg-amber-500">Es Beneficiario</Badge>
                                                </div>
                                                <div className="text-sm">
                                                    <p><span className="font-medium text-muted-foreground">Dependiente de Titular:</span> {b.titularNombre}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-foreground/50 italic">No es beneficiario de ningún titular.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actividad / Consultas Recientes */}
                    <Card className="border-border/50 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Activity className="h-24 w-24" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ClipboardList className="h-5 w-5 text-emerald-500" /> Actividad Reciente
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {profile.waitlistHistory && profile.waitlistHistory.length > 0 ? (
                                <div className="space-y-4">
                                    {profile.waitlistHistory.slice(0, 5).map((w: any, index: number) => (
                                        <div key={w.id} className="flex justify-between items-start pb-3 border-b border-border/50 last:border-0 last:pb-0">
                                            <div>
                                                <div className="font-medium text-sm text-foreground">{w.serviceType}</div>
                                                <div className="text-xs text-muted-foreground flex gap-2 items-center mt-1">
                                                    <span>{format(w.checkInTime, "dd/MM/yy hh:mm a")}</span>
                                                    <span>•</span>
                                                    <Badge variant="outline" className="text-[10px] py-0">{w.status}</Badge>
                                                </div>
                                            </div>
                                            <div className="text-xs font-medium text-right">
                                                <div className="text-foreground/70">{w.kind.toUpperCase()}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {profile.waitlistHistory.length > 5 && (
                                        <div className="text-xs text-center text-muted-foreground pt-2">
                                            Mostrando 5 de {profile.waitlistHistory.length} registros en atención.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-sm text-muted-foreground mb-1">Sin actividad reciente</p>
                                    <p className="text-xs text-foreground/50">El paciente aún no ha sido ingresado a sala de espera.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
