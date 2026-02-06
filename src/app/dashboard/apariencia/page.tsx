
import { AppearanceForm } from "@/components/appearance-form";
import { getSettings } from "@/actions/settings-actions";
import { authorize } from "@/lib/auth";
import { redirect } from "next/navigation";

import { Palette } from 'lucide-react';

export default async function AparienciaPage() {
  try {
    await authorize('settings.manage');
  } catch (error) {
    redirect('/dashboard');
  }

  const settings = await getSettings();

  const loginImage = settings.find(s => s.key === 'loginImage')?.value || '';
  const loginOverlayImage = settings.find(s => s.key === 'loginOverlayImage')?.value || '';

  return (
    <div className="flex-1">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Palette className="h-8 w-8 text-primary" />
          </div>
          Apariencia del Sistema
        </h2>
        <p className="text-muted-foreground mt-2 text-lg">Personalice la identidad visual y los recursos gráficos de la aplicación.</p>
      </div>
      <AppearanceForm
        initialSettings={{ loginImage, loginOverlayImage }}
      />
    </div>
  );
}
