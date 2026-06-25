'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const suggestMedicalExams = ai.defineFlow(
    {
        name: 'suggestMedicalExams',
        inputSchema: z.object({
            jobTitle: z.string(),
            jobDescription: z.string(),
        }),
        outputSchema: z.object({
            risks: z.array(z.string()),
            suggestedExams: z.array(z.string()),
            reasoning: z.string(),
        }),
    },
    async (input) => {
        const promptText = `
      Actúa como un médico especialista en Salud Ocupacional.
      Analiza el siguiente puesto de trabajo y su descripción:
      
      Puesto: ${input.jobTitle}
      Descripción: ${input.jobDescription}
      
      Identifica los riesgos laborales asociados y sugiere una lista de exámenes médicos ocupacionales recomendados (ingreso/periódicos).
      Devuelve la respuesta en formato JSON con los campos: risks (lista de strings), suggestedExams (lista de strings), y reasoning (breve explicación).
    `;

        const { output } = await ai.generate({
            prompt: promptText,
            output: {
                schema: z.object({
                    risks: z.array(z.string()),
                    suggestedExams: z.array(z.string()),
                    reasoning: z.string(),
                })
            }
        });

        if (!output) {
            throw new Error('Failed to generate medical exams suggestions');
        }

        return output;
    }
);
