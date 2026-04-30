'use server';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Persona } from '@/lib/types';
import { PatientHistory } from '@/components/patient-history';
import { HceSearch } from '@/components/hce-search';
import { FileText, Telescope, Search, Clock, ChevronRight, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getRecentPatients } from '@/actions/patient-actions';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default async function HcePage() {
  // We make it a server component or use an internal client component.
  // Actually, I'll keep it as a client component but fetch data in a useEffect or use a parent server component.
  // The original was 'use client'.
  // I'll make a Client Component that receives initial data or fetches it.
  
  const recentPatientsData = await getRecentPatients(5);

  return <HceContent recentPatients={recentPatientsData} />;
}

// Internal Client Component
import { HceContent } from './hce-content';
