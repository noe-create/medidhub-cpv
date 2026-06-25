import { RoleManagement } from "@/components/role-management";

import { ShieldCheck } from 'lucide-react';

export default async function RolesPage() {
    return (
        <div className="space-y-4">
            <RoleManagement />
        </div>
    );
}
