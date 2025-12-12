
import { cn } from "@/lib/utils";
import * as React from "react";
import { FormLabel } from "../ui/form";

interface FormSectionProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    action?: React.ReactNode;
}

export const FormSection = ({ title, icon, children, className, action }: FormSectionProps) => (
    <div className={cn("space-y-4 rounded-lg border p-4", className)}>
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium leading-none flex items-center gap-2">
                {icon}
                {title}
            </h3>
            {action}
        </div>
        <div className={cn("space-y-4", icon && "pl-6")}>{children}</div>
    </div>
);
