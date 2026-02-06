
import { DoctorManagement } from "@/components/doctor-management";
import { authorize } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRoles } from "@/actions/security-actions";

import { Stethoscope } from 'lucide-react';

export default async function DoctoresPage() {
  try {
    await authorize('users.manage');
  } catch (error) {
    redirect('/dashboard');
  }

  const roles = await getRoles();

  return (
    <div className="h-full">
      <DoctorManagement roles={roles} />
    </div>
  );
}
