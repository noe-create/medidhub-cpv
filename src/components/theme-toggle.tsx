
'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleCheckedChange = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  // Ensure the toggle is correctly set on initial client render
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return null; // or a skeleton loader
  }

  return (
    <div className="flex items-center space-x-2">
      <Sun className="h-5 w-5 text-amber-500" />
      <Switch
        id="theme-toggle"
        checked={theme === 'dark'}
        onCheckedChange={handleCheckedChange}
        aria-label="Toggle theme"
      />
      <Moon className="h-5 w-5 text-slate-400" />
    </div>
  );
}
