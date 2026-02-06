import React from 'react';
import { cn } from '@/lib/utils';

interface PageCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    borderless?: boolean;
}

export function PageCard({ children, className, borderless = false, ...props }: PageCardProps) {
    return (
        <div
            className={cn(
                "w-full h-full bg-card rounded-3xl shadow-sm p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 border border-border/50",
                borderless && "shadow-none bg-transparent p-0 border-none",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );

}
