
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
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2 bg-gradient-to-br from-card to-secondary/30 p-6 rounded-xl shadow-lg border relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500" />
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 bg-fuchsia-500/10 rounded-lg">
              <Palette className="h-8 w-8 text-fuchsia-600 dark:text-fuchsia-400" />
            </div>
            Apariencia del Sistema
          </h2>
          <p className="text-muted-foreground mt-2 pl-1">Personalice la identidad visual y recursos gráficos.</p>
        </div>
      </div>
      <AppearanceForm
        initialSettings={{ loginImage, loginOverlayImage }}
      />
    </div>
  );
}
